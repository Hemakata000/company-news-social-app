# 🏠 PowerShell Local Deployment Script for Company News Social App

Write-Host "🏠 Company News Social App - Local Deployment" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Check if index.html exists
if (-not (Test-Path "frontend\index.html")) {
    Write-Host "❌ Error: frontend\index.html not found!" -ForegroundColor Red
    Write-Host "Please make sure you're running this from the project root directory." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Found frontend\index.html" -ForegroundColor Green

# Create local deployment directory
if (-not (Test-Path "local-deploy")) {
    New-Item -ItemType Directory -Path "local-deploy" | Out-Null
}
Copy-Item "frontend\index.html" "local-deploy\" -Force

Write-Host "✅ Copied files to local-deploy\ directory" -ForegroundColor Green
Write-Host ""

# Try different deployment methods
Write-Host "🌐 Deployment Options:" -ForegroundColor Cyan
Write-Host ""

# Check if Python is available
try {
    $pythonVersion = python --version 2>$null
    if ($pythonVersion) {
        Write-Host "🐍 Python detected! Starting HTTP server..." -ForegroundColor Green
        Write-Host "📍 Your app will be available at: http://localhost:8000" -ForegroundColor Yellow
        Write-Host "🔄 Press Ctrl+C to stop the server" -ForegroundColor Yellow
        Write-Host ""
        
        Set-Location "local-deploy"
        Write-Host "Opening browser in 3 seconds..." -ForegroundColor Cyan
        Start-Sleep -Seconds 3
        Start-Process "http://localhost:8000"
        python -m http.server 8000
        exit 0
    }
} catch {
    # Python not available
}

# Check if Node.js is available
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "📦 Node.js detected! Checking for serve..." -ForegroundColor Green
        
        try {
            npm list -g serve 2>$null | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Serve is installed! Starting server..." -ForegroundColor Green
                Write-Host "📍 Your app will be available at: http://localhost:8000" -ForegroundColor Yellow
                Write-Host "🔄 Press Ctrl+C to stop the server" -ForegroundColor Yellow
                Write-Host ""
                
                Set-Location "local-deploy"
                Write-Host "Opening browser in 3 seconds..." -ForegroundColor Cyan
                Start-Sleep -Seconds 3
                Start-Process "http://localhost:8000"
                serve -s . -l 8000
                exit 0
            } else {
                Write-Host "📦 Installing serve..." -ForegroundColor Yellow
                npm install -g serve
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✅ Serve installed! Starting server..." -ForegroundColor Green
                    Write-Host "📍 Your app will be available at: http://localhost:8000" -ForegroundColor Yellow
                    Write-Host "🔄 Press Ctrl+C to stop the server" -ForegroundColor Yellow
                    Write-Host ""
                    
                    Set-Location "local-deploy"
                    Write-Host "Opening browser in 3 seconds..." -ForegroundColor Cyan
                    Start-Sleep -Seconds 3
                    Start-Process "http://localhost:8000"
                    serve -s . -l 8000
                    exit 0
                }
            }
        } catch {
            # Serve not available
        }
    }
} catch {
    # Node.js not available
}

# Fallback to direct file opening
Write-Host "⚠️  No HTTP server available. Opening file directly..." -ForegroundColor Yellow
Write-Host ""
Write-Host "📝 Note: Some features (like clipboard) work better with HTTP server" -ForegroundColor Cyan
Write-Host "💡 Consider installing Python or Node.js for better experience" -ForegroundColor Cyan
Write-Host ""
Write-Host "Opening app in your default browser..." -ForegroundColor Green

# Open the file directly
$filePath = Resolve-Path "local-deploy\index.html"
Start-Process $filePath

Write-Host ""
Write-Host "🎉 Local deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Test these features:" -ForegroundColor Cyan
Write-Host "   ✅ Search for: Apple, Microsoft, Google, Tesla, Amazon" -ForegroundColor White
Write-Host "   ✅ Switch between social platforms" -ForegroundColor White
Write-Host "   ✅ Copy content to clipboard" -ForegroundColor White
Write-Host "   ✅ Test on mobile (resize browser)" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Troubleshooting:" -ForegroundColor Cyan
Write-Host "   - If clipboard doesn't work, install Python or Node.js" -ForegroundColor White
Write-Host "   - For best experience, use HTTP server (not file://)" -ForegroundColor White
Write-Host "   - Check browser console (F12) for any errors" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit"