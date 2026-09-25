const fs = require('fs');

const server = fs.readFileSync('server.js', 'utf8');
const mapMatch = server.match(/const TOOL_ROUTE_MAP = \{([\s\S]*?)\};/);

if (!mapMatch) {
  console.log('No map found');
  process.exit(1);
}

const lines = mapMatch[1].split('\n');
console.log('Checking routes in TOOL_ROUTE_MAP...');

lines.forEach(line => {
  const m = line.match(/'([^']+)'\s*:\s*'([^']+)'/);
  if (m) {
    const route = m[1];
    const file = m[2];
    const exists = fs.existsSync(file);
    if (!exists) {
      console.log('MISSING FILE: ' + route + ' -> ' + file);
    }
  }
});
console.log('Check complete.');
