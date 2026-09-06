const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf-8');
const css = fs.readFileSync('css/invoice-editor.css', 'utf-8');

console.log('btnLoadSample in HTML:', html.includes('id="btnLoadSample"'));
console.log('btnClearInvoice in HTML:', html.includes('id="btnClearInvoice"'));
console.log('btn-preset-action in CSS:', css.includes('.btn-preset-action'));
console.log('btn-preset-sample in CSS:', css.includes('.btn-preset-sample'));
console.log('btn-preset-clear in CSS:', css.includes('.btn-preset-clear'));
console.log('sidebar-preset-hint in CSS:', css.includes('.sidebar-preset-hint'));
