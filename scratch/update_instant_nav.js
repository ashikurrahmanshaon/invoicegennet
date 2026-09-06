const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));

console.log(`Found ${htmlFiles.length} HTML files.`);

let updatedCount = 0;

for (const file of htmlFiles) {
  const filePath = path.join(rootDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Replace display=swap with display=fallback in Google Fonts
  if (content.includes('&family=JetBrains+Mono:wght@400;500;600;700&display=swap')) {
    content = content.replace(
      '&family=JetBrains+Mono:wght@400;500;600;700&display=swap',
      '&family=JetBrains+Mono:wght@400;500;600;700&display=fallback'
    );
    changed = true;
  }

  // 2. Add <script src="js/instant-nav.js"></script> before </body>
  if (!content.includes('js/instant-nav.js')) {
    if (content.includes('</body>')) {
      content = content.replace('</body>', '  <script src="js/instant-nav.js"></script>\n</body>');
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    updatedCount++;
    console.log(`Updated: ${file}`);
  } else {
    console.log(`Unchanged: ${file}`);
  }
}

console.log(`Total files updated: ${updatedCount} / ${htmlFiles.length}`);
