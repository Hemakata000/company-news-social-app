@echo off
REM 🏠 Local Deployment Script for Company News Social App (Windows)

echo 🏠 Company News Social App - Local Deployment
echo ============================================

REM Check if index.html exists
if not exist "frontend\index.html" (
    echo ❌ Error: frontend\index.html not found!
    echo Please make sure you're running this from the project root directory.
    pause
    exit /b 1
)

echo ✅ Found frontend\index.html

REM Create local deployment directory
if not exist "local-deploy" mkdir local-deploy
copy "frontend\index.html" "local-deploy\" >nul

echo ✅ Copied files to local-deploy\ directory
echo.

REM Try different local server options
echo 🌐 Starting Local Server...
echo.

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo 🐍 Python detected! Starting HTTP server...
    echo 📍 Your app will be available at: http://localhost:8000
    echo 🔄 Press Ctrl+C to stop the server
    echo.
    cd local-deploy
    echo Opening browser in 3 seconds...
    timeout /t 3 /nobreak >nul
    start http://localhost:8000
    python -m http.server 8000
    goto :end
)

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo 📦 Node.js detected! Checking for serve...
    npm list -g serve >nul 2>&1
    if %errorlevel% == 0 (
        echo ✅ Serve is installed! Starting server...
        echo 📍 Your app will be available at: http://localhost:8000
        echo 🔄 Press Ctrl+C to stop the server
        echo.
        cd local-deploy
        echo Opening browser in 3 seconds...
        timeout /t 3 /nobreak >nul
        start http://localhost:8000
        serve -s . -l 8000
        goto :end
    ) else (
        echo 📦 Installing serve...
        npm install -g serve
        if %errorlevel% == 0 (
            echo ✅ Serve installed! Starting server...
            echo 📍 Your app will be available at: http://localhost:8000
            echo 🔄 Press Ctrl+C to stop the server
            echo.
            cd local-deploy
            echo Opening browser in 3 seconds...
            timeout /t 3 /nobreak >nul
            start http://localhost:8000
            serve -s . -l 8000
            goto :end
        )
    )
)

REM Check if PHP is available
php --version >nul 2>&1
if %errorlevel% == 0 (
    echo 🐘 PHP detected! Starting HTTP server...
    echo 📍 Your app will be available at: http://localhost:8000
    echo 🔄 Press Ctrl+C to stop the server
    echo.
    cd local-deploy
    echo Opening browser in 3 seconds...
    timeout /t 3 /nobreak >nul
    start http://localhost:8000
    php -S localhost:8000
    goto :end
)

REM Fallback to direct file opening
echo ⚠️  No HTTP server available. Opening file directly...
echo.
echo 📝 Note: Some features (like clipboard) work better with HTTP server
echo 💡 Consider installing Python or Node.js for better experience
echo.
echo Opening app in your default browser...
start "" "local-deploy\index.html"

:end
echo.
echo 🎉 Local deployment complete!
echo.
echo 📱 Test these features:
echo    ✅ Search for: Apple, Microsoft, Google, Tesla, Amazon
echo    ✅ Switch between social platforms
echo    ✅ Copy content to clipboard
echo    ✅ Test on mobile (resize browser)
echo.
echo 🔧 Troubleshooting:
echo    - If clipboard doesn't work, use HTTP server (not file://)
echo    - For best experience, install Python or Node.js
echo    - Check browser console (F12) for any errors
echo.
pause