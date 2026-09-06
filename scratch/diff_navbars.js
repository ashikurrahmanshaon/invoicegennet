const fs = require('fs');

const idx = fs.readFileSync('index.html', 'utf-8').match(/<header class="navbar-saas">([\s\S]*?)<\/header>/)[0];
const feat = fs.readFileSync('features.html', 'utf-8').match(/<header class="navbar-saas">([\s\S]*?)<\/header>/)[0];

console.log('--- INDEX NAVBAR ---');
console.log(idx);
console.log('\n--- FEATURES NAVBAR ---');
console.log(feat);
