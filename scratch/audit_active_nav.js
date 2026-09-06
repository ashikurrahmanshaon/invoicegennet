const fs = require('fs');

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const activeLinks = [...content.matchAll(/<a[^>]*class=["'][^"']*nav-link-item\s+active[^"']*["'][^>]*>(.*?)<\/a>/g)].map(m => m[1]);
  console.log(f.padEnd(40), activeLinks.length > 0 ? activeLinks.join(', ') : '(NO ACTIVE LINK)');
});
