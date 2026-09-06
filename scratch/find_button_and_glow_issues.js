const fs = require('fs');
const path = require('path');

const cssDir = path.join(__dirname, '..', 'css');
const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));

console.log('--- SCANNING CSS FILES FOR GLOWS, HOVER JUMPS, AND ROUNDED BUTTONS ---');

cssFiles.forEach(file => {
  const content = fs.readFileSync(path.join(cssDir, file), 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    // Check for glow or colored box-shadows
    if (line.includes('box-shadow:') && (line.includes('rgba(0, 200, 117') || line.includes('rgba(5, 150, 105') || line.includes('rgba(16, 185, 129') || line.includes('rgba(245, 158, 11') || line.includes('primary-glow') || line.includes('shadow-emerald'))) {
      console.log(`[GLOW] ${file}:${lineNum}: ${line.trim()}`);
    }
    // Check for translateY
    if (line.includes('translateY(') || line.includes('scale(1.')) {
      console.log(`[JUMP/SHAKE] ${file}:${lineNum}: ${line.trim()}`);
    }
    // Check for large border-radius on buttons
    if (line.includes('border-radius') && (line.match(/border-radius:\s*(1[0-9]|2[0-9]|3[0-9]|9999)px/) || line.includes('var(--radius-full)'))) {
      console.log(`[ROUND RADIUS] ${file}:${lineNum}: ${line.trim()}`);
    }
  });
});
