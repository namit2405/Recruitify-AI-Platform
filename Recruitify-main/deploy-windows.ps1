# Recruitify Windows Deployment Script
# Domain: recruitify.namits.shop
# Run as Administrator

#Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"

Write-Host "=========================================="  -ForegroundColor Cyan
Write-Host "Recruitify Windows Deployment"  -ForegroundColor Cyan
Write-Host "Domain: recruitify.namits.shop"  -ForegroundColor Cyan
Write-Host "=========================================="  -ForegroundColor Cyan
Write-Host ""

# Function to print colored output
function Write-Success {
    param($Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param($Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Info {
    param($Message)
    Write-Host "→ $Message" -ForegroundColor Yellow
}

# Check prerequisites
Write-Info "Checking prerequisites..."

$pythonInstalled = Get-Command python -ErrorAction SilentlyContinue
$nodeInstalled = Get-Command node -ErrorAction SilentlyContinue
$psqlInstalled = Get-Command psql -ErrorAction SilentlyContinue

if (-not $pythonInstalled) {
    Write-Error-Custom "Python is not installed. Please install Python 3.11+ from python.org"
    exit 1
}

if (-not $nodeInstalled) {
    Write-Error-Custom "Node.js is not installed. Please install Node.js 18+ from nodejs.org"
    exit 1
}

if (-not $psqlInstalled) {
    Write-Error-Custom "PostgreSQL is not installed. Please install PostgreSQL from postgresql.org"
    exit 1
}

Write-Success "All prerequisites found"

# Get configuration from user
Write-Host ""
Write-Info "Please provide the following information:"
Write-Host ""

$serverIP = Read-Host "Server Public IP Address"
$dbPassword = Read-Host "Database Password" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))

$djangoSecret = Read-Host "Django Secret Key (leave empty to generate)"
if ([string]::IsNullOrWhiteSpace($djangoSecret)) {
    $djangoSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 50 | ForEach-Object {[char]$_})
    Write-Success "Generated Django secret key"
}

$emailHost = Read-Host "Email Host (e.g., smtp.gmail.com)"
$emailUser = Read-Host "Email User"
$emailPassword = Read-Host "Email Password" -AsSecureString
$emailPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($emailPassword))

$groqKey = Read-Host "Groq API Key"

Write-Host ""

# Create application directory
Write-Info "Creating application directory..."
$appDir = "C:\inetpub\recruitify"
New-Item -ItemType Directory -Path $appDir -Force | Out-Null
Write-Success "Application directory created"

# Copy project files
Write-Info "Copying project files..."
$currentDir = Get-Location
Copy-Item -Path "$currentDir\*" -Destination $appDir -Recurse -Force -Exclude @('.git', 'node_modules', 'venv', '__pycache__', '*.pyc')
Write-Success "Project files copied"

# Setup PostgreSQL database
Write-Info "Setting up PostgreSQL database..."
$env:PGPASSWORD = "postgres"
$createDbScript = @"
CREATE DATABASE recruitify_db;
CREATE USER recruitify_user WITH PASSWORD '$dbPasswordPlain';
GRANT ALL PRIVILEGES ON DATABASE recruitify_db TO recruitify_user;
"@

$createDbScript | & psql -U postgres -h localhost 2>&1 | Out-Null
Write-Success "Database created"

# Setup backend
Write-Info "Setting up backend..."
Set-Location "$appDir\backend"

# Create virtual environment
python -m venv venv
& ".\venv\Scripts\Activate.ps1"

# Install dependencies
pip install --upgrade pip --quiet
pip install -r requirements.txt --quiet
pip install waitress psycopg2-binary python-dotenv --quiet

# Create production environment file
$envContent = @"
DEBUG=False
SECRET_KEY=$djangoSecret
ALLOWED_HOSTS=recruitify.namits.shop,www.recruitify.namits.shop,localhost,127.0.0.1

DATABASE_ENGINE=django.db.backends.postgresql
DATABASE_NAME=recruitify_db
DATABASE_USER=recruitify_user
DATABASE_PASSWORD=$dbPasswordPlain
DATABASE_HOST=localhost
DATABASE_PORT=5432

