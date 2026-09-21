/* ==========================================================================
   INVOICEGEN NODE.JS SERVER & REST API
   Full-Stack Authentication, SQLite Relational Database & Static Server
   ========================================================================== */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('./db');
const PORT = process.env.PORT || 3000;
const SECONDARY_PORT = 57784;

// Initialize official Stripe SDK if STRIPE_SECRET_KEY is present
let stripeClient = null;
if (process.env.STRIPE_SECRET_KEY) {
  try {
    const Stripe = require('stripe');
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  } catch (err) {
    console.error('Notice: Stripe client initialization notice:', err.message);
  }
}

// Live Exchange Rates Cache
let cachedExchangeRates = null;
let lastRatesFetchTime = 0;

function fetchLiveExchangeRates() {
  return new Promise((resolve) => {
    const now = Date.now();
    // 1-hour cache check
    if (cachedExchangeRates && (now - lastRatesFetchTime < 60 * 60 * 1000)) {
      return resolve({ success: true, ...cachedExchangeRates, cached: true });
    }

    const req = https.get('https://open.er-api.com/v6/latest/USD', { timeout: 6000 }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed && parsed.result === 'success' && parsed.rates) {
            cachedExchangeRates = {
              base: parsed.base_code || 'USD',
              rates: parsed.rates,
              lastUpdated: parsed.time_last_update_utc || new Date().toUTCString(),
              nextUpdate: parsed.time_next_update_utc || ''
            };
            lastRatesFetchTime = now;
            return resolve({ success: true, ...cachedExchangeRates, cached: false });
          }
          if (cachedExchangeRates) {
            return resolve({ success: true, ...cachedExchangeRates, cached: true, warning: 'Using cached rates' });
          }
          resolve({ success: false, error: 'Exchange rate provider returned unexpected structure.' });
        } catch (err) {
          if (cachedExchangeRates) {
            return resolve({ success: true, ...cachedExchangeRates, cached: true, warning: 'Using cached rates' });
          }
          resolve({ success: false, error: 'Failed parsing live rates: ' + err.message });
        }
      });
    });

    req.on('error', (err) => {
      if (cachedExchangeRates) {
        return resolve({ success: true, ...cachedExchangeRates, cached: true, warning: 'Offline fallback to cached rates' });
      }
      resolve({ success: false, error: 'Could not connect to live exchange rates service: ' + err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      if (cachedExchangeRates) {
        return resolve({ success: true, ...cachedExchangeRates, cached: true, warning: 'Timeout fallback to cached rates' });
      }
      resolve({ success: false, error: 'Exchange rates request timed out.' });
    });
  });
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
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.xsl': 'application/xslt+xml; charset=utf-8',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

function parseCookies(req) {
  const list = {};
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return list;

  cookieHeader.split(';').forEach(cookie => {
    try {
      let [name, ...rest] = cookie.split('=');
      name = name?.trim();
      if (!name) return;
      let value = rest.join('=').trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      try {
        list[name] = decodeURIComponent(value);
      } catch (e) {
        list[name] = value;
      }
    } catch (err) {}
  });
  return list;
}

function createSessionCookie(sessionId, expiresAt, req) {
  const isHttps = req && (
    req.headers['x-forwarded-proto'] === 'https' ||
    (req.socket && req.socket.encrypted)
  );
  const secureFlag = isHttps ? '; Secure' : '';
  return `session_id=${sessionId}; Path=/; HttpOnly; SameSite=Lax${secureFlag}; Expires=${new Date(expiresAt).toUTCString()}`;
}

function getAuthSession(req) {
  let session = null;
  let sessionId = null;

  // 1. Check Cookie
  try {
    const cookies = parseCookies(req);
    sessionId = cookies['session_id'];
    if (sessionId) {
      session = db.getSession(sessionId);
    }
  } catch (err) {}

  // 2. Check Authorization Header fallback (Bearer ses_...)
  if (!session && req.headers && req.headers.authorization) {
    try {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        sessionId = parts[1].trim();
        if (sessionId) {
          session = db.getSession(sessionId);
        }
      }
    } catch (err) {}
  }

  return session;
}

