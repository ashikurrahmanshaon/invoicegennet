const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
let errors = 0;
let validSchemas = 0;

fs.readdirSync(rootDir).forEach(f => {
  if (f.endsWith('.html')) {
    const content = fs.readFileSync(path.join(rootDir, f), 'utf8');
    const regex = /<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = regex.exec(content)) !== null) {
      try {
        const parsed = JSON.parse(match[1]);
        validSchemas++;
      } catch (err) {
        console.error('JSON-LD ERROR in ' + f + ':', err.message);
        errors++;
      }
    }
  }
});

console.log('Total valid schemas parsed:', validSchemas);
console.log('Total schema errors:', errors);
if (errors > 0) process.exit(1);
