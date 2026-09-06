const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));

let count = 0;

for (const file of htmlFiles) {
  const filePath = path.join(rootDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes('src="assets/icons/logo.svg"')) {
    content = content.replaceAll('src="assets/icons/logo.svg"', 'src="/assets/icons/logo.svg"');
    fs.writeFileSync(filePath, content, 'utf8');
    count++;
  }
}

console.log(`Updated brand icon paths to root-absolute in ${count} files.`);