CORS_ALLOWED_ORIGINS=https://recruitify.namits.shop,https://www.recruitify.namits.shop

EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=$emailHost
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=$emailUser
EMAIL_HOST_PASSWORD=$emailPasswordPlain

GROQ_API_KEY=$groqKey

MEDIA_ROOT=$appDir\backend\media
STATIC_ROOT=$appDir\backend\staticfiles
"@

Set-Content -Path ".env.production" -Value $envContent

# Run migrations
Write-Info "Running database migrations..."
python manage.py migrate --noinput
python manage.py collectstatic --noinput

Write-Success "Backend setup complete"

# Setup frontend
Write-Info "Setting up frontend..."
Set-Location "$appDir\frontend"

# Create production environment file
$frontendEnv = @"
VITE_API_BASE_URL=https://recruitify.namits.shop/api
VITE_WS_BASE_URL=wss://recruitify.namits.shop/ws
"@

Set-Content -Path ".env.production" -Value $frontendEnv

# Install dependencies and build
npm install --silent
npm run build

Write-Success "Frontend built successfully"

# Create Windows Services using NSSM
Write-Info "Creating Windows services..."

# Check if NSSM is installed
$nssmPath = "C:\nssm\nssm.exe"
if (-not (Test-Path $nssmPath)) {
    Write-Info "NSSM not found. Please download from https://nssm.cc/download"
    Write-Info "Extract to C:\nssm\ and run this script again"
    Write-Info "Or manually create services using the guide"
} else {
    # Create backend service script
    $backendScript = @"
Set-Location '$appDir\backend'
& '.\venv\Scripts\python.exe' -m waitress --listen=127.0.0.1:8000 backend.wsgi:application
"@
    Set-Content -Path "$appDir\backend\start-backend.ps1" -Value $backendScript

    # Create backend service
    & $nssmPath install RecruitifyBackend powershell.exe
    & $nssmPath set RecruitifyBackend AppParameters "-ExecutionPolicy Bypass -File $appDir\backend\start-backend.ps1"
    & $nssmPath set RecruitifyBackend AppDirectory "$appDir\backend"
    & $nssmPath set RecruitifyBackend DisplayName "Recruitify Backend"
    & $nssmPath set RecruitifyBackend Start SERVICE_AUTO_START
    & $nssmPath start RecruitifyBackend

    # Create WebSocket service script
    $daphneScript = @"
Set-Location '$appDir\backend'
& '.\venv\Scripts\daphne.exe' -b 127.0.0.1 -p 8001 backend.asgi:application
"@
    Set-Content -Path "$appDir\backend\start-daphne.ps1" -Value $daphneScript

    # Create WebSocket service
    & $nssmPath install RecruitifyWebSocket powershell.exe
    & $nssmPath set RecruitifyWebSocket AppParameters "-ExecutionPolicy Bypass -File $appDir\backend\start-daphne.ps1"
    & $nssmPath set RecruitifyWebSocket AppDirectory "$appDir\backend"
    & $nssmPath set RecruitifyWebSocket DisplayName "Recruitify WebSocket"
    & $nssmPath set RecruitifyWebSocket Start SERVICE_AUTO_START
    & $nssmPath start RecruitifyWebSocket

    Write-Success "Windows services created and started"
}

