const fs = require('fs');

// Verify that the generator has exact item description retrieval and default black palette
const code = fs.readFileSync('js/pdf-generator.js', 'utf-8');

const checks = [
  { name: 'Default themeAccent is #111827 (Pure black)', pass: code.includes("let themeAccent = '#111827';") },
  { name: 'Default tableHeaderBg is #383838 (Classic dark charcoal)', pass: code.includes("let tableHeaderBg = '#383838';") },
  { name: 'Item description fallback includes storeItem.description', pass: code.includes("storeItem.description || storeItem.desc") },
  { name: 'Item description selector includes .item-desc-field', pass: code.includes("row.querySelector('.item-desc-field')") },
  { name: 'Exact Plus Jakarta Sans font style embedded', pass: code.includes("font-family: 'Plus Jakarta Sans'") },
  { name: 'Awaits document.fonts.ready before capture', pass: code.includes("await document.fonts.ready;") },
  { name: 'Balance Due bar styled with #f3f4f6', pass: code.includes("background-color: #f3f4f6;") }
];

let allPassed = true;
checks.forEach(c => {
  if (c.pass) {
    console.log(`PASS: ${c.name}`);
  } else {
    console.error(`FAIL: ${c.name}`);
    allPassed = false;
  }
});

if (!allPassed) {
  process.exit(1);
}

console.log('\nALL ACCURATE FONT & BLACK DEFAULT CHECKS PASSED 100%!');
