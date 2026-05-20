# Fix IIS Configuration for Recruitify

$siteName = "Recruitify"
$sitePath = "C:\inetpub\recruitify\frontend\dist"

# Stop IIS
Write-Host "Stopping IIS..."
iisreset /stop

# Remove and recreate the site
Write-Host "Recreating IIS site..."
Remove-WebSite -Name $siteName -ErrorAction SilentlyContinue
Remove-WebAppPool -Name $siteName -ErrorAction SilentlyContinue

# Create app pool
New-WebAppPool -Name $siteName
Set-ItemProperty "IIS:\AppPools\$siteName" -Name "managedRuntimeVersion" -Value ""

# Create site
New-WebSite -Name $siteName -PhysicalPath $sitePath -ApplicationPool $siteName -Port 80 -HostHeader "recruitify.namits.shop"
New-WebBinding -Name $siteName -Protocol "http" -Port 80 -HostHeader "www.recruitify.namits.shop"
New-WebBinding -Name $siteName -Protocol "http" -Port 80 -HostHeader ""

# Enable URL Rewrite at site level
Set-WebConfigurationProperty -PSPath "IIS:\Sites\$siteName" -Filter "system.webServer/rewrite" -Name "enabled" -Value $true

# Start IIS
Write-Host "Starting IIS..."
iisreset /start

Write-Host "Site recreated successfully!"
Write-Host "Now test: http://recruitify.namits.shop"