# Create web.config for IIS
Write-Info "Creating IIS configuration..."
$webConfig = @'
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="Redirect www to non-www" stopProcessing="true">
                    <match url="(.*)" />
                    <conditions>
                        <add input="{HTTP_HOST}" pattern="^www\.recruitify\.namits\.shop$" />
                    </conditions>
                    <action type="Redirect" url="https://recruitify.namits.shop/{R:1}" redirectType="Permanent" />
                </rule>
                <rule name="API Proxy" stopProcessing="true">
                    <match url="^api/(.*)" />
                    <action type="Rewrite" url="http://127.0.0.1:8000/api/{R:1}" />
                </rule>
                <rule name="WebSocket Proxy" stopProcessing="true">
                    <match url="^ws/(.*)" />
                    <action type="Rewrite" url="http://127.0.0.1:8001/ws/{R:1}" />
                </rule>
                <rule name="Admin Proxy" stopProcessing="true">
                    <match url="^admin/(.*)" />
                    <action type="Rewrite" url="http://127.0.0.1:8000/admin/{R:1}" />
                </rule>
                <rule name="Static Proxy" stopProcessing="true">
                    <match url="^static/(.*)" />
                    <action type="Rewrite" url="http://127.0.0.1:8000/static/{R:1}" />
                </rule>
                <rule name="Media Proxy" stopProcessing="true">
                    <match url="^media/(.*)" />
                    <action type="Rewrite" url="http://127.0.0.1:8000/media/{R:1}" />
                </rule>
                <rule name="SPA Fallback" stopProcessing="true">
                    <match url=".*" />
                    <conditions logicalGrouping="MatchAll">
                        <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
                        <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
                    </conditions>
                    <action type="Rewrite" url="/index.html" />
                </rule>
            </rules>
        </rewrite>
        <webSocket enabled="true" />
        <staticContent>
            <mimeMap fileExtension=".json" mimeType="application/json" />
            <mimeMap fileExtension=".woff" mimeType="application/font-woff" />
            <mimeMap fileExtension=".woff2" mimeType="application/font-woff2" />
        </staticContent>
        <httpProtocol>
            <customHeaders>
                <add name="X-Frame-Options" value="DENY" />
                <add name="X-Content-Type-Options" value="nosniff" />
                <add name="X-XSS-Protection" value="1; mode=block" />
            </customHeaders>
        </httpProtocol>
    </system.webServer>
</configuration>
'@

Set-Content -Path "$appDir\frontend\dist\web.config" -Value $webConfig
Write-Success "IIS configuration created"

# Configure firewall
Write-Info "Configuring Windows Firewall..."
New-NetFirewallRule -DisplayName "Allow HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "Allow HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow -ErrorAction SilentlyContinue
Write-Success "Firewall configured"

# Setup IIS if available
if (Get-Command New-Website -ErrorAction SilentlyContinue) {
    Write-Info "Configuring IIS..."
    
    Import-Module WebAdministration
    
    # Create application pool
    if (-not (Test-Path "IIS:\AppPools\RecruitifyPool")) {
        New-WebAppPool -Name "RecruitifyPool"
        Set-ItemProperty "IIS:\AppPools\RecruitifyPool" -Name managedRuntimeVersion -Value ""
    }
    
    # Remove default website if exists
    if (Test-Path "IIS:\Sites\Recruitify") {
        Remove-Website -Name "Recruitify"
    }
    
    # Create website
    New-Website -Name "Recruitify" `
        -PhysicalPath "$appDir\frontend\dist" `
        -ApplicationPool "RecruitifyPool" `
        -Port 80 `
        -HostHeader "recruitify.namits.shop"
    
    # Add www binding
    New-WebBinding -Name "Recruitify" -Protocol "http" -Port 80 -HostHeader "www.recruitify.namits.shop"
    
    Write-Success "IIS website created"
} else {
    Write-Info "IIS not detected. Please install IIS and configure manually"
}

Write-Host ""
Write-Host "=========================================="  -ForegroundColor Cyan
Write-Success "Deployment Complete!"
Write-Host "=========================================="  -ForegroundColor Cyan
Write-Host ""
Write-Info "Next steps:"
Write-Host "1. Configure DNS: Add A record for 'recruitify' pointing to $serverIP"
Write-Host "2. Wait for DNS propagation (5-15 minutes)"
Write-Host "3. Install SSL certificate using Win-ACME or Cloudflare"
Write-Host "4. Create superuser:"
Write-Host "   cd $appDir\backend"
Write-Host "   .\venv\Scripts\Activate.ps1"
Write-Host "   python manage.py createsuperuser"
Write-Host "5. Visit: http://recruitify.namits.shop (or https:// after SSL)"
Write-Host ""
Write-Info "Check services:"
Write-Host "  Get-Service Recruitify*"
Write-Host ""
Write-Info "View logs:"
Write-Host "  Get-EventLog -LogName Application -Source Recruitify* -Newest 20"
Write-Host ""

Set-Location $currentDir