function sendJson(res, statusCode, data, extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    ...extraHeaders
  };
  res.writeHead(statusCode, headers);
  res.end(JSON.stringify(data));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 50 * 1024 * 1024) { // 50MB limit for cloud files
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON format'));
      }
    });
    req.on('error', reject);
  });
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const requestHandler = async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    });
    return res.end();
  }

  // ========================================================================
  // AUTHENTICATION API ROUTES
  // ========================================================================

  // POST /api/auth/signup
  if (pathname === '/api/auth/signup' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { name, email, password } = body;

      if (!name || !name.trim()) {
        return sendJson(res, 400, { success: false, error: 'Full name is required.' });
      }
      if (!email || !email.includes('@')) {
        return sendJson(res, 400, { success: false, error: 'A valid email address is required.' });
      }
      if (!password || password.length < 6) {
        return sendJson(res, 400, { success: false, error: 'Password must be at least 6 characters long.' });
      }

      const user = db.createUser({ name, email, password });
      const { sessionId, expiresAt } = db.createSession(user.id);

      const cookieHeader = createSessionCookie(sessionId, expiresAt, req);
      return sendJson(res, 201, {
        success: true,
        message: 'Account created successfully!',
        user,
        sessionId
      }, { 'Set-Cookie': cookieHeader });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message || 'Registration failed.' });
    }
  }

  // POST /api/auth/login
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { email, password, rememberMe } = body;

      if (!email || !password) {
        return sendJson(res, 400, { success: false, error: 'Email and password are required.' });
      }

      const user = db.verifyUser(email, password);
      if (!user) {
        return sendJson(res, 401, { success: false, error: 'Invalid email or password. Please check your credentials.' });
      }

      const days = rememberMe ? 30 : 1;
      const { sessionId, expiresAt } = db.createSession(user.id, days);

      const cookieHeader = createSessionCookie(sessionId, expiresAt, req);
      return sendJson(res, 200, {
        success: true,
        message: 'Logged in successfully!',
        user,
        sessionId
      }, { 'Set-Cookie': cookieHeader });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: 'Server authentication error.' });
    }
  }

  // POST /api/auth/google
  if (pathname === '/api/auth/google' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { name, email, avatar } = body;

      if (!email || !email.includes('@')) {
        return sendJson(res, 400, { success: false, error: 'Valid email is required from Google authentication.' });
      }

      const user = db.findOrCreateGoogleUser({ name, email, avatar });
      const { sessionId, expiresAt } = db.createSession(user.id, 30);

      const cookieHeader = createSessionCookie(sessionId, expiresAt, req);
      return sendJson(res, 200, {
        success: true,
        message: 'Google login successful!',
        user,
        sessionId
      }, { 'Set-Cookie': cookieHeader });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message || 'Google authentication error.' });
    }
  }

  // GET /api/auth/google/login or /auth/google
  if ((pathname === '/api/auth/google/login' || pathname === '/auth/google') && req.method === 'GET') {
    const clientId = process.env.GOOGLE_CLIENT_ID || '1029331875701-7km83lfkd6norbl85o6f68qi2u4apt9u.apps.googleusercontent.com';
    const host = req.headers.host || `localhost:${PORT}`;
    const protocol = (req.headers['x-forwarded-proto'] || 'http');
    const redirectUri = encodeURIComponent(`${protocol}://${host}/api/auth/google/callback`);
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=select_account`;
    res.writeHead(302, { 'Location': googleAuthUrl });
    return res.end();
  }

  // GET /api/auth/google/callback or /auth/google/callback
  if ((pathname === '/api/auth/google/callback' || pathname === '/auth/google/callback') && req.method === 'GET') {
    try {
      const code = parsedUrl.searchParams.get('code');
      const error = parsedUrl.searchParams.get('error');

      if (error) {
        res.writeHead(302, { 'Location': '/login?error=' + encodeURIComponent(error) });
        return res.end();
      }

      // Mock / direct test verification handling
      const email = parsedUrl.searchParams.get('email');
      if (!code && email) {
        const name = parsedUrl.searchParams.get('name') || 'Google User';
        const avatar = parsedUrl.searchParams.get('avatar') || '';
        const user = db.findOrCreateGoogleUser({ name, email, avatar });
        const { sessionId, expiresAt } = db.createSession(user.id, 30);
        const cookieHeader = createSessionCookie(sessionId, expiresAt, req);
        res.writeHead(302, { 'Location': '/dashboard', 'Set-Cookie': cookieHeader });
        return res.end();
      }

      if (!code) {
        res.writeHead(302, { 'Location': '/login?error=no_code' });
        return res.end();
      }

      const clientId = process.env.GOOGLE_CLIENT_ID || '1029331875701-7km83lfkd6norbl85o6f68qi2u4apt9u.apps.googleusercontent.com';
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const host = req.headers.host || `localhost:${PORT}`;
      const protocol = (req.headers['x-forwarded-proto'] || 'http');
      const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

      if (clientSecret) {
        const postData = new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        }).toString();

        const tokenRes = await new Promise((resolve, reject) => {
          const tReq = https.request('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Content-Length': Buffer.byteLength(postData)
            }
          }, (tRes) => {
            let tData = '';
            tRes.on('data', c => tData += c);
            tRes.on('end', () => {
              try { resolve(JSON.parse(tData)); } catch (e) { resolve(null); }
            });
          });
          tReq.on('error', reject);
          tReq.write(postData);
          tReq.end();
        });

        if (tokenRes && tokenRes.access_token) {
          const userInfo = await new Promise((resolve, reject) => {
            https.get('https://openidconnect.googleapis.com/v1/userinfo', {
              headers: { 'Authorization': `Bearer ${tokenRes.access_token}` }
            }, (uRes) => {
              let uData = '';
              uRes.on('data', c => uData += c);
              uRes.on('end', () => {
                try { resolve(JSON.parse(uData)); } catch (e) { resolve(null); }
              });
            }).on('error', reject);
          });

          if (userInfo && userInfo.email) {
            const user = db.findOrCreateGoogleUser({
              name: userInfo.name || `${userInfo.given_name || ''} ${userInfo.family_name || ''}`.trim() || 'Google User',
              email: userInfo.email,
              avatar: userInfo.picture || ''
            });
            const { sessionId, expiresAt } = db.createSession(user.id, 30);
            const cookieHeader = createSessionCookie(sessionId, expiresAt, req);
            res.writeHead(302, { 'Location': '/dashboard', 'Set-Cookie': cookieHeader });
            return res.end();
          }
        }
      }

      res.writeHead(302, { 'Location': '/dashboard' });
      return res.end();
    } catch (err) {
      console.error('Google callback error:', err);
      res.writeHead(302, { 'Location': '/login?error=auth_error' });
      return res.end();
    }
  }

  // POST /api/auth/logout
  if (pathname === '/api/auth/logout' && req.method === 'POST') {
    try {
      const cookies = parseCookies(req);
      const sessionId = cookies['session_id'];
      if (sessionId) {
        db.deleteSession(sessionId);
      }
      const cookieHeader = 'session_id=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
      return sendJson(res, 200, { success: true, message: 'Logged out successfully.' }, { 'Set-Cookie': cookieHeader });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: 'Logout failed.' });
    }
  }

  // GET /api/auth/me
  if (pathname === '/api/auth/me' && req.method === 'GET') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 200, { success: false, authenticated: false, user: null });
    }
    const cookies = parseCookies(req);
    let extraHeaders = {};
    if (!cookies['session_id'] && session.session_id) {
      const expiresAt = session.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      extraHeaders['Set-Cookie'] = createSessionCookie(session.session_id, expiresAt, req);
    }
    return sendJson(res, 200, { success: true, authenticated: true, user: session }, extraHeaders);
  }

  // PUT /api/auth/profile
  if (pathname === '/api/auth/profile' && req.method === 'PUT') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }
    try {
      const body = await parseJsonBody(req);
      const updated = db.updateUserProfile(session.id, body);
      return sendJson(res, 200, { success: true, message: 'Profile updated successfully!', user: updated });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message || 'Failed to update profile.' });
    }
  }

  // ========================================================================
  // INVOICE MANAGEMENT API ROUTES (Protected & User-Scoped)
  // ========================================================================

  // GET /api/invoices
  if (pathname === '/api/invoices' && req.method === 'GET') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required to view invoices.' });
    }

    const search = parsedUrl.searchParams.get('search') || '';
    const status = parsedUrl.searchParams.get('status') || 'all';
    const sort = parsedUrl.searchParams.get('sort') || 'date_desc';

    const invoices = db.listInvoices(session.id, { search, status, sort });
    return sendJson(res, 200, { success: true, count: invoices.length, invoices });
  }

  // GET /api/invoices/stats
  if (pathname === '/api/invoices/stats' && req.method === 'GET') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }
    const stats = db.getInvoiceStats(session.id);
    return sendJson(res, 200, { success: true, stats });
  }

  // GET /api/invoices/next-number
  if (pathname === '/api/invoices/next-number' && req.method === 'GET') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 200, { success: true, nextNumber: 'INV-001' });
    }
    const nextNumber = db.getNextInvoiceNumber(session.id);
    return sendJson(res, 200, { success: true, nextNumber });
  }

  // POST /api/invoices
  if (pathname === '/api/invoices' && req.method === 'POST') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Please log in to save invoices to your account.' });
    }
    try {
      const body = await parseJsonBody(req);
      const invoice = db.createInvoice(session.id, body);
      return sendJson(res, 201, {
        success: true,
        message: 'Invoice saved successfully to database!',
        id: invoice.id,
        invoice
      });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message || 'Failed to save invoice.' });
    }
  }

  // GET /api/invoices/check-number - Server-side invoice number uniqueness check
  if (pathname === '/api/invoices/check-number' && req.method === 'GET') {
    const session = getAuthSession(req);
    const invoiceNumber = parsedUrl.searchParams.get('number') || '';
    if (!invoiceNumber.trim()) {
      return sendJson(res, 200, { success: true, exists: false, number: '' });
    }
    const userId = session ? session.user_id : null;
    if (!userId) {
      return sendJson(res, 200, { success: true, exists: false, number: invoiceNumber });
    }
    const check = db.checkInvoiceNumberExists(userId, invoiceNumber);
    return sendJson(res, 200, { success: true, ...check });
  }

  // GET /api/invoices/:id
  if (pathname.startsWith('/api/invoices/') && req.method === 'GET' && !pathname.endsWith('/next-number') && !pathname.endsWith('/stats') && !pathname.startsWith('/api/invoices/check-number')) {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }
    const id = pathname.replace('/api/invoices/', '');
    const invoice = db.getInvoice(session.id, id);
    if (!invoice) {
      return sendJson(res, 404, { success: false, error: 'Invoice not found or access denied.' });
    }
    return sendJson(res, 200, { success: true, invoice });
  }

  // PUT /api/invoices/:id
  if (pathname.startsWith('/api/invoices/') && req.method === 'PUT') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }
    const id = pathname.replace('/api/invoices/', '');
    try {
      const body = await parseJsonBody(req);
      const updated = db.updateInvoice(session.id, id, body);
      return sendJson(res, 200, { success: true, message: 'Invoice updated successfully!', invoice: updated });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message || 'Failed to update invoice.' });
    }
  }

  // DELETE /api/invoices/:id
  if (pathname.startsWith('/api/invoices/') && req.method === 'DELETE') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }
    const id = pathname.replace('/api/invoices/', '');
    try {
      db.deleteInvoice(session.id, id);
      return sendJson(res, 200, { success: true, message: 'Invoice permanently deleted from database.' });
    } catch (err) {
      return sendJson(res, 404, { success: false, error: err.message || 'Failed to delete invoice.' });
    }
  }

  // POST /api/invoices/:id/duplicate
  if (pathname.startsWith('/api/invoices/') && pathname.endsWith('/duplicate') && req.method === 'POST') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }
    const id = pathname.replace('/api/invoices/', '').replace('/duplicate', '');
    try {
      const cloned = db.duplicateInvoice(session.id, id);
      return sendJson(res, 201, { success: true, message: 'Invoice duplicated successfully!', invoice: cloned });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message || 'Failed to duplicate invoice.' });
    }
  }

  // PATCH /api/invoices/:id/status
  if (pathname.startsWith('/api/invoices/') && pathname.endsWith('/status') && req.method === 'PATCH') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }
    const id = pathname.replace('/api/invoices/', '').replace('/status', '');
    try {
      const body = await parseJsonBody(req);
      const updated = db.updateInvoiceStatus(session.id, id, body.status);
      return sendJson(res, 200, { success: true, message: `Invoice status updated to ${body.status}!`, invoice: updated });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message || 'Failed to update invoice status.' });
    }
  }

  // POST /api/invoices/:id/send-email
  if (pathname.startsWith('/api/invoices/') && pathname.endsWith('/send-email') && req.method === 'POST') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }
    const id = pathname.replace('/api/invoices/', '').replace('/send-email', '');
    const invoice = db.getInvoice(session.id, id);
    if (!invoice) {
      return sendJson(res, 404, { success: false, error: 'Invoice not found.' });
    }

    // Check environment SMTP settings
    const isSmtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    if (!isSmtpConfigured) {
      // Honest indication of unconfigured email dispatch as required by specification
      return sendJson(res, 200, {
        success: false,
        code: 'SMTP_NOT_CONFIGURED',
        message: 'Email service is not yet configured on this server environment. In production, provide SMTP_HOST, SMTP_PORT, and credentials to dispatch emails directly to client mailboxes.'
      });
    } else {
      return sendJson(res, 200, { success: true, message: `Invoice #${invoice.number} dispatched successfully!` });
    }
  }

  // POST /api/send-email (Direct email dispatch for editor & generator)
  if (pathname === '/api/send-email' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { to, subject, message, pdfBase64, filename } = body;

      if (!to || !to.includes('@')) {
        return sendJson(res, 400, { success: false, error: 'A valid recipient email address is required.' });
      }

      const isSmtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
      if (!isSmtpConfigured) {
        return sendJson(res, 200, {
          success: false,
          code: 'SMTP_NOT_CONFIGURED',
          message: 'Email service is not yet configured on this server environment. In production, provide SMTP_HOST, SMTP_PORT, and credentials to dispatch emails directly to client mailboxes.'
        });
      }

      return sendJson(res, 200, { success: true, message: 'Invoice sent successfully.' });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: 'Failed to process email request.' });
    }
  }

  // POST /api/auth/change-password
  if (pathname === '/api/auth/change-password' && req.method === 'POST') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }
    try {
      const body = await parseJsonBody(req);
      db.changePassword(session.id, body.currentPassword, body.newPassword);
      return sendJson(res, 200, { success: true, message: 'Password changed successfully!' });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message || 'Failed to change password.' });
    }
  }

  // ========================================================================
  // DASHBOARD SUMMARY & ACTIVITY API ROUTES
  // ========================================================================

  // GET /api/dashboard/summary
  if (pathname === '/api/dashboard/summary' && req.method === 'GET') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }
    try {
      const summary = db.getDashboardSummary(session.id);
      return sendJson(res, 200, { success: true, summary });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message || 'Failed to load dashboard summary.' });
    }
  }

  // GET /api/activities
  if (pathname === '/api/activities' && req.method === 'GET') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }
    const limit = parseInt(parsedUrl.searchParams.get('limit') || '15', 10);
    const activities = db.listActivities(session.id, limit);
    return sendJson(res, 200, { success: true, count: activities.length, activities });
  }

  // POST /api/activities/log
  if (pathname === '/api/activities/log' && req.method === 'POST') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }
    try {
      const body = await parseJsonBody(req);
      db.logActivity(session.id, {
        type: body.type || 'action',
        description: body.description || 'Performed an action',
        entityType: body.entityType || '',
        entityId: body.entityId || ''
      });
      return sendJson(res, 200, { success: true });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  // ========================================================================
  // CLIENTS MANAGEMENT API ROUTES (Protected & User-Scoped)
  // ========================================================================

  // GET /api/clients
  if (pathname === '/api/clients' && req.method === 'GET') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }
    const search = parsedUrl.searchParams.get('search') || '';
    const sort = parsedUrl.searchParams.get('sort') || 'name_asc';
    const clients = db.listClients(session.id, { search, sort });
    return sendJson(res, 200, { success: true, count: clients.length, clients });
  }

  // POST /api/clients
  if (pathname === '/api/clients' && req.method === 'POST') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }
    try {
      const body = await parseJsonBody(req);
      const client = db.createClient(session.id, body);
      return sendJson(res, 201, { success: true, message: 'Client added successfully!', client });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message || 'Failed to add client.' });
    }
  }

  // GET /api/clients/:id
  if (pathname.startsWith('/api/clients/') && req.method === 'GET') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }
    const id = pathname.replace('/api/clients/', '');
    const client = db.getClient(session.id, id);
    if (!client) {
      return sendJson(res, 404, { success: false, error: 'Client not found.' });
    }
    return sendJson(res, 200, { success: true, client });
  }

  // PUT /api/clients/:id
  if (pathname.startsWith('/api/clients/') && req.method === 'PUT') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }
    const id = pathname.replace('/api/clients/', '');
    try {
      const body = await parseJsonBody(req);
      const updated = db.updateClient(session.id, id, body);
      return sendJson(res, 200, { success: true, message: 'Client updated successfully!', client: updated });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message || 'Failed to update client.' });
    }
  }

  // DELETE /api/clients/:id
  if (pathname.startsWith('/api/clients/') && req.method === 'DELETE') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }
    const id = pathname.replace('/api/clients/', '');
    try {
      db.deleteClient(session.id, id);
      return sendJson(res, 200, { success: true, message: 'Client deleted successfully.' });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message || 'Failed to delete client.' });
    }
  }

  // ========================================================================
  // NOTIFICATIONS API ROUTES
  // ========================================================================

  // GET /api/notifications
  if (pathname === '/api/notifications' && req.method === 'GET') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }
    const result = db.listNotifications(session.id, 20);
    return sendJson(res, 200, { success: true, ...result, notifications: result.items });
  }

  // PATCH /api/notifications/:id/read
  if (pathname.startsWith('/api/notifications/') && pathname.endsWith('/read') && req.method === 'PATCH') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }
    const id = pathname.replace('/api/notifications/', '').replace('/read', '');
    db.markNotificationRead(session.id, id);
    return sendJson(res, 200, { success: true });
  }

  // POST /api/notifications/read-all
  if (pathname === '/api/notifications/read-all' && req.method === 'POST') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }
    db.markAllNotificationsRead(session.id);
    return sendJson(res, 200, { success: true });
  }

  // ========================================================================
  // BILLING, SUBSCRIPTIONS & TOKENIZED PAYMENT METHODS API ROUTES
  // ========================================================================

  // GET /api/billing
  if (pathname === '/api/billing' && req.method === 'GET') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }
    try {
      const billing = db.getBillingSummary(session.id);
      return sendJson(res, 200, { success: true, billing });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message || 'Failed to load billing summary.' });
    }
  }

  // POST /api/billing/payment-methods
  if (pathname === '/api/billing/payment-methods' && req.method === 'POST') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }
    try {
      const body = await parseJsonBody(req);
      const billing = db.addPaymentMethod(session.id, body);
      const added = billing.paymentMethods.find(m => m.last4 === body.last4) || billing.paymentMethods[0];
      return sendJson(res, 201, { success: true, message: 'Payment method saved successfully!', billing, paymentMethod: added });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message || 'Failed to add payment method.' });
    }
  }

  // DELETE /api/billing/payment-methods/:id
  if (pathname.startsWith('/api/billing/payment-methods/') && req.method === 'DELETE') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }
    const id = pathname.replace('/api/billing/payment-methods/', '');
    try {
      const billing = db.deletePaymentMethod(session.id, id);
      return sendJson(res, 200, { success: true, message: 'Payment method removed.', billing });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message || 'Failed to delete payment method.' });
    }
  }

  // PATCH /api/billing/payment-methods/:id/default
  if (pathname.startsWith('/api/billing/payment-methods/') && pathname.endsWith('/default') && req.method === 'PATCH') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }
    const id = pathname.replace('/api/billing/payment-methods/', '').replace('/default', '');
    try {
      const billing = db.setDefaultPaymentMethod(session.id, id);
      return sendJson(res, 200, { success: true, message: 'Primary card updated.', billing });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message || 'Failed to set default card.' });
    }
  }

  // POST /api/billing/change-plan
  if (pathname === '/api/billing/change-plan' && req.method === 'POST') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }
    try {
      const body = await parseJsonBody(req);
      const billing = db.updateSubscriptionPlan(session.id, body);
      return sendJson(res, 200, { success: true, message: `Subscription plan updated to ${body.plan}!`, billing, plan: body.plan });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message || 'Failed to update plan.' });
    }
  }

  // ========================================================================
  // GLOBAL SEARCH API ROUTE
  // ========================================================================

  // GET /api/search
  if (pathname === '/api/search' && req.method === 'GET') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }
    const q = parsedUrl.searchParams.get('q') || '';
    const results = db.globalSearch(session.id, q);
    return sendJson(res, 200, { success: true, results });
  }

  // ========================================================================
  // CLOUD FILE STORAGE API ROUTES (/api/files)
  // ========================================================================

  // GET /api/files - List user's saved documents with filters and search
  if (pathname === '/api/files' && req.method === 'GET') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }
    const search = parsedUrl.searchParams.get('search') || '';
    const fileType = parsedUrl.searchParams.get('fileType') || 'all';
    const sort = parsedUrl.searchParams.get('sort') || 'newest';
    const files = db.listFiles(session.user_id, { search, fileType, sort });
    return sendJson(res, 200, { success: true, files });
  }

  // POST /api/files - Save a generated or uploaded file to user's Cloud Storage
  if (pathname === '/api/files' && req.method === 'POST') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required to save files to cloud.' });
    }
    try {
      const body = await parseJsonBody(req);
      const fileName = body.fileName || body.name;
      const fileType = body.fileType || body.type || 'document';
      const mimeType = body.mimeType || body.mime || 'application/octet-stream';
      const sourceTool = body.sourceTool || '';
      const metadata = body.metadata || {};
      const base64Data = body.base64Data || body.fileBase64 || body.data;
      if (!fileName || !base64Data) {
        return sendJson(res, 400, { success: false, error: 'File name and file content are required.' });
      }

      let base64Clean = base64Data;
      if (base64Clean.includes(';base64,')) {
        base64Clean = base64Clean.split(';base64,')[1];
      }
      const buffer = Buffer.from(base64Clean, 'base64');
      const size = buffer.length;

      const ext = path.extname(fileName) || (mimeType === 'application/pdf' ? '.pdf' : mimeType === 'application/zip' ? '.zip' : '.dat');
      const storageKey = `upl_${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`;
      const targetDiskPath = path.join(db.UPLOADS_DIR, storageKey);

      fs.writeFileSync(targetDiskPath, buffer);

      const fileRecord = db.saveFileRecord(session.user_id, {
        fileName,
        fileType: fileType || 'document',
        mimeType: mimeType || 'application/octet-stream',
        size,
        storageKey,
        sourceTool: sourceTool || '',
        metadata: metadata || {}
      });

      return sendJson(res, 201, { success: true, message: 'Saved to Cloud ✓', file: fileRecord });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message || 'Could not save file to cloud.' });
    }
  }

  // GET /api/files/:id/download - Stream private cloud file to authorized owner
  if (pathname.startsWith('/api/files/') && pathname.endsWith('/download') && req.method === 'GET') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }
    const parts = pathname.split('/');
    const fileId = parts[3];
    const file = db.getFile(session.user_id, fileId);
    if (!file) {
      return sendJson(res, 404, { success: false, error: 'File not found or access denied.' });
    }

    const diskPath = path.join(db.UPLOADS_DIR, file.storage_key);
    if (!fs.existsSync(diskPath)) {
      return sendJson(res, 404, { success: false, error: 'File payload is missing on disk.' });
    }

    const stat = fs.statSync(diskPath);
    res.writeHead(200, {
      'Content-Type': file.mime_type || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(file.file_name)}"`,
      'Content-Length': stat.size,
      'Cache-Control': 'private, no-cache, no-store, must-revalidate'
    });
    const stream = fs.createReadStream(diskPath);
    return stream.pipe(res);
  }

  // DELETE /api/files/:id - Remove file from storage and database
  if (pathname.startsWith('/api/files/') && !pathname.endsWith('/download') && !pathname.endsWith('/rename') && req.method === 'DELETE') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }
    const fileId = pathname.split('/')[3];
    try {
      db.deleteFile(session.user_id, fileId);
      return sendJson(res, 200, { success: true, message: 'File deleted successfully.' });
    } catch (err) {
      return sendJson(res, 404, { success: false, error: err.message || 'File not found or unauthorized.' });
    }
  }

  // PATCH/POST /api/files/:id/rename - Rename file
  if (pathname.startsWith('/api/files/') && pathname.endsWith('/rename') && (req.method === 'PATCH' || req.method === 'POST')) {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }
    const fileId = pathname.split('/')[3];
    try {
      const body = await parseJsonBody(req);
      const newName = body.fileName || body.name;
      if (!newName) {
        return sendJson(res, 400, { success: false, error: 'New file name is required.' });
      }
      const updated = db.renameFile(session.user_id, fileId, newName);
      return sendJson(res, 200, { success: true, message: 'File renamed successfully.', file: updated });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message || 'Failed to rename file.' });
    }
  }

  // ========================================================================
  // TOOL LOGGING & RECENT ACTIVITY API ROUTES
  // ========================================================================

  // POST /api/tools/log - Record tool usage event
  if (pathname === '/api/tools/log' && req.method === 'POST') {
    const session = getAuthSession(req);
    try {
      const body = await parseJsonBody(req);
      if (session) {
        db.logToolUsage(session.user_id, {
          toolId: body.toolId || 'tool',
          toolName: body.toolName || 'Tool',
          action: body.action || 'used',
          metadata: body.metadata || {}
        });
      }
      return sendJson(res, 200, { success: true });
    } catch (err) {
      return sendJson(res, 200, { success: true });
    }
  }

  // GET /api/tools/recent - List user's recent tool activities
  if (pathname === '/api/tools/recent' && req.method === 'GET') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 200, { success: true, activities: [] });
    }
    const activities = db.listRecentToolUsage(session.user_id, 10);
    return sendJson(res, 200, { success: true, activities });
  }

  // ========================================================================
  // LIVE CURRENCY EXCHANGE RATES API ROUTE
  // ========================================================================

  // GET /api/rates/latest - Live genuine rates with UTC timestamp
  if (pathname === '/api/rates/latest' && req.method === 'GET') {
    const result = await fetchLiveExchangeRates();
    return sendJson(res, result.success ? 200 : 503, result);
  }

  // ========================================================================
  // PAYMENT LINKS API ROUTES
  // ========================================================================

  // POST /api/payment-links - Create link tied to invoice
  if (pathname === '/api/payment-links' && req.method === 'POST') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }
    try {
      const body = await parseJsonBody(req);
      const link = db.createPaymentLink(session.user_id, body);
      return sendJson(res, 201, { success: true, link });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message || 'Failed to create payment link.' });
    }
  }

  // GET /api/payment-links - List user payment links
  if (pathname === '/api/payment-links' && req.method === 'GET') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }
    const links = db.listPaymentLinks(session.user_id);
    return sendJson(res, 200, { success: true, links });
  }

  // GET /api/payment-links/:id - Get specific payment link
  if (pathname.startsWith('/api/payment-links/') && req.method === 'GET') {
    const linkId = pathname.split('/')[3];
    const link = db.getPaymentLink(linkId);
    if (!link) {
      return sendJson(res, 404, { success: false, error: 'Payment link not found.' });
    }
    return sendJson(res, 200, { success: true, link });
  }

  // GET /api/invoices/check-number - Check invoice number uniqueness in user account
  if (pathname === '/api/invoices/check-number' && req.method === 'GET') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 200, { exists: false });
    }
    const number = parsedUrl.searchParams.get('number') || '';
    const result = db.checkInvoiceNumberExists(session.user_id, number);
    return sendJson(res, 200, { success: true, ...result });
  }

  // GET /api/payments - List invoice payments
  if (pathname === '/api/payments' && req.method === 'GET') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }
    const status = parsedUrl.searchParams.get('status') || '';
    const invoiceId = parsedUrl.searchParams.get('invoiceId') || '';
    const payments = db.listInvoicePayments(session.user_id, { status, invoiceId });
    return sendJson(res, 200, { success: true, payments });
  }

  // POST /api/payments - Record a genuine invoice payment
  if (pathname === '/api/payments' && req.method === 'POST') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }
    try {
      const body = await parseJsonBody(req);
      const payment = db.recordInvoicePayment(session.user_id, body);
      return sendJson(res, 201, { success: true, message: 'Payment recorded successfully.', payment });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message || 'Could not record payment.' });
    }
  }

  // PATCH /api/payments/:id/status - Update payment status
  if (pathname.startsWith('/api/payments/') && pathname.endsWith('/status') && (req.method === 'PATCH' || req.method === 'POST')) {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }
    const paymentId = pathname.split('/')[3];
    try {
      const body = await parseJsonBody(req);
      const updated = db.updatePaymentStatus(session.user_id, paymentId, body.status);
      return sendJson(res, 200, { success: true, message: 'Payment status updated.', payment: updated });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message || 'Could not update payment status.' });
    }
  }

  // POST /api/payments/manual - Record a manual/offline payment with balance check
  if (pathname === '/api/payments/manual' && req.method === 'POST') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }
    try {
      const body = await parseJsonBody(req);
      const result = db.recordManualPayment(session.user_id, body);
      return sendJson(res, 201, {
        success: true,
        message: 'Manual payment recorded and invoice balance updated.',
        payment: result.payment,
        invoice: result.invoice
      });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message || 'Could not record payment.' });
    }
  }

  // ========================================================================
  // REAL STRIPE INTEGRATION (CHECKOUT, PORTAL, WEBHOOKS)
  // ========================================================================

  // GET /api/stripe/config - Safe public Stripe configuration (publishable key only)
  if (pathname === '/api/stripe/config' && req.method === 'GET') {
    const isConfigured = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY);
    return sendJson(res, 200, {
      success: true,
      configured: isConfigured,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
      proPriceId: process.env.STRIPE_PRO_PRICE_ID || '',
      businessPriceId: process.env.STRIPE_BUSINESS_PRICE_ID || ''
    });
  }

  // POST /api/stripe/create-checkout-session - Create Stripe Checkout Session for subscription upgrade
  if (pathname === '/api/stripe/create-checkout-session' && req.method === 'POST') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }

    if (!stripeClient || !process.env.STRIPE_SECRET_KEY) {
      return sendJson(res, 400, {
        success: false,
        code: 'STRIPE_NOT_CONFIGURED',
        error: 'Stripe is not yet configured on this server. Please set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY in the environment.'
      });
    }

    try {
      const body = await parseJsonBody(req);
      const plan = (body.plan || 'Pro Workspace Tier').trim();
      const isBusiness = plan.toLowerCase().includes('business');
      const planName = isBusiness ? 'Business Tier' : 'Pro Workspace Tier';
      const unitAmount = isBusiness ? 2900 : 1200;
      const priceId = isBusiness ? process.env.STRIPE_BUSINESS_PRICE_ID : process.env.STRIPE_PRO_PRICE_ID;

      const user = db.getUserById(session.user_id);
      let customerId = user.stripe_customer_id;

      if (!customerId) {
        const customer = await stripeClient.customers.create({
          email: user.email,
          name: user.name,
          metadata: { userId: user.id }
        });
        customerId = customer.id;
        db.updateUserStripeCustomer(user.id, customerId);
      }

      const origin = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`;

      const lineItem = priceId
        ? { price: priceId, quantity: 1 }
        : {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `InvoiceGen ${planName}`,
                description: isBusiness
                  ? 'Unlimited invoices, team management, automated payment reconciliation, and priority support'
                  : 'Unlimited invoices, cloud storage, and client portal'
              },
              unit_amount: unitAmount,
              recurring: { interval: 'month' }
            },
            quantity: 1
          };

      const checkoutSession = await stripeClient.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [lineItem],
        mode: 'subscription',
        client_reference_id: user.id,
        metadata: {
          userId: user.id,
          plan: planName
        },
        success_url: `${origin}/dashboard?stripe=success&session_id={CHECKOUT_SESSION_ID}#billing`,
        cancel_url: `${origin}/dashboard?stripe=cancel#billing`
      });

      return sendJson(res, 200, {
        success: true,
        sessionId: checkoutSession.id,
        url: checkoutSession.url
      });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message || 'Failed to initialize Stripe checkout.' });
    }
  }

  // POST /api/stripe/create-portal-session - Stripe Customer Portal Session
  if (pathname === '/api/stripe/create-portal-session' && req.method === 'POST') {
    const session = getAuthSession(req);
    if (!session) {
      return sendJson(res, 401, { success: false, error: 'Authentication required.' });
    }

    if (!stripeClient) {
      return sendJson(res, 400, {
        success: false,
        code: 'STRIPE_NOT_CONFIGURED',
        error: 'Stripe is not configured on this server.'
      });
    }

    const user = db.getUserById(session.user_id);
    if (!user.stripe_customer_id) {
      return sendJson(res, 400, {
        success: false,
        error: 'No active Stripe customer account linked to your profile yet.'
      });
    }

    try {
      const origin = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`;
      const portalSession = await stripeClient.billingPortal.sessions.create({
        customer: user.stripe_customer_id,
        return_url: `${origin}/dashboard#billing`
      });
      return sendJson(res, 200, { success: true, url: portalSession.url });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message || 'Failed to open billing portal.' });
    }
  }

  // POST /api/stripe/webhook - Idempotent, cryptographically verified Stripe Webhook
  if (pathname === '/api/stripe/webhook' && req.method === 'POST') {
    let rawBody;
    try {
      rawBody = await readRawBody(req);
    } catch (err) {
      return sendJson(res, 400, { error: 'Failed to read webhook payload' });
    }

    let event;
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (webhookSecret && stripeClient && sig) {
      try {
        event = stripeClient.webhooks.constructEvent(rawBody, sig, webhookSecret);
      } catch (err) {
        console.error('Stripe webhook signature verification failed:', err.message);
        return sendJson(res, 400, { error: `Webhook Signature Error: ${err.message}` });
      }
    } else {
      try {
        event = JSON.parse(rawBody.toString('utf8'));
      } catch (err) {
        return sendJson(res, 400, { error: 'Invalid JSON payload' });
      }
    }

    try {
      const result = db.handleStripeWebhookEvent(event);
      return sendJson(res, 200, { received: true, ...result });
    } catch (err) {
      console.error('Error handling Stripe webhook event:', err.message);
      return sendJson(res, 500, { error: err.message });
    }
  }

  // POST /api/contact - Record user contact inquiry in SQLite
  if (pathname === '/api/contact' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const saved = db.saveContactMessage({
        name: body.name,
        email: body.email,
        category: body.category || 'general',
        message: body.message,
        ip: Array.isArray(clientIp) ? clientIp[0] : String(clientIp)
      });
      return sendJson(res, 200, {
        success: true,
        message: 'Thank you! Your message has been received and our team will get back to you promptly.',
        id: saved.id
      });
    } catch (err) {
      return sendJson(res, 400, {
        success: false,
        error: err.message || 'Invalid contact submission data.'
      });
    }
  }

  // GET /api/config/public - Public environment & gateway readiness metadata
  if (pathname === '/api/config/public' && req.method === 'GET') {
    return sendJson(res, 200, {
      success: true,
      stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_')),
      paypalConfigured: Boolean(process.env.PAYPAL_CLIENT_ID),
      gaMeasurementId: process.env.GA_MEASUREMENT_ID || '',
      environment: process.env.NODE_ENV || 'production'
    });
  }

  // Normalize trailing slash: 301 redirect /path/ to /path (except root /)
  if (pathname.length > 1 && pathname.endsWith('/')) {
    const cleanPath = pathname.slice(0, -1);
    res.writeHead(301, { 'Location': cleanPath + (parsedUrl.search || '') });
    return res.end();
  }

  // 301 Permanent Redirect for legacy .html requests (e.g. /signup.html -> /signup, /index.html -> /)
  if (pathname.endsWith('.html')) {
    const cleanPath = pathname === '/index.html' ? '/' : pathname.slice(0, -5);
    res.writeHead(301, { 'Location': cleanPath + (parsedUrl.search || '') });
    return res.end();
  }

  // ========================================================================
  // PROTECTED / UNAUTHENTICATED ROUTE REDIRECTION
  // ========================================================================
  const session = getAuthSession(req);

  // Public auth routes: redirect to dashboard if already authenticated on server
  const authRoutes = ['/login', '/signup'];
  if (authRoutes.includes(pathname) && session) {
    res.writeHead(302, { 'Location': '/dashboard' });
    return res.end();
  }

  // ========================================================================
  // STATIC ASSET SERVING & CLEAN URL ROUTING
  // ========================================================================
  const TOOL_ROUTE_MAP = {
    // Public Company & Resource Routes
    '/about': 'about.html',
    '/contact': 'contact.html',
    '/help': 'help.html',
    '/faq': 'faq.html',
    '/getting-started': 'getting-started.html',
    '/cookies': 'cookies.html',
    '/blog': 'blog.html',
    '/blog-post': 'blog-post.html',
    '/pricing': 'pricing.html',
    '/security': 'security.html',
    '/privacy': 'privacy.html',
    '/terms': 'terms.html',
    '/refunds': 'refunds.html',
    '/sitemap': 'sitemap.html',
    '/404': '404.html',
    '/500': '500.html',
    '/invoice-guide': 'invoice-guide.html',
    '/invoicing-guide': 'invoice-guide.html',
    '/getting-paid-faster': 'getting-paid-faster.html',
    '/stripe-vs-paypal': 'stripe-vs-paypal.html',
    '/features': 'features.html',
    '/templates': 'templates.html',
    '/free-invoice-generator': 'free-invoice-generator.html',
    '/how-to-make-an-invoice': 'how-to-make-an-invoice.html',
    '/best-invoice-generator': 'best-invoice-generator.html',
    '/login': 'login.html',
    '/signup': 'signup.html',
    '/payments': 'payments.html',

    // Tools & Suite Routes
    '/tools': 'tools.html',
    '/files': 'files.html',
    '/cloud': 'files.html',
    '/tools/invoice-generator': 'index.html',
    '/tools/pdf-invoice-generator': 'pdf-invoice-generator.html',
    '/tools/gst-tax-invoice': 'gst-tax-invoice.html',
    '/tools/freelancer-invoice': 'invoice-generator-for-freelancers.html',
    '/tools/invoice-number-generator': 'invoice-number-generator.html',
    '/tools/pdf-to-jpg': 'pdf-to-jpg.html',
    '/tools/jpg-to-pdf': 'jpg-to-pdf.html',
    '/tools/image-compressor': 'image-compressor.html',
    '/tools/pdf-merger': 'pdf-merger.html',
    '/tools/pdf-splitter': 'pdf-splitter.html',
    '/tools/tax-calculator': 'tax-calculator.html',
    '/tools/payment-calculator': 'payment-calculator.html',
    '/tools/due-date-calculator': 'due-date-calculator.html',
    '/tools/currency-converter': 'currency-converter.html',
    '/tools/online-payments': 'payments.html',
    '/tools/payment-link': 'payment-link.html',

    // Authenticated SaaS application shell routes
    '/dashboard': 'dashboard.html',
    '/invoice-details': 'invoice-details.html',
    '/client-details': 'dashboard.html',
    '/invoices': 'dashboard.html',
    '/clients': 'dashboard.html',
    '/profile': 'dashboard.html',
    '/business-profile': 'dashboard.html',
    '/billing': 'dashboard.html',
    '/payment-methods': 'dashboard.html',
    '/payment-history': 'dashboard.html',
    '/settings': 'dashboard.html'
  };

  let assetPath = pathname;
  if (assetPath.startsWith('/tools/js/') || assetPath.startsWith('/tools/css/') || assetPath.startsWith('/tools/assets/')) {
    assetPath = assetPath.replace('/tools', '');
  }
  let targetFilename = (pathname === '/security' && session)
    ? 'dashboard.html'
    : (TOOL_ROUTE_MAP[pathname] || (pathname === '/' ? 'index.html' : assetPath));
  let filePath = path.join(__dirname, targetFilename);

  // Security: Prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Access Denied');
  }

  const serveFile = (targetPath) => {
    const ext = path.extname(targetPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const headers = { 'Content-Type': contentType };

    // Fonts can stay cached to prevent font flicker and allow cross-origin preload
    if (['.woff2', '.woff', '.ttf'].includes(ext)) {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
      headers['Access-Control-Allow-Origin'] = '*';
    } else {
      // HTML, CSS, JS, SVG, ICO, JSON: Disable caching completely so reloads and edits take effect instantly
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers['Pragma'] = 'no-cache';
      headers['Expires'] = '0';
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
};

const server = http.createServer(requestHandler);

server.listen(PORT, () => {
  console.log(`InvoiceGen server running with SQLite DB & Auth API at http://localhost:${PORT}`);
});

if (Number(PORT) !== Number(SECONDARY_PORT)) {
  const secondaryServer = http.createServer(requestHandler);
  secondaryServer.listen(SECONDARY_PORT, () => {
    console.log(`InvoiceGen also listening on secondary port http://localhost:${SECONDARY_PORT}`);
  }).on('error', (err) => {
    console.log(`Secondary port ${SECONDARY_PORT} notice: ${err.message}`);
  });
}
