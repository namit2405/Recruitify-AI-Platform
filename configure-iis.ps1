# Configure IIS for Recruitify
# Run as Administrator

Import-Module WebAdministration

$siteName = "Recruitify"
$appPoolName = "RecruitifyPool"
$physicalPath = "C:\inetpub\recruitify\frontend\dist"
$hostName = "recruitify.namits.shop"

Write-Host "Configuring IIS for Recruitify..." -ForegroundColor Cyan

# Create Application Pool
if (Test-Path "IIS:\AppPools\$appPoolName") {
    Write-Host "Application pool already exists, removing..." -ForegroundColor Yellow
    Remove-WebAppPool -Name $appPoolName
}

Write-Host "Creating application pool..." -ForegroundColor Green
New-WebAppPool -Name $appPoolName
Set-ItemProperty "IIS:\AppPools\$appPoolName" -Name managedRuntimeVersion -Value ""

# Remove existing site if it exists
if (Test-Path "IIS:\Sites\$siteName") {
    Write-Host "Site already exists, removing..." -ForegroundColor Yellow
    Remove-Website -Name $siteName
}

# Create Website
Write-Host "Creating website..." -ForegroundColor Green
New-Website -Name $siteName `
    -PhysicalPath $physicalPath `
    -ApplicationPool $appPoolName `
    -Port 80 `
    -HostHeader $hostName

# Add www binding
Write-Host "Adding www binding..." -ForegroundColor Green
New-WebBinding -Name $siteName -Protocol "http" -Port 80 -HostHeader "www.$hostName"

# Start the website
Start-Website -Name $siteName

Write-Host ""
Write-Host "IIS Configuration Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Configure DNS: Add A record for 'recruitify' pointing to your server IP"
Write-Host "2. Add this to your hosts file for local testing:"
Write-Host "   127.0.0.1  $hostName"
Write-Host "3. Test: http://$hostName"
Write-Host "4. Setup SSL certificate (use Cloudflare or Win-ACME)"
Write-Host ""
