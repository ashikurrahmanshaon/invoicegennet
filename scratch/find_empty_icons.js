const fs = require('fs');

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const matches = [...content.matchAll(/<([a-z0-9_-]+)[^>]*class=["'][^"']*(?:icon|badge|preview|frame|box)[^"']*["'][^>]*>\s*<\/\1>/gi)];
  if (matches.length > 0) {
    console.log(f, 'found', matches.length, 'empty elements:');
    matches.forEach(m => console.log('   ', m[0]));
  }
});
