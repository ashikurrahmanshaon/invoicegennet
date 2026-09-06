const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const scripts = [...content.matchAll(/<script[^>]*src=["']([^"']+)["'][^>]*>/g)].map(m => m[1]);
  const inlineScripts = [...content.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)].length;
  console.log(`${f.padEnd(38)} | Ext: ${scripts.join(', ').padEnd(55)} | Inline: ${inlineScripts}`);
}
