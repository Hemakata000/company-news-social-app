#!/bin/bash

# 🏠 Local Deployment Script for Company News Social App (Mac/Linux)

echo "🏠 Company News Social App - Local Deployment"
echo "============================================"

# Check if index.html exists
if [ ! -f "frontend/index.html" ]; then
    echo "❌ Error: frontend/index.html not found!"
    echo "Please make sure you're running this from the project root directory."
    exit 1
fi

echo "✅ Found frontend/index.html"

# Create local deployment directory
mkdir -p local-deploy
cp frontend/index.html local-deploy/

echo "✅ Copied files to local-deploy/ directory"
echo ""

# Try different local server options
echo "🌐 Starting Local Server..."
echo ""

# Check if Python is available
if command -v python3 &> /dev/null; then
    echo "🐍 Python 3 detected! Starting HTTP server..."
    echo "📍 Your app will be available at: http://localhost:8000"
    echo "🔄 Press Ctrl+C to stop the server"
    echo ""
    cd local-deploy
    echo "Opening browser in 3 seconds..."
    sleep 3
    
    # Try to open browser (works on macOS and some Linux)
    if command -v open &> /dev/null; then
        open http://localhost:8000
    elif command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:8000
    else
        echo "Please open http://localhost:8000 in your browser"
    fi
    
    python3 -m http.server 8000
    exit 0
elif command -v python &> /dev/null; then
    echo "🐍 Python detected! Starting HTTP server..."
    echo "📍 Your app will be available at: http://localhost:8000"
    echo "🔄 Press Ctrl+C to stop the server"
    echo ""
    cd local-deploy
    echo "Opening browser in 3 seconds..."
    sleep 3
    
    # Try to open browser
    if command -v open &> /dev/null; then
        open http://localhost:8000
    elif command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:8000
    else
        echo "Please open http://localhost:8000 in your browser"
    fi
    
    python -m SimpleHTTPServer 8000
    exit 0
fi

# Check if Node.js is available
if command -v node &> /dev/null; then
    if command -v serve &> /dev/null; then
        echo "✅ Serve is installed! Starting server..."
        echo "📍 Your app will be available at: http://localhost:8000"
        echo "🔄 Press Ctrl+C to stop the server"
        echo ""
        cd local-deploy
        echo "Opening browser in 3 seconds..."
        sleep 3
        
        # Try to open browser
        if command -v open &> /dev/null; then
            open http://localhost:8000
        elif command -v xdg-open &> /dev/null; then
            xdg-open http://localhost:8000
        else
            echo "Please open http://localhost:8000 in your browser"
        fi
        
        serve -s . -l 8000
        exit 0
    else
        echo "📦 Installing serve..."
        npm install -g serve
        if [ $? -eq 0 ]; then
            echo "✅ Serve installed! Starting server..."
            echo "📍 Your app will be available at: http://localhost:8000"
            echo "🔄 Press Ctrl+C to stop the server"
            echo ""
            cd local-deploy
            echo "Opening browser in 3 seconds..."
            sleep 3
            
            # Try to open browser
            if command -v open &> /dev/null; then
                open http://localhost:8000
            elif command -v xdg-open &> /dev/null; then
                xdg-open http://localhost:8000
            else
                echo "Please open http://localhost:8000 in your browser"
            fi
            
            serve -s . -l 8000
            exit 0
        fi
    fi
fi

# Check if PHP is available
if command -v php &> /dev/null; then
    echo "🐘 PHP detected! Starting HTTP server..."
    echo "📍 Your app will be available at: http://localhost:8000"
    echo "🔄 Press Ctrl+C to stop the server"
    echo ""
    cd local-deploy
    echo "Opening browser in 3 seconds..."
    sleep 3
    
    # Try to open browser
    if command -v open &> /dev/null; then
        open http://localhost:8000
    elif command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:8000
    else
        echo "Please open http://localhost:8000 in your browser"
    fi
    
    php -S localhost:8000
    exit 0
fi

# Fallback to direct file opening
echo "⚠️  No HTTP server available. Opening file directly..."
echo ""
echo "📝 Note: Some features (like clipboard) work better with HTTP server"
echo "💡 Consider installing Python or Node.js for better experience"
echo ""
echo "Opening app in your default browser..."

# Try to open the file directly
if command -v open &> /dev/null; then
    open local-deploy/index.html
elif command -v xdg-open &> /dev/null; then
    xdg-open local-deploy/index.html
else
    echo "Please open local-deploy/index.html in your browser"
fi

echo ""
echo "🎉 Local deployment complete!"
echo ""
echo "📱 Test these features:"
echo "   ✅ Search for: Apple, Microsoft, Google, Tesla, Amazon"
echo "   ✅ Switch between social platforms"
echo "   ✅ Copy content to clipboard"
echo "   ✅ Test on mobile (resize browser)"
echo ""
echo "🔧 Troubleshooting:"
echo "   - If clipboard doesn't work, use HTTP server (not file://)"
echo "   - For best experience, install Python or Node.js"
echo "   - Check browser console (F12) for any errors"
echo ""