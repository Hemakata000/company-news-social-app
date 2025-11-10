#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('========================================');
console.log('  Company News Social App - MVP Setup');
console.log('========================================');
console.log('');

// Check if .env.local exists
const envPath = path.join(__dirname, 'backend', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ ERROR: backend/.env.local not found!');
  console.error('');
  console.error('Please create backend/.env.local and add your API keys.');
  console.error('See MVP-SETUP-GUIDE.md for instructions.');
  process.exit(1);
}

// Check if node_modules exist
const backendModules = path.join(__dirname, 'backend', 'node_modules');
const frontendModules = path.join(__dirname, 'frontend', 'node_modules');

if (!fs.existsSync(backendModules) || !fs.existsSync(frontendModules)) {
  console.log('📦 Installing dependencies...');
  console.log('');
  
  const install = spawn('npm', ['run', 'install:all'], {
    stdio: 'inherit',
    shell: true
  });
  
  install.on('close', (code) => {
    if (code !== 0) {
      console.error('❌ Installation failed');
      process.exit(1);
    }
    startServers();
  });
} else {
  startServers();
}

function startServers() {
  console.log('');
  console.log('🗄️  Running database migrations...');
  
  const migrate = spawn('npm', ['run', 'migrate'], {
    stdio: 'inherit',
    shell: true
  });
  
  migrate.on('close', (code) => {
    if (code !== 0) {
      console.error('❌ Migration failed');
      process.exit(1);
    }
    
    console.log('');
    console.log('========================================');
    console.log('  Starting Application...');
    console.log('========================================');
    console.log('');
    console.log('Backend:  http://localhost:3001');
    console.log('Frontend: http://localhost:5173');
    console.log('');
    console.log('Press Ctrl+C to stop both servers');
    console.log('');
    
    // Start backend
    const backend = spawn('npm', ['run', 'dev:backend'], {
      stdio: 'inherit',
      shell: true
    });
    
    // Wait a bit then start frontend
    setTimeout(() => {
      const frontend = spawn('npm', ['run', 'dev:frontend'], {
        stdio: 'inherit',
        shell: true
      });
      
      // Handle cleanup
      process.on('SIGINT', () => {
        console.log('');
        console.log('Stopping servers...');
        backend.kill();
        frontend.kill();
        process.exit(0);
      });
      
      frontend.on('close', () => {
        backend.kill();
        process.exit(0);
      });
      
      backend.on('close', () => {
        frontend.kill();
        process.exit(0);
      });
    }, 3000);
  });
}
