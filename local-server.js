#!/usr/bin/env node

// 🏠 Simple Local Server for Company News Social App
// This creates a local HTTP server to serve your app

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 8000;
const HOST = 'localhost';

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// Create HTTP server
const server = http.createServer((req, res) => {
    console.log(`📡 ${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);
    
    // Parse URL and remove query parameters
    let filePath = req.url.split('?')[0];
    
    // Default to index.html for root requests
    if (filePath === '/') {
        filePath = '/index.html';
    }
    
    // Security: prevent directory traversal
    if (filePath.includes('..')) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
    }
    
    // Construct full file path
    const fullPath = path.join(__dirname, 'frontend', filePath);
    
    // Check if file exists
    fs.access(fullPath, fs.constants.F_OK, (err) => {
        if (err) {
            // File not found
            console.log(`❌ File not found: ${fullPath}`);
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>404 - Not Found</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        h1 { color: #e74c3c; }
                        a { color: #3498db; text-decoration: none; }
                        a:hover { text-decoration: underline; }
                    </style>
                </head>
                <body>
                    <h1>404 - File Not Found</h1>
                    <p>The requested file <code>${filePath}</code> was not found.</p>
                    <p><a href="/">← Back to Home</a></p>
                </body>
                </html>
            `);
            return;
        }
        
        // Get file extension and MIME type
        const ext = path.extname(fullPath).toLowerCase();
        const mimeType = mimeTypes[ext] || 'application/octet-stream';
        
        // Read and serve the file
        fs.readFile(fullPath, (err, data) => {
            if (err) {
                console.log(`❌ Error reading file: ${err.message}`);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('500 Internal Server Error');
                return;
            }
            
            // Set headers
            res.writeHead(200, {
                'Content-Type': mimeType,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            
            res.end(data);
            console.log(`✅ Served: ${filePath} (${data.length} bytes)`);
        });
    });
});

// Start server
server.listen(PORT, HOST, () => {
    console.log('🏠 Company News Social App - Local Server');
    console.log('========================================');
    console.log(`✅ Server running at: http://${HOST}:${PORT}`);
    console.log(`📁 Serving files from: ${path.join(__dirname, 'frontend')}`);
    console.log('🔄 Press Ctrl+C to stop the server');
    console.log('');
    
    // Try to open browser automatically
    const url = `http://${HOST}:${PORT}`;
    console.log('🌐 Opening browser...');
    
    // Detect platform and open browser
    const platform = process.platform;
    let command;
    
    if (platform === 'darwin') {
        command = `open ${url}`;
    } else if (platform === 'win32') {
        command = `start ${url}`;
    } else {
        command = `xdg-open ${url}`;
    }
    
    exec(command, (error) => {
        if (error) {
            console.log(`💡 Please open ${url} in your browser manually`);
        } else {
            console.log('✅ Browser opened successfully');
        }
    });
    
    console.log('');
    console.log('📱 Test these features:');
    console.log('   ✅ Search for: Apple, Microsoft, Google, Tesla, Amazon');
    console.log('   ✅ Switch between social platforms');
    console.log('   ✅ Copy content to clipboard');
    console.log('   ✅ Test responsive design');
    console.log('');
});

// Handle server errors
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`❌ Port ${PORT} is already in use!`);
        console.log('💡 Try a different port or stop the existing server');
        console.log(`   Kill existing process: lsof -ti:${PORT} | xargs kill -9`);
    } else {
        console.log(`❌ Server error: ${err.message}`);
    }
    process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server stopped successfully');
        process.exit(0);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.log(`❌ Uncaught exception: ${err.message}`);
    process.exit(1);
});

// Check if frontend/index.html exists
const indexPath = path.join(__dirname, 'frontend', 'index.html');
fs.access(indexPath, fs.constants.F_OK, (err) => {
    if (err) {
        console.log('❌ Warning: frontend/index.html not found!');
        console.log('📁 Make sure you have the frontend files in the correct location');
    }
});