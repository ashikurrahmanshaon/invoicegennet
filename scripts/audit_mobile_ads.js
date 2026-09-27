const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

console.log('Auditing ' + files.length + ' HTML files for Mobile & AdSense readiness...\n');

let missingViewport = [];
let missingAdScript = [];
let missingPubId = [];
let localhostLinks = [];
let pagesWithoutFooter = [];
let pagesWithoutNav = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');

  if (!content.includes('name="viewport"') && !content.includes("name='viewport'")) {
    missingViewport.push(file);
  }
  if (!content.includes('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js')) {
    missingAdScript.push(file);
  }
  if (!content.includes('ca-pub-2606660907793468')) {
    missingPubId.push(file);
  }
  if (content.includes('http://localhost') || content.includes('http://127.0.0.1')) {
    localhostLinks.push(file);
  }
  if (!content.includes('footer') && !content.includes('class="site-footer"')) {
    pagesWithoutFooter.push(file);
  }
  if (!content.includes('btnMobileNavToggle')) {
    pagesWithoutNav.push(file);
  }
});

console.log('Missing viewport meta tag:', missingViewport.length ? missingViewport : 'None (All OK)');
console.log('Missing AdSense script:', missingAdScript.length ? missingAdScript : 'None (All OK)');
console.log('Missing Publisher ID (ca-pub-2606660907793468):', missingPubId.length ? missingPubId : 'None (All OK)');
console.log('Hardcoded localhost links:', localhostLinks.length ? localhostLinks : 'None (All OK)');
console.log('Pages without mobile nav toggle:', pagesWithoutNav.length ? pagesWithoutNav : 'None (All OK)');
