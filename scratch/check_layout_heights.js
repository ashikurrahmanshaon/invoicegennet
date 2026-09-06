const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto('http://localhost:57784/index.html', { waitUntil: 'networkidle0' });
  
  const invoiceBox = await page.$eval('#invoicePaper', el => {
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, height: r.height };
  });
  const sidebarBox = await page.$eval('.action-sidebar-panel', el => {
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, height: r.height };
  });
  
  console.log('Invoice Paper:', invoiceBox);
  console.log('Sidebar:', sidebarBox);
  console.log('Sidebar overhang below invoice:', sidebarBox.bottom - invoiceBox.bottom);
  
  await page.screenshot({ path: 'scratch/current_layout.png' });
  await browser.close();
})();
