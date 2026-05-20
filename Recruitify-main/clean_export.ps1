# Clean export script - run in DEVELOPMENT folder
Write-Host "=== Clean Database Export ===" -ForegroundColor Green

$devPath = "C:\Users\Administrator\OneDrive\Namit\CollegeProject\ProjectCode\backend"
$prodPath = "C:\inetpub\recruitify\backend"

Write-Host "`nStep 1: Exporting from development (suppressing debug output)..."
cd $devPath

# Export with output redirection to avoid debug messages
$env:PYTHONUNBUFFERED = "1"
python manage.py dumpdata --natural-foreign --natural-primary -e contenttypes -e auth.Permission 2>$null | Out-File -FilePath "data_clean.json" -Encoding UTF8

if (Test-Path "data_clean.json") {
    $size = (Get-Item "data_clean.json").Length / 1KB
    Write-Host "OK Exported: $([math]::Round($size, 1)) KB" -ForegroundColor Green
    
    Write-Host "`nStep 2: Copying to production..."
    Copy-Item "data_clean.json" -Destination "$prodPath\data_clean.json" -Force
    Write-Host "OK Copied to production" -ForegroundColor Green
    
    Write-Host "`nStep 3: Import in production..."
    Write-Host "Run this command in production:" -ForegroundColor Yellow
    Write-Host "cd C:\inetpub\recruitify\backend" -ForegroundColor Cyan
    Write-Host "python manage.py loaddata data_clean.json" -ForegroundColor Cyan
} else {
    Write-Host "ERROR: Export failed" -ForegroundColor Red
}
