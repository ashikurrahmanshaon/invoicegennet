const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));

const navbars = {};

for (const file of htmlFiles) {
  const content = fs.readFileSync(path.join(rootDir, file), 'utf-8');
  const match = content.match(/<header class="navbar-saas">([\s\S]*?)<\/header>/);
  if (match) {
    // Normalize active classes to compare structure
    const normalized = match[1]
      .replace(/class="([^"]*)\bactive\b([^"]*)"/g, 'class="$1$2"')
      .replace(/\s+/g, ' ')
      .trim();
    navbars[file] = normalized;
  } else {
    console.log(`${file}: NO NAVBAR`);
  }
}

const baseFile = 'index.html';
const baseNav = navbars[baseFile];

console.log('Comparing all navbars to index.html...');
let diffCount = 0;
for (const file of Object.keys(navbars)) {
  if (file === baseFile) continue;
  if (navbars[file] !== baseNav) {
    console.log(`Diff in ${file}:`);
    // Find what is different
    diffCount++;
  }
}

if (diffCount === 0) {
  console.log('ALL navbars have 100% identical HTML structure!');
} else {
  console.log(`${diffCount} files have different navbar structures!`);
}
