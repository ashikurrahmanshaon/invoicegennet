const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));

let updated = 0;

for (const file of htmlFiles) {
  const filePath = path.join(rootDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes('js/google-auth.js')) {
    // Insert before instant-nav.js or before </body>
    if (content.includes('<script src="js/instant-nav.js"></script>')) {
      content = content.replace(
        '<script src="js/instant-nav.js"></script>',
        '<script src="js/google-auth.js"></script>\n  <script src="js/instant-nav.js"></script>'
      );
    } else if (content.includes('</body>')) {
      content = content.replace('</body>', '  <script src="js/google-auth.js"></script>\n</body>');
    }
    fs.writeFileSync(filePath, content, 'utf8');
    updated++;
    console.log(`Added google-auth.js to: ${file}`);
  }
}

console.log(`Total files updated: ${updated}`);
