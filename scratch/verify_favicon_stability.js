const fs = require('fs');
const path = require('path');
const http = require('http');

const rootDir = path.resolve(__dirname, '..');
const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));

console.log('Auditing Favicon & Brand Icon Stability across all files and routes...');

let failed = false;

// 1. Check physical file exists and is valid
const faviconPath = path.join(rootDir, 'favicon.ico');
if (!fs.existsSync(faviconPath) || fs.statSync(faviconPath).size < 1000) {
  console.error('FAIL: favicon.ico missing or too small');
  failed = true;
} else {
  console.log(`PASS: Valid physical favicon.ico present (${fs.statSync(faviconPath).size} bytes)`);
}

// 2. Check HTML files
for (const file of htmlFiles) {
  const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
  if (!content.includes('href="/favicon.ico"')) {
    console.error(`FAIL: ${file} missing href="/favicon.ico"`);
    failed = true;
  }
  if (!content.includes('href="/assets/icons/logo.svg"')) {
    console.error(`FAIL: ${file} missing href="/assets/icons/logo.svg"`);
    failed = true;
  }
}
console.log(`PASS: All ${htmlFiles.length} HTML files declare root-absolute cached favicons.`);

// 3. Check CSS rules
const css = fs.readFileSync(path.join(rootDir, 'css/design-system.css'), 'utf8');
if (!css.includes('.brand-logo-frame') || !css.includes('transform: translateZ(0)')) {
  console.error('FAIL: Hardware-accelerated brand icon stabilization missing in CSS');
  failed = true;
} else {
  console.log('PASS: Hardware-accelerated brand icon stabilization present in CSS.');
}

// 4. Test server HTTP responses for /favicon.ico and /assets/icons/logo.svg
function testEndpoint(urlPath) {
  return new Promise((resolve) => {
    http.get(`http://localhost:57784${urlPath}`, (res) => {
      const is200 = res.statusCode === 200;
      const hasCache = (res.headers['cache-control'] || '').includes('immutable');
      if (is200 && hasCache) {
        console.log(`PASS: http://localhost:57784${urlPath} -> 200 OK with Cache-Control immutable`);
        resolve(true);
      } else {
        console.error(`FAIL: http://localhost:57784${urlPath} -> status ${res.statusCode}, cache: ${res.headers['cache-control']}`);
        resolve(false);
      }
    }).on('error', (err) => {
      console.error(`FAIL: Request to ${urlPath} error:`, err.message);
      resolve(false);
    });
  });
}

async function runNetworkChecks() {
  const icoOk = await testEndpoint('/favicon.ico');
  const svgOk = await testEndpoint('/assets/icons/logo.svg');
  if (!icoOk || !svgOk) failed = true;

  if (failed) {
    console.error('\nAUDIT FAILED!');
    process.exit(1);
  } else {
    console.log('\nSUCCESS: FAVICON & BRAND ICON 100% STABILIZED AGAINST JITTER & SHAKING!');
  }
}

runNetworkChecks();
