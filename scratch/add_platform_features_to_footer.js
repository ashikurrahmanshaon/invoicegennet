const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));

let updatedCount = 0;

for (const file of htmlFiles) {
  const filePath = path.join(rootDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Check if Platform Features is already in About Us
  if (content.includes('<a href="features.html">Platform Features</a>')) {
    console.log(`${file}: Already contains Platform Features`);
    continue;
  }

  // Target standard pattern
  const target1 = `<a href="about.html">Company Story</a>\n            <a href="security.html">Security &amp; Architecture</a>`;
  const replacement1 = `<a href="about.html">Company Story</a>\n            <a href="features.html">Platform Features</a>\n            <a href="security.html">Security &amp; Architecture</a>`;

  // Target about.html styled pattern
  const target2 = `<a href="about.html" style="color: #00c875; font-weight: 700;">Company Story</a>\n            <a href="security.html">Security &amp; Architecture</a>`;
  const replacement2 = `<a href="about.html" style="color: #00c875; font-weight: 700;">Company Story</a>\n            <a href="features.html">Platform Features</a>\n            <a href="security.html">Security &amp; Architecture</a>`;

  if (content.includes(target1)) {
    content = content.replace(target1, replacement1);
    fs.writeFileSync(filePath, content, 'utf-8');
    updatedCount++;
    console.log(`Updated ${file}`);
  } else if (content.includes(target2)) {
    content = content.replace(target2, replacement2);
    fs.writeFileSync(filePath, content, 'utf-8');
    updatedCount++;
    console.log(`Updated ${file} (styled)`);
  } else {
    console.warn(`WARNING: Could not match About Us pattern in ${file}`);
  }
}

console.log(`\nSuccessfully updated ${updatedCount} files!`);
