const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));

let count = 0;

for (const file of htmlFiles) {
  const filePath = path.join(rootDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  let changed = false;

  // Replace width="32" height="32" for brand-icon-svg
  if (content.includes('class="brand-icon-svg" width="32" height="32"')) {
    content = content.replaceAll('class="brand-icon-svg" width="32" height="32"', 'class="brand-icon-svg" width="38" height="38"');
    changed = true;
  }
  if (content.includes('class="brand-icon-svg"')) {
    // Also handle case where width/height are before class or without width/height
    content = content.replace(/<img src="\/assets\/icons\/logo\.svg"([^>]*)class="brand-icon-svg"([^>]*)>/g, (match) => {
      let m = match;
      m = m.replace(/width=["']\d+["']/, 'width="38"');
      m = m.replace(/height=["']\d+["']/, 'height="38"');
      if (!m.includes('width=')) m = m.replace('class="brand-icon-svg"', 'class="brand-icon-svg" width="38" height="38"');
      return m;
    });
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    count++;
  }
}

console.log(`Updated logo dimensions to 38x38 in ${count} HTML files.`);
