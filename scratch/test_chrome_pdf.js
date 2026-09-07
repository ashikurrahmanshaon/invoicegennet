const { spawn } = require('child_process');
const http = require('http');

async function testPdfInHeadlessChrome() {
  console.log('Testing PDF generation in headless Chrome...');
  
  // Launch Chrome with debugging port
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-sandbox',
    'http://localhost:57784/'
  ]);

  // Wait for Chrome to start
  await new Promise(r => setTimeout(r, 1500));

  // Get debug pages
  http.get('http://127.0.0.1:9222/json', (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', async () => {
      try {
        const targets = JSON.parse(data);
        console.log('Found Chrome targets:', targets.length);
        const page = targets.find(t => t.url.includes('localhost:57784'));
        if (page && page.webSocketDebuggerUrl) {
          console.log('Page target found, connecting via WebSocket...');
          const WebSocket = require('ws'); // If ws is available or test via fetch
        }
      } catch(e) {
        console.log('Error parsing targets:', e.message);
      } finally {
        chrome.kill();
      }
    });
  }).on('error', (e) => {
    console.log('Chrome connection error:', e.message);
    chrome.kill();
  });
}

testPdfInHeadlessChrome();
