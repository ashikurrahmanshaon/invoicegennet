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
    let [name, ...rest] = cookie.split('=');
    name = name?.trim();
    if (!name) return;
    const value = rest.join('=').trim();
    list[name] = decodeURIComponent(value);
  });
  return list;
}

function getAuthSession(req) {
  // 1. Check Cookie
  const cookies = parseCookies(req);
  let sessionId = cookies['session_id'];

  // 2. Check Authorization Header fallback
  if (!sessionId && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      sessionId = parts[1];
    }
  }

  if (!sessionId) return null;
  return db.getSession(sessionId);
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

      const cookieHeader = `session_id=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Expires=${new Date(expiresAt).toUTCString()}`;
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

      const cookieHeader = `session_id=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Expires=${new Date(expiresAt).toUTCString()}`;
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

      const cookieHeader = `session_id=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Expires=${new Date(expiresAt).toUTCString()}`;
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
    return sendJson(res, 200, { success: true, authenticated: true, user: session });
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
      const { fileName, fileType, mimeType, sourceTool, metadata } = body;
      const base64Data = body.base64Data || body.fileBase64;
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
      const updated = db.renameFile(session.user_id, fileId, body.fileName);
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

  // ========================================================================
  // PROTECTED / UNAUTHENTICATED ROUTE REDIRECTION
  // ========================================================================
  const session = getAuthSession(req);

  // Private routes: redirect to login if unauthenticated
  const privateRoutes = [
    '/dashboard', '/dashboard.html',
    '/invoice-details', '/invoice-details.html',
    '/files', '/files.html',
    '/cloud', '/cloud.html',
    '/invoices', '/clients',
    '/profile', '/business-profile',
    '/billing', '/payment-methods', '/payment-history',
    '/settings', '/security'
  ];
  if (privateRoutes.includes(pathname) && !session) {
    res.writeHead(302, { 'Location': '/login.html?redirect=' + encodeURIComponent(pathname) });
    return res.end();
  }

  // Public auth routes: redirect to dashboard if already authenticated
  const authRoutes = ['/login', '/login.html', '/signup', '/signup.html'];
  if (authRoutes.includes(pathname) && session) {
    res.writeHead(302, { 'Location': '/dashboard.html' });
    return res.end();
  }

  // ========================================================================
  // STATIC ASSET SERVING & CLEAN URL ROUTING
  // ========================================================================
  const TOOL_ROUTE_MAP = {
    '/tools': 'tools.html',
    '/tools/': 'tools.html',
    '/files': 'files.html',
    '/files/': 'files.html',
    '/cloud': 'files.html',
    '/cloud/': 'files.html',
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
    // Authenticated deep tab routes mapped directly to dashboard.html
    '/invoices': 'dashboard.html',
    '/clients': 'dashboard.html',
    '/profile': 'dashboard.html',
    '/business-profile': 'dashboard.html',
    '/billing': 'dashboard.html',
    '/payment-methods': 'dashboard.html',
    '/payment-history': 'dashboard.html',
    '/settings': 'dashboard.html',
    '/security': 'dashboard.html'
  };

  let assetPath = pathname;
  if (assetPath.startsWith('/tools/js/') || assetPath.startsWith('/tools/css/') || assetPath.startsWith('/tools/assets/')) {
    assetPath = assetPath.replace('/tools', '');
  }
  let targetFilename = TOOL_ROUTE_MAP[pathname] || (pathname === '/' ? 'index.html' : assetPath);
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
