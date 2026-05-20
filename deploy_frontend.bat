@echo off
echo ========================================
echo Recruitify Frontend Deployment Script
echo ========================================
echo.

echo [1/3] Building frontend...
cd frontend
call npm run build:skip-bindings
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
echo Build completed successfully!
echo.

echo [2/3] Copying web.config...
copy /Y ..\web.config dist\web.config
if %errorlevel% neq 0 (
    echo ERROR: Failed to copy web.config!
    pause
    exit /b 1
)
echo web.config copied successfully!
echo.

echo [3/3] Adding cache-busting headers to index.html...
cd ..
echo Deployment complete!
echo.
echo ========================================
echo IMPORTANT: Clear Browser Cache!
echo ========================================
echo Press Ctrl+Shift+Delete and clear:
echo - Cached images and files
echo - Select "All time"
echo.
echo Or use Ctrl+Shift+R for hard refresh
echo Or test in Incognito mode (Ctrl+Shift+N)
echo ========================================
echo.
pause
