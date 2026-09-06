const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));

console.log(`Checking ${htmlFiles.length} HTML files for compliance...`);

let issuesCount = 0;

htmlFiles.forEach(file => {
  const content = fs.readFileSync(path.join(rootDir, file), 'utf-8');

  // Check for emojis
  const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
  if (emojiRegex.test(content)) {
    console.log(`[EMOJI DETECTED] in ${file}`);
    issuesCount++;
  }

  // Check for green glow or filter
  if (content.includes('feDropShadow') || (content.includes('box-shadow') && content.includes('rgba(0, 200, 117'))) {
    console.log(`[GLOW INLINE] in ${file}`);
    issuesCount++;
  }

  // Check brand name in header
  if (!content.includes('Invoice-Gen') && !content.includes('InvoiceGen')) {
    console.log(`[BRAND MISSING] in ${file}`);
    issuesCount++;
  }
});

console.log(`Completed audit. Issues found: ${issuesCount}`);
