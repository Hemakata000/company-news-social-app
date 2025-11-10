#!/bin/bash

# 🚀 Simple Deployment Script for Company News Social App
# This script helps you deploy your app to various platforms

echo "🚀 Company News Social App - Deployment Helper"
echo "=============================================="

# Check if index.html exists
if [ ! -f "frontend/index.html" ]; then
    echo "❌ Error: frontend/index.html not found!"
    echo "Please make sure you're running this from the project root directory."
    exit 1
fi

echo "✅ Found frontend/index.html"

# Create deployment directory
mkdir -p deploy
cp frontend/index.html deploy/

echo "✅ Copied files to deploy/ directory"

echo ""
echo "🌐 Deployment Options:"
echo ""
echo "1. 📁 Manual Upload:"
echo "   - Upload the file: deploy/index.html"
echo "   - To any hosting service (Netlify, Vercel, etc.)"
echo ""
echo "2. 🌍 Netlify (Drag & Drop):"
echo "   - Go to: https://netlify.com"
echo "   - Drag deploy/index.html to the deploy area"
echo "   - Get instant live URL!"
echo ""
echo "3. 📋 GitHub Pages:"
echo "   - Create GitHub repo"
echo "   - Upload deploy/index.html as index.html"
echo "   - Enable Pages in repo settings"
echo ""
echo "4. ⚡ Surge.sh (Command Line):"
echo "   - Install: npm install -g surge"
echo "   - Run: cd deploy && surge"
echo "   - Follow prompts"
echo ""
echo "5. 🔥 Firebase Hosting:"
echo "   - Install Firebase CLI"
echo "   - Run: firebase init hosting"
echo "   - Deploy: firebase deploy"
echo ""

# Check if git is available and suggest GitHub Pages
if command -v git &> /dev/null; then
    echo "💡 Git detected! GitHub Pages deployment:"
    echo "   git add ."
    echo "   git commit -m 'Deploy Company News Social App'"
    echo "   git push origin main"
    echo "   Then enable Pages in GitHub repo settings"
    echo ""
fi

# Check if npm is available and suggest Surge
if command -v npm &> /dev/null; then
    echo "📦 NPM detected! Quick Surge deployment:"
    echo "   npm install -g surge"
    echo "   cd deploy"
    echo "   surge"
    echo ""
fi

echo "🎉 Your app is ready for deployment!"
echo "📄 File to deploy: deploy/index.html"
echo "🌟 Features included:"
echo "   ✅ Responsive design"
echo "   ✅ SEO optimized"
echo "   ✅ Accessibility features"
echo "   ✅ Mock data for 5 companies"
echo "   ✅ Social media content generation"
echo "   ✅ Copy to clipboard functionality"
echo ""
echo "🔗 After deployment, test these features:"
echo "   - Search for: Apple, Microsoft, Google, Tesla, Amazon"
echo "   - Switch between social platforms"
echo "   - Copy content to clipboard"
echo "   - Test on mobile devices"
echo ""
echo "📚 For detailed instructions, see: DEPLOYMENT-GUIDE.md"