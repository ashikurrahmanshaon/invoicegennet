const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));

const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

let errors = [];

console.log(`Auditing ${htmlFiles.length} HTML files for visual polish, box icons, and trust consistency...`);

for (const file of htmlFiles) {
  const filePath = path.join(rootDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');

  // 1. Emoji check
  const emojiMatch = content.match(emojiRegex);
  if (emojiMatch) {
    errors.push(`${file} contains emoji: ${emojiMatch[0]}`);
  }

  // 2. Outdated email check
  if (content.includes('@invoicegen.net')) {
    errors.push(`${file} contains outdated @invoicegen.net email`);
  }

  // 3. Navbar check
  if (!content.includes('navbar-saas')) {
    errors.push(`${file} missing navbar-saas`);
  }
  if (!content.includes('nav-center-links')) {
    errors.push(`${file} missing nav-center-links`);
  }

  // 4. Footer check
  if (!content.includes('footer-brand-copyright') && !file.includes('login') && !file.includes('signup')) {
    errors.push(`${file} missing footer-brand-copyright`);
  }
  if (content.includes('footer-bottom-trust-row')) {
    errors.push(`${file} contains unwanted footer-bottom-trust-row`);
  }

  // 5. CSS links check
  if (!content.includes('css/design-system.css') || !content.includes('css/invoice-editor.css')) {
    errors.push(`${file} missing core CSS links`);
  }
}

console.log('\n--- VISUAL AUDIT RESULTS ---');
if (errors.length === 0) {
  console.log(`SUCCESS: All ${htmlFiles.length} pages verified 100% compliant with the unified, simple, trusted SaaS design system!`);
} else {
  console.error(`Found ${errors.length} visual issues:`);
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
}
