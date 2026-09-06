const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));

console.log(`Updating favicon tags across ${htmlFiles.length} HTML files...`);

const targetSnippetRegex = /<!-- Favicon[^>]*-->\s*<link rel="icon" type="image\/svg\+xml" href="assets\/icons\/logo\.svg">/g;

const replacement = `<!-- Favicon & App Icons (Fixed, Cached & Rock-Solid) -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="icon" type="image/svg+xml" href="/assets/icons/logo.svg">
  <link rel="shortcut icon" href="/favicon.ico">
  <link rel="apple-touch-icon" href="/assets/icons/logo.svg">`;

let count = 0;

for (const file of htmlFiles) {
  const filePath = path.join(rootDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  if (targetSnippetRegex.test(content)) {
    content = content.replace(targetSnippetRegex, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    count++;
    console.log(`Updated: ${file}`);
  } else if (!content.includes('/favicon.ico')) {
    // Fallback if slightly different comment
    const oldTag = '<link rel="icon" type="image/svg+xml" href="assets/icons/logo.svg">';
    if (content.includes(oldTag)) {
      content = content.replace(oldTag, `<link rel="icon" type="image/x-icon" href="/favicon.ico">\n  <link rel="icon" type="image/svg+xml" href="/assets/icons/logo.svg">\n  <link rel="shortcut icon" href="/favicon.ico">\n  <link rel="apple-touch-icon" href="/assets/icons/logo.svg">`);
      fs.writeFileSync(filePath, content, 'utf8');
      count++;
      console.log(`Updated via fallback: ${file}`);
    } else {
      console.log(`Already has favicon or not matched: ${file}`);
    }
  } else {
    console.log(`Already up to date: ${file}`);
  }
}

console.log(`Total files updated: ${count} / ${htmlFiles.length}`);
