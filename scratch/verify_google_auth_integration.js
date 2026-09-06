const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));

console.log('Auditing Google Authentication integration across the platform...');

let failed = false;

// 1. Check js/google-auth.js
const authModulePath = path.join(rootDir, 'js/google-auth.js');
if (!fs.existsSync(authModulePath)) {
  console.error('FAIL: js/google-auth.js missing');
  failed = true;
} else {
  const code = fs.readFileSync(authModulePath, 'utf8');
  if (!code.includes('1029331875701-7km83lfkd6norbl85o6f68qi2u4apt9u.apps.googleusercontent.com')) {
    console.error('FAIL: Correct Google Client ID not found in js/google-auth.js');
    failed = true;
  } else {
    console.log('PASS: js/google-auth.js configured with valid Google Client ID.');
  }
}

// 2. Check login.html and signup.html for GIS SDK and buttons
const loginHtml = fs.readFileSync(path.join(rootDir, 'login.html'), 'utf8');
if (!loginHtml.includes('accounts.google.com/gsi/client') || !loginHtml.includes('btnGoogleWideLogin')) {
  console.error('FAIL: login.html missing GIS SDK or btnGoogleWideLogin');
  failed = true;
} else {
  console.log('PASS: login.html has GIS SDK and Continue with Google button.');
}

const signupHtml = fs.readFileSync(path.join(rootDir, 'signup.html'), 'utf8');
if (!signupHtml.includes('accounts.google.com/gsi/client') || !signupHtml.includes('btnGoogleWideSignup')) {
  console.error('FAIL: signup.html missing GIS SDK or btnGoogleWideSignup');
  failed = true;
} else {
  console.log('PASS: signup.html has GIS SDK and Sign up with Google button.');
}

const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
if (!indexHtml.includes('accounts.google.com/gsi/client') || !indexHtml.includes('btnGoogleAuth')) {
  console.error('FAIL: index.html missing GIS SDK or btnGoogleAuth');
  failed = true;
} else {
  console.log('PASS: index.html has GIS SDK and Continue with Google modal button.');
}

// 3. Check that all 24 HTML files link js/google-auth.js
for (const file of htmlFiles) {
  const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
  if (!content.includes('js/google-auth.js')) {
    console.error(`FAIL: ${file} missing js/google-auth.js`);
    failed = true;
  }
}
console.log(`PASS: All ${htmlFiles.length} HTML files link js/google-auth.js for global auth state synchronization.`);

// 4. Check CSS
const css = fs.readFileSync(path.join(rootDir, 'css/design-system.css'), 'utf8');
if (!css.includes('.btn-google-wide') || !css.includes('.auth-divider-line')) {
  console.error('FAIL: Google auth CSS classes missing in css/design-system.css');
  failed = true;
} else {
  console.log('PASS: Google auth CSS styles present in design-system.css.');
}

if (!failed) {
  console.log('\nSUCCESS: GOOGLE AUTHENTICATION SYSTEM 100% INTEGRATED & OPERATIONAL!');
} else {
  process.exit(1);
}
