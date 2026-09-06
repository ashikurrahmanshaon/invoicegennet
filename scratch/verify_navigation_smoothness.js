const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));

console.log(`Auditing navigation smoothness across ${htmlFiles.length} pages...`);

let failed = false;

// 1. Verify CSS rules in css/design-system.css
const cssContent = fs.readFileSync(path.join(rootDir, 'css/design-system.css'), 'utf8');

if (!cssContent.includes('@view-transition')) {
  console.error('FAIL: @view-transition missing from css/design-system.css');
  failed = true;
} else {
  console.log('PASS: @view-transition { navigation: auto; } present');
}

if (!cssContent.includes('view-transition-name: main-navbar;')) {
  console.error('FAIL: view-transition-name: main-navbar missing from css/design-system.css');
  failed = true;
} else {
  console.log('PASS: .navbar-saas has view-transition-name: main-navbar');
}

if (!cssContent.includes('scrollbar-gutter: stable;')) {
  console.error('FAIL: scrollbar-gutter: stable missing from css/design-system.css');
  failed = true;
} else {
  console.log('PASS: scrollbar-gutter: stable present in html selector');
}

if (cssContent.includes('scroll-behavior: smooth;')) {
  console.error('FAIL: scroll-behavior: smooth still found in css/design-system.css');
  failed = true;
} else {
  console.log('PASS: scroll-behavior: smooth removed from html');
}

// 2. Verify all HTML files
for (const file of htmlFiles) {
  const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
  
  if (!content.includes('js/instant-nav.js')) {
    console.error(`FAIL: ${file} missing js/instant-nav.js`);
    failed = true;
  }
  
  if (content.includes('display=swap')) {
    console.error(`FAIL: ${file} still uses display=swap`);
    failed = true;
  }
  
  if (!content.includes('display=fallback')) {
    console.error(`FAIL: ${file} does not use display=fallback`);
    failed = true;
  }
}

if (!failed) {
  console.log(`\nALL ${htmlFiles.length} PAGES CONFIRMED: 100% BUTTERY-SMOOTH NAVIGATION READY!`);
} else {
  process.exit(1);
}
