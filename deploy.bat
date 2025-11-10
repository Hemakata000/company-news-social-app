@echo off
REM 🚀 Simple Deployment Script for Company News Social App (Windows)
REM This script helps you deploy your app to various platforms

echo 🚀 Company News Social App - Deployment Helper
echo ==============================================

REM Check if index.html exists
if not exist "frontend\index.html" (
    echo ❌ Error: frontend\index.html not found!
    echo Please make sure you're running this from the project root directory.
    pause
    exit /b 1
)

echo ✅ Found frontend\index.html

REM Create deployment directory
if not exist "deploy" mkdir deploy
copy "frontend\index.html" "deploy\" >nul

echo ✅ Copied files to deploy\ directory
echo.
echo 🌐 Deployment Options:
echo.
echo 1. 📁 Manual Upload:
echo    - Upload the file: deploy\index.html
echo    - To any hosting service (Netlify, Vercel, etc.)
echo.
echo 2. 🌍 Netlify (Drag ^& Drop):
echo    - Go to: https://netlify.com
echo    - Drag deploy\index.html to the deploy area
echo    - Get instant live URL!
echo.
echo 3. 📋 GitHub Pages:
echo    - Create GitHub repo
echo    - Upload deploy\index.html as index.html
echo    - Enable Pages in repo settings
echo.
echo 4. ⚡ Surge.sh (Command Line):
echo    - Install: npm install -g surge
echo    - Run: cd deploy ^&^& surge
echo    - Follow prompts
echo.
echo 5. 🔥 Firebase Hosting:
echo    - Install Firebase CLI
echo    - Run: firebase init hosting
echo    - Deploy: firebase deploy
echo.

REM Check if git is available
git --version >nul 2>&1
if %errorlevel% == 0 (
    echo 💡 Git detected! GitHub Pages deployment:
    echo    git add .
    echo    git commit -m "Deploy Company News Social App"
    echo    git push origin main
    echo    Then enable Pages in GitHub repo settings
    echo.
)

REM Check if npm is available
npm --version >nul 2>&1
if %errorlevel% == 0 (
    echo 📦 NPM detected! Quick Surge deployment:
    echo    npm install -g surge
    echo    cd deploy
    echo    surge
    echo.
)

echo 🎉 Your app is ready for deployment!
echo 📄 File to deploy: deploy\index.html
echo 🌟 Features included:
echo    ✅ Responsive design
echo    ✅ SEO optimized
echo    ✅ Accessibility features
echo    ✅ Mock data for 5 companies
echo    ✅ Social media content generation
echo    ✅ Copy to clipboard functionality
echo.
echo 🔗 After deployment, test these features:
echo    - Search for: Apple, Microsoft, Google, Tesla, Amazon
echo    - Switch between social platforms
echo    - Copy content to clipboard
echo    - Test on mobile devices
echo.
echo 📚 For detailed instructions, see: DEPLOYMENT-GUIDE.md
echo.
echo Press any key to open the deploy folder...
pause >nul
explorer deploy