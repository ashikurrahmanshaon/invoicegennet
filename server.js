/* ==========================================================================
   INVOICEGEN NODE.JS SERVER & REST API
   Static Asset Server + Server-Side Invoice Storage API
   ========================================================================== */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 57784;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'invoices.json');

// Ensure data directory and database file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), 'utf-8');
}

// MIME types dictionary
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.xsl': 'application/xslt+xml; charset=utf-8'
};

function readInvoicesFromDisk() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw) || [];
  } catch (err) {
    console.error('Error reading DB_FILE:', err);
    return [];
  }
}

function writeInvoicesToDisk(invoices) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(invoices, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing DB_FILE:', err);
    return false;
  }
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  // ==========================================
  // API ROUTE: GET /api/invoices
  // ==========================================
  if (pathname === '/api/invoices' && req.method === 'GET') {
    const invoices = readInvoicesFromDisk();
    // Return summary list sorted newest first
    const summaries = invoices.map(inv => ({
      id: inv.id,
      number: inv.number || 'INV-001',
      clientName: inv.client?.name || 'Unnamed Client',
      senderName: inv.sender?.name || 'Your Business',
      date: inv.date || '',
      currency: inv.currency || 'USD',
      total: inv.totals?.grandTotal || 0,
      savedAt: inv.savedAt || new Date().toISOString()
    })).reverse();

    return sendJson(res, 200, { success: true, count: summaries.length, invoices: summaries });
  }

  // ==========================================
  // API ROUTE: POST /api/invoices (Save / Update)
  // ==========================================
  if (pathname === '/api/invoices' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const invoices = readInvoicesFromDisk();

        const id = payload.id || `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const record = {
          ...payload,
          id,
          savedAt: new Date().toISOString()
        };

        // Check if invoice with this id already exists (update it)
        const existingIdx = invoices.findIndex(i => i.id === id);
        if (existingIdx >= 0) {
          invoices[existingIdx] = record;
        } else {
          invoices.push(record);
        }

        writeInvoicesToDisk(invoices);
        return sendJson(res, 201, {
          success: true,
          message: 'Invoice saved successfully to server storage!',
          id,
          invoice: record
        });
      } catch (err) {
        return sendJson(res, 400, { success: false, error: 'Invalid JSON payload' });
      }
    });
    return;
  }

  // ==========================================
  // API ROUTE: GET /api/invoices/:id
  // ==========================================
  if (pathname.startsWith('/api/invoices/') && req.method === 'GET') {
    const id = pathname.replace('/api/invoices/', '');
    const invoices = readInvoicesFromDisk();
    const invoice = invoices.find(i => i.id === id);

    if (invoice) {
      return sendJson(res, 200, { success: true, invoice });
    } else {
      return sendJson(res, 404, { success: false, error: 'Invoice not found on server' });
    }
  }

  // ==========================================
  // API ROUTE: DELETE /api/invoices/:id
  // ==========================================
  if (pathname.startsWith('/api/invoices/') && req.method === 'DELETE') {
    const id = pathname.replace('/api/invoices/', '');
    let invoices = readInvoicesFromDisk();
    const initialLen = invoices.length;
    invoices = invoices.filter(i => i.id !== id);

    if (invoices.length < initialLen) {
      writeInvoicesToDisk(invoices);
      return sendJson(res, 200, { success: true, message: 'Invoice deleted from server storage' });
    } else {
      return sendJson(res, 404, { success: false, error: 'Invoice not found' });
    }
  }

  // ==========================================
  // STATIC ASSET SERVING
  // ==========================================
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

  // Security: Prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Access Denied');
  }

    const serveFile = (targetPath) => {
      const ext = path.extname(targetPath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const headers = { 'Content-Type': contentType };

      // Cache favicons, icons, images, and fonts permanently to eliminate browser tab shaking/re-fetching
      if (['.ico', '.svg', '.png', '.jpg', '.jpeg', '.woff2', '.woff'].includes(ext)) {
        headers['Cache-Control'] = 'public, max-age=31536000, immutable';
      }

      res.writeHead(200, headers);
      const stream = fs.createReadStream(targetPath);
      stream.pipe(res);
    };

    fs.stat(filePath, (err, stats) => {
      if (!err && stats.isFile()) {
        return serveFile(filePath);
      }

      // Check clean URL fallback (e.g. /templates -> templates.html)
      const htmlFallback = filePath + '.html';
      fs.stat(htmlFallback, (fallbackErr, fallbackStats) => {
        if (!fallbackErr && fallbackStats.isFile()) {
          return serveFile(htmlFallback);
        }

        // Check XML fallback (e.g. /sitemap -> sitemap.xml)
        const xmlFallback = filePath + '.xml';
        fs.stat(xmlFallback, (xmlErr, xmlStats) => {
          if (!xmlErr && xmlStats.isFile()) {
            return serveFile(xmlFallback);
          }

          const notFoundPath = path.join(__dirname, '404.html');
          fs.readFile(notFoundPath, (nfErr, nfData) => {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            if (!nfErr && nfData) {
              res.end(nfData);
            } else {
              res.end('<h1>404 - Page Not Found</h1>');
            }
          });
        });
      });
    });
});

server.listen(PORT, () => {
  console.log(`InvoiceGen server running with Server Storage API at http://localhost:${PORT}`);
});
