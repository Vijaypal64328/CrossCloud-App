// This script helps verify that the correct API URL is being used in your build
import fs from 'fs';
import path from 'path';

// Check the .env files
console.log('Checking environment files...');

// Check .env
try {
  const envContent = fs.readFileSync(path.resolve('.env'), 'utf8');
  console.log('.env file found:');
  console.log(envContent);
} catch (err) {
  console.log('No .env file found.');
}

// Check .env.production
try {
  const envProdContent = fs.readFileSync(path.resolve('.env.production'), 'utf8');
  console.log('.env.production file found:');
  console.log(envProdContent);
} catch (err) {
  console.log('No .env.production file found.');
}

// Create a check script to make sure API_URL is set correctly
console.log('\nCreating api-check.js in the public folder...');

const checkScript = `
// This script runs in the browser and checks what API URL is actually being used
window.addEventListener('DOMContentLoaded', () => {
  const apiUrlDisplay = document.createElement('div');
  apiUrlDisplay.style.position = 'fixed';
  apiUrlDisplay.style.bottom = '10px';
  apiUrlDisplay.style.right = '10px';
  apiUrlDisplay.style.padding = '10px';
  apiUrlDisplay.style.background = 'rgba(0,0,0,0.7)';
  apiUrlDisplay.style.color = 'white';
  apiUrlDisplay.style.borderRadius = '5px';
  apiUrlDisplay.style.zIndex = '9999';
  
  const apiUrl = import.meta.env.VITE_API_URL || 'Not found';
  apiUrlDisplay.textContent = 'API URL: ' + apiUrl;
  
  document.body.appendChild(apiUrlDisplay);
  console.log('CloudShare API URL:', apiUrl);
});
`;

// Create public folder if it doesn't exist
if (!fs.existsSync(path.resolve('public'))) {
  fs.mkdirSync(path.resolve('public'));
}

// Write the check script to public folder
fs.writeFileSync(path.resolve('public', 'api-check.js'), checkScript);

// Add script reference to index.html
const indexPath = path.resolve('index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

if (!indexContent.includes('api-check.js')) {
  indexContent = indexContent.replace(
    '</head>',
    '  <script src="/api-check.js"></script>\n  </head>'
  );
  fs.writeFileSync(indexPath, indexContent);
  console.log('Added api-check.js reference to index.html');
}

console.log('\nDeploy fix complete!');
console.log('Run "npm run build" to create your production build.');
console.log('After deploying, check the browser console to verify the API URL.');
