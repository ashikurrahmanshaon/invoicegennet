const { spawn } = require('child_process');
const http = require('http');

async function testFullPdfDownload() {
  console.log('Testing full PDF download flow in headless Chrome...');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-sandbox',
    'http://localhost:57784/'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const targets = await new Promise((resolve, reject) => {
      http.get('http://127.0.0.1:9222/json', res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => resolve(JSON.parse(d)));
      }).on('error', reject);
    });

    const page = targets.find(t => t.url.includes('localhost:57784'));
    const ws = new WebSocket(page.webSocketDebuggerUrl);

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    const send = (method, params = {}) => new Promise((resolve) => {
      const id = msgId++;
      const handler = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id === id) {
          ws.removeEventListener('message', handler);
          resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });

    // Load sample data
    await send('Runtime.evaluate', {
      expression: `if (window.invoiceStore) window.invoiceStore.loadSample();`,
      awaitPromise: true
    });

    // Test downloadPDF execution
    const res = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          try {
            const el = window.pdfEngine.buildPrintableA4Element();
            const opt = {
              margin: [10, 10, 10, 10],
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { scale: 2, useCORS: true, logging: false },
              jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            const pdfDataUri = await html2pdf().set(opt).from(el).output('datauristring');
            
            return {
              success: true,
              length: pdfDataUri.length,
              sample: pdfDataUri.substring(0, 60),
              hasValidSize: pdfDataUri.length > 80000
            };
          } catch(err) {
            return { error: err.message, stack: err.stack };
          }
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    console.log('Final Live Test Result:');
    console.log(JSON.stringify(res, null, 2));

    ws.close();
  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    chrome.kill();
  }
}

testFullPdfDownload();
