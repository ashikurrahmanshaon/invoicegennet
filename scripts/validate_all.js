const fs = require('fs');
const path = require('path');

console.log('=== RUNNING COMPREHENSIVE MOBILE & ADSENSE COMPLIANCE AUDIT ===\n');

let failed = false;

// 1. Check ads.txt
const adsTxt = fs.readFileSync('ads.txt', 'utf8');
if (!adsTxt.includes('ca-pub-2606660907793468') && !adsTxt.includes('pub-2606660907793468')) {
  console.error('FAIL: ads.txt does not contain pub-2606660907793468');
  failed = true;
} else {
  console.log('PASS: ads.txt contains valid AdSense publisher record.');
}

// 2. Check robots.txt
const robotsTxt = fs.readFileSync('robots.txt', 'utf8');
if (!robotsTxt.includes('Mediapartners-Google') || !robotsTxt.includes('Googlebot')) {
  console.error('FAIL: robots.txt missing explicit Mediapartners-Google or Googlebot directives');
  failed = true;
} else {
  console.log('PASS: robots.txt explicitly allows Mediapartners-Google and Googlebot.');
}

// 3. Check all HTML files
const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html'));
const excludedPages = ['dashboard.html', 'login.html', 'signup.html', 'client-details.html', 'invoice-details.html', 'files.html'];

let publicCount = 0;
htmlFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  
  // Viewport check
  if (!content.includes('name="viewport"') && !content.includes("name='viewport'")) {
    console.error(`FAIL: ${file} missing viewport meta tag`);
    failed = true;
  }

  // AdSense account verification meta & script
  if (!content.includes('ca-pub-2606660907793468')) {
    console.error(`FAIL: ${file} missing AdSense publisher ID`);
    failed = true;
  }

  // Side rail ads check on public pages
  if (!excludedPages.includes(file)) {
    publicCount++;
    if (!content.includes('side-rail-ad side-rail-left') || !content.includes('side-rail-ad side-rail-right')) {
      console.error(`FAIL: ${file} missing desktop side rail ads`);
      failed = true;
    }
  }
});

console.log(`PASS: All ${htmlFiles.length} HTML files verified (${publicCount} public pages have side-rail ads).`);

// 4. Check CSS rules
const cssEditor = fs.readFileSync('css/invoice-editor.css', 'utf8');
const cssPrint = fs.readFileSync('css/print.css', 'utf8');
const cssDesign = fs.readFileSync('css/design-system.css', 'utf8');

if (!cssEditor.includes('.side-rail-ad') || !cssDesign.includes('.side-rail-ad')) {
  console.error('FAIL: .side-rail-ad missing in CSS');
  failed = true;
} else {
  console.log('PASS: .side-rail-ad defined in design system and editor CSS.');
}

if (!cssPrint.includes('.side-rail-ad')) {
  console.error('FAIL: .side-rail-ad missing from print suppression');
  failed = true;
} else {
  console.log('PASS: .side-rail-ad suppressed in print.css.');
}

if (failed) {
  console.error('\nAUDIT FAILED! Please fix above errors.');
  process.exit(1);
} else {
  console.log('\nALL CHECKS PASSED PERFECTLY! SITE IS READY FOR GOOGLE ADSENSE REVIEW.');
}
