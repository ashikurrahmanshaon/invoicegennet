const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));

console.log(`Processing ${htmlFiles.length} HTML files...`);

for (const file of htmlFiles) {
  const filePath = path.join(rootDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Remove the footer-bottom-trust-row block
  const trustRowRegex = /\s*(<!--\s*Sleek Trust & Gateway Row\s*-->)?\s*<div class="footer-bottom-trust-row"[\s\S]*?<\/div>\s*<\/div>/g;
  
  if (trustRowRegex.test(content)) {
    content = content.replace(trustRowRegex, '');
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Removed trust row from: ${file}`);
  }
}

console.log('Finished removing bottom row from all files.');
