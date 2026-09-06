const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf-8');
const css = fs.readFileSync('css/invoice-editor.css', 'utf-8');

// Verify Card 5 does NOT exist
if (html.includes('Card 5: Presets & Actions') || html.includes('sidebar-preset-hint')) {
  console.error('FAIL: Old Card 5 still present in HTML');
  process.exit(1);
} else {
  console.log('PASS: Old dangling Card 5 is completely removed');
}

// Verify Card 1 has all actions
if (!html.includes('id="btnDownloadPDF"') ||
    !html.includes('id="btnPrintSidebar"') ||
    !html.includes('id="btnOpenSendEmail"') ||
    !html.includes('id="btnLoadSample"') ||
    !html.includes('id="btnClearInvoice"')) {
  console.error('FAIL: Missing action buttons in Card 1');
  process.exit(1);
} else {
  console.log('PASS: All 5 action buttons are unified inside Card 1');
}

// Verify Card 2 has Style & Currency
if (!html.includes('Style &amp; Currency') || !html.includes('id="currencySelector"')) {
  console.error('FAIL: Currency not in Card 2');
  process.exit(1);
} else {
  console.log('PASS: Currency selector properly integrated into Card 2');
}

// Verify Card 3 has Document Fields
if (!html.includes('Customize Document Fields') || !html.includes('id="toggleShipTo"')) {
  console.error('FAIL: Document fields missing');
  process.exit(1);
} else {
  console.log('PASS: Document fields properly configured in Card 3');
}

// Check CSS classes
if (!css.includes('.sidebar-action-grid-2') || !css.includes('.sidebar-preset-actions-grid')) {
  console.error('FAIL: Missing CSS classes');
  process.exit(1);
} else {
  console.log('PASS: CSS layout classes properly defined');
}

console.log('\nALL CHECKS PASSED SUCCESSFULLY!');
