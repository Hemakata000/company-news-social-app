#!/usr/bin/env node

// Simple test script to verify frontend setup
const fs = require('fs');
const path = require('path');

console.log('🧪 Frontend Testing Setup Verification\n');

// Check if required files exist
const requiredFiles = [
  'package.json',
  'index.html',
  'src/main.tsx',
  'src/App.tsx',
  'src/services/mockData.ts',
  'src/services/mockApi.ts',
  '.env.local'
];

let allFilesExist = true;

console.log('📁 Checking required files:');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

console.log();

// Check package.json scripts
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const requiredScripts = ['dev', 'build', 'preview'];
  
  console.log('📜 Checking npm scripts:');
  requiredScripts.forEach(script => {
    const exists = packageJson.scripts && packageJson.scripts[script];
    console.log(`  ${exists ? '✅' : '❌'} npm run ${script}`);
    if (!exists) allFilesExist = false;
  });
} catch (error) {
  console.log('  ❌ Could not read package.json');
  allFilesExist = false;
}

console.log();

// Check environment configuration
try {
  const envLocal = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
  const hasMockApi = envLocal.includes('VITE_USE_MOCK_API=true');
  console.log('🔧 Environment configuration:');
  console.log(`  ${hasMockApi ? '✅' : '❌'} Mock API enabled`);
  if (!hasMockApi) allFilesExist = false;
} catch (error) {
  console.log('🔧 Environment configuration:');
  console.log('  ❌ .env.local file not found');
  allFilesExist = false;
}

console.log();

// Final result
if (allFilesExist) {
  console.log('🎉 All checks passed! Ready for testing.');
  console.log('\n📋 Next steps:');
  console.log('  1. Run: npm install');
  console.log('  2. Run: npm run dev');
  console.log('  3. Open: http://localhost:3000');
  console.log('  4. Test with companies: Apple, Microsoft, Google, Tesla, Amazon');
  process.exit(0);
} else {
  console.log('❌ Some files are missing. Please check the setup.');
  console.log('\n🔧 To fix issues:');
  console.log('  1. Ensure all required files are created');
  console.log('  2. Check that .env.local has VITE_USE_MOCK_API=true');
  console.log('  3. Verify package.json has required scripts');
  process.exit(1);
}