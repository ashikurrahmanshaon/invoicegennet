/* ==========================================================================
   INVOICE-GEN.NET - PERSISTENT SQLITE DATABASE & AUTH REPOSITORY
   Native node:sqlite relational database storage with scoped user isolation
   ========================================================================== */

const { DatabaseSync } = require('node:sqlite');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'invoicegen.db');
const db = new DatabaseSync(DB_PATH);

// Enable WAL mode & foreign keys for high concurrency & integrity
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    business_name TEXT DEFAULT '',
    business_email TEXT DEFAULT '',
    business_phone TEXT DEFAULT '',
    business_tax_id TEXT DEFAULT '',
    business_address TEXT DEFAULT '',
    default_currency TEXT DEFAULT 'USD',
    default_payment_terms TEXT DEFAULT 'Due on Receipt',
    default_notes TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    invoice_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    issue_date TEXT DEFAULT '',
    due_date TEXT DEFAULT '',
    currency TEXT DEFAULT 'USD',
    currency_symbol TEXT DEFAULT '$',
    po_number TEXT DEFAULT '',
    payment_terms TEXT DEFAULT 'Due on Receipt',
    sender_name TEXT DEFAULT '',
    sender_address TEXT DEFAULT '',
    sender_email TEXT DEFAULT '',
    sender_phone TEXT DEFAULT '',
    client_name TEXT DEFAULT '',
    client_address TEXT DEFAULT '',
    client_email TEXT DEFAULT '',
    client_phone TEXT DEFAULT '',
    ship_to_enabled INTEGER DEFAULT 0,
    ship_to_name TEXT DEFAULT '',
    ship_to_address TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    subtotal REAL DEFAULT 0,
    tax_rate REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    discount_type TEXT DEFAULT 'percent',
    discount_value REAL DEFAULT 0,
    discount_amount REAL DEFAULT 0,
    shipping_fee REAL DEFAULT 0,
    amount_paid REAL DEFAULT 0,
    total REAL DEFAULT 0,
    balance_due REAL DEFAULT 0,
    template TEXT DEFAULT 'emerald',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS invoice_items (
    id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL,
    item_order INTEGER DEFAULT 0,
    description TEXT DEFAULT '',
    subtext TEXT DEFAULT '',
    quantity REAL DEFAULT 1,
    rate REAL DEFAULT 0,
    amount REAL DEFAULT 0,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    company TEXT DEFAULT '',
    email TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    billing_address TEXT DEFAULT '',
    shipping_address TEXT DEFAULT '',
    currency TEXT DEFAULT 'USD',
    notes TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    entity_type TEXT DEFAULT '',
    entity_id TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    link TEXT DEFAULT '',
    is_read INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS payment_methods (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    brand TEXT NOT NULL,
    last4 TEXT NOT NULL,
    exp_month TEXT NOT NULL,
    exp_year TEXT NOT NULL,
    token_id TEXT NOT NULL,
    is_default INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS billing_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_method TEXT DEFAULT 'Card',
    status TEXT DEFAULT 'paid',
    receipt_id TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    storage_key TEXT NOT NULL,
    source_tool TEXT DEFAULT '',
    metadata TEXT DEFAULT '{}',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS tool_usage (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    tool_id TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    action TEXT NOT NULL,
    metadata TEXT DEFAULT '{}',
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS payment_links (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    invoice_id TEXT DEFAULT '',
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    description TEXT DEFAULT '',
    status TEXT DEFAULT 'active',
    expires_at TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS invoice_payments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    invoice_id TEXT DEFAULT '',
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    gateway TEXT DEFAULT 'Stripe',
    status TEXT DEFAULT 'Paid',
    reference TEXT DEFAULT '',
    payer_name TEXT DEFAULT '',
    payer_email TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id);
  CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
  CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
  CREATE INDEX IF NOT EXISTS idx_clients_user ON clients(user_id);
  CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON payment_methods(user_id);
  CREATE INDEX IF NOT EXISTS idx_billing_tx_user ON billing_transactions(user_id);
  CREATE INDEX IF NOT EXISTS idx_files_user ON files(user_id);
  CREATE INDEX IF NOT EXISTS idx_files_type ON files(file_type);
  CREATE INDEX IF NOT EXISTS idx_tool_usage_user ON tool_usage(user_id);
  CREATE INDEX IF NOT EXISTS idx_payment_links_user ON payment_links(user_id);
  CREATE INDEX IF NOT EXISTS idx_invoice_payments_user ON invoice_payments(user_id);
  CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice ON invoice_payments(invoice_id);
`);

// Safe column migrations for users table
const userMigrations = [
  "ALTER TABLE users ADD COLUMN phone TEXT DEFAULT ''",
  "ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT ''",
  "ALTER TABLE users ADD COLUMN business_website TEXT DEFAULT ''",
  "ALTER TABLE users ADD COLUMN business_city TEXT DEFAULT ''",
  "ALTER TABLE users ADD COLUMN business_state TEXT DEFAULT ''",
  "ALTER TABLE users ADD COLUMN business_postal_code TEXT DEFAULT ''",
  "ALTER TABLE users ADD COLUMN business_country TEXT DEFAULT ''",
  "ALTER TABLE users ADD COLUMN default_tax_rate REAL DEFAULT 0",
  "ALTER TABLE users ADD COLUMN plan TEXT DEFAULT 'Free Forever Tier'",
  "ALTER TABLE users ADD COLUMN billing_cycle TEXT DEFAULT 'Monthly'"
];
for (const sql of userMigrations) {
  try { db.exec(sql); } catch (e) {}
}

// Safe column migrations for clients table
const clientMigrations = [
  "ALTER TABLE clients ADD COLUMN currency TEXT DEFAULT 'USD'",
  "ALTER TABLE clients ADD COLUMN shipping_address TEXT DEFAULT ''",
  "ALTER TABLE clients ADD COLUMN notes TEXT DEFAULT ''",
  "ALTER TABLE clients ADD COLUMN company TEXT DEFAULT ''",
  "ALTER TABLE clients ADD COLUMN phone TEXT DEFAULT ''",
  "ALTER TABLE clients ADD COLUMN billing_address TEXT DEFAULT ''"
];
for (const sql of clientMigrations) {
  try { db.exec(sql); } catch (e) {}
}

// --------------------------------------------------------------------------
// PASSWORD & AUTH UTILITIES
// --------------------------------------------------------------------------

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function createUser({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  const userId = `usr_${crypto.randomBytes(8).toString('hex')}`;
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO users (
      id, name, email, password_hash, salt, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(userId, name.trim(), normalizedEmail, passwordHash, salt, now, now);
  return getUserById(userId);
}

function verifyUser(email, password) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
  if (!user) return null;

  const expectedHash = hashPassword(password, user.salt);
  if (crypto.timingSafeEqual(Buffer.from(expectedHash, 'hex'), Buffer.from(user.password_hash, 'hex'))) {
    return getUserById(user.id);
  }
  return null;
}

function createSession(userId, rememberDays = 30) {
  const sessionId = `ses_${crypto.randomBytes(24).toString('hex')}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + rememberDays * 24 * 60 * 60 * 1000);

  const stmt = db.prepare(`
    INSERT INTO sessions (id, user_id, created_at, expires_at)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(sessionId, userId, now.toISOString(), expiresAt.toISOString());

  return { sessionId, expiresAt: expiresAt.toISOString() };
}

function getSession(sessionId) {
  if (!sessionId) return null;
  const stmt = db.prepare(`
    SELECT s.id as session_id, s.user_id, s.expires_at, u.*
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ?
  `);
  const session = stmt.get(sessionId);
  if (!session) return null;

  if (new Date(session.expires_at) < new Date()) {
    deleteSession(sessionId);
    return null;
  }

  // Guarantee user_id is explicitly present
  session.user_id = session.user_id || session.id;

  // Clean sensitive fields
  delete session.password_hash;
  delete session.salt;
  return session;
}

function deleteSession(sessionId) {
  if (!sessionId) return;
  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
}

function getUserById(userId) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return null;
  delete user.password_hash;
  delete user.salt;
  return user;
}

function updateUserProfile(userId, profile) {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    UPDATE users SET
      name = COALESCE(?, name),
      phone = COALESCE(?, phone),
      avatar = COALESCE(?, avatar),
      business_name = COALESCE(?, business_name),
      business_email = COALESCE(?, business_email),
      business_phone = COALESCE(?, business_phone),
      business_tax_id = COALESCE(?, business_tax_id),
      business_address = COALESCE(?, business_address),
      business_website = COALESCE(?, business_website),
      business_city = COALESCE(?, business_city),
      business_state = COALESCE(?, business_state),
      business_postal_code = COALESCE(?, business_postal_code),
      business_country = COALESCE(?, business_country),
      default_currency = COALESCE(?, default_currency),
      default_payment_terms = COALESCE(?, default_payment_terms),
      default_notes = COALESCE(?, default_notes),
      default_tax_rate = COALESCE(?, default_tax_rate),
      plan = COALESCE(?, plan),
      billing_cycle = COALESCE(?, billing_cycle),
      updated_at = ?
    WHERE id = ?
  `);

  stmt.run(
    profile.name !== undefined ? profile.name : null,
    profile.phone !== undefined ? profile.phone : null,
    profile.avatar !== undefined ? profile.avatar : null,
    profile.business_name !== undefined ? profile.business_name : null,
    profile.business_email !== undefined ? profile.business_email : null,
    profile.business_phone !== undefined ? profile.business_phone : null,
    profile.business_tax_id !== undefined ? profile.business_tax_id : null,
    profile.business_address !== undefined ? profile.business_address : null,
    profile.business_website !== undefined ? profile.business_website : null,
    profile.business_city !== undefined ? profile.business_city : null,
    profile.business_state !== undefined ? profile.business_state : null,
    profile.business_postal_code !== undefined ? profile.business_postal_code : null,
    profile.business_country !== undefined ? profile.business_country : null,
    profile.default_currency !== undefined ? profile.default_currency : null,
    profile.default_payment_terms !== undefined ? profile.default_payment_terms : null,
    profile.default_notes !== undefined ? profile.default_notes : null,
    profile.default_tax_rate !== undefined ? Number(profile.default_tax_rate) : null,
    profile.plan !== undefined ? profile.plan : null,
    profile.billing_cycle !== undefined ? profile.billing_cycle : null,
    now,
    userId
  );

  try {
    logActivity(userId, {
      type: 'profile_updated',
      description: 'Updated profile and invoice settings',
      entityType: 'profile',
      entityId: userId
    });
  } catch (e) {}

  return getUserById(userId);
}

function changePassword(userId, currentPassword, newPassword) {
  if (!currentPassword || !newPassword) {
    throw new Error('Current password and new password are required.');
  }
  if (newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters long.');
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) {
    throw new Error('User not found.');
  }

  const currentHash = hashPassword(currentPassword, user.salt);
  if (!crypto.timingSafeEqual(Buffer.from(currentHash, 'hex'), Buffer.from(user.password_hash, 'hex'))) {
    throw new Error('Current password is incorrect.');
  }

  const newSalt = crypto.randomBytes(16).toString('hex');
  const newHash = hashPassword(newPassword, newSalt);
  const now = new Date().toISOString();

  db.prepare('UPDATE users SET password_hash = ?, salt = ?, updated_at = ? WHERE id = ?').run(
    newHash,
    newSalt,
    now,
    userId
  );

  try {
    logActivity(userId, {
      type: 'password_changed',
      description: 'Account password was successfully changed',
      entityType: 'security',
      entityId: userId
    });
    createNotification(userId, {
      title: 'Security Notice',
      message: 'Your account password was updated successfully.',
      type: 'info',
      link: '#settings'
    });
  } catch (e) {}

  return true;
}

// --------------------------------------------------------------------------
// INVOICE NUMBERING & CRUD UTILITIES
// --------------------------------------------------------------------------

function getNextInvoiceNumber(userId) {
  const rows = db.prepare('SELECT invoice_number FROM invoices WHERE user_id = ?').all(userId);
  let maxNum = 0;
  for (const row of rows) {
    const str = String(row.invoice_number || '');
    const match = str.match(/(\d+)/);
    if (match) {
      const val = parseInt(match[1], 10);
      if (val > maxNum) maxNum = val;
    }
  }
  const nextVal = maxNum + 1;
  const formatted = String(nextVal).padStart(3, '0');
  return `INV-${formatted}`;
}

function createInvoice(userId, data) {
  const invoiceId = data.id && String(data.id).startsWith('inv_') ? data.id : `inv_${crypto.randomBytes(8).toString('hex')}`;
  const now = new Date().toISOString();

  let invoiceNumber = data.number || data.invoice_number;
  if (!invoiceNumber || invoiceNumber === '001') {
    invoiceNumber = getNextInvoiceNumber(userId);
  }

  const stmt = db.prepare(`
    INSERT INTO invoices (
      id, user_id, invoice_number, status, issue_date, due_date,
      currency, currency_symbol, po_number, payment_terms,
      sender_name, sender_address, sender_email, sender_phone,
      client_name, client_address, client_email, client_phone,
      ship_to_enabled, ship_to_name, ship_to_address, notes,
      subtotal, tax_rate, tax_amount, discount_type, discount_value,
      discount_amount, shipping_fee, amount_paid, total, balance_due,
      template, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?
    )
  `);

  stmt.run(
    invoiceId,
    userId,
    invoiceNumber,
    data.status || 'draft',
    data.date || data.issue_date || '',
    data.dueDate || data.due_date || '',
    data.currency || 'USD',
    data.currencySymbol || data.currency_symbol || '$',
    data.poNumber || data.po_number || '',
    data.paymentTerms || data.payment_terms || 'Due on Receipt',
    data.sender?.name || data.sender_name || data.senderName || '',
    data.sender?.address || data.sender_address || data.senderAddress || '',
    data.sender?.email || data.sender_email || data.senderEmail || '',
    data.sender?.phone || data.sender_phone || data.senderPhone || '',
    data.client?.name || data.client_name || data.clientName || '',
    data.client?.address || data.client_address || data.clientAddress || '',
    data.client?.email || data.client_email || data.clientEmail || '',
    data.client?.phone || data.client_phone || data.clientPhone || '',
    data.shipTo?.enabled ? 1 : 0,
    data.shipTo?.name || data.ship_to_name || data.shipToName || '',
    data.shipTo?.address || data.ship_to_address || data.shipToAddress || '',
    data.notes || '',
    Number(data.subtotal || data.totals?.subtotal || 0),
    Number(data.taxRate || data.tax_rate || 0),
    Number(data.taxAmount || data.totals?.taxAmount || 0),
    data.discountType || data.discount_type || 'percent',
    Number(data.discountValue || data.discount_value || 0),
    Number(data.discountAmount || data.totals?.discountAmount || 0),
    Number(data.shippingFee || data.shipping_fee || 0),
    Number(data.amountPaid || data.amount_paid || 0),
    Number(data.total || data.totals?.grandTotal || 0),
    Number(data.balanceDue || data.totals?.balanceDue || 0),
    data.template || 'emerald',
    now,
    now
  );

  // Insert items
  const items = Array.isArray(data.items) ? data.items : [];
  const insertItem = db.prepare(`
    INSERT INTO invoice_items (
      id, invoice_id, item_order, description, subtext, quantity, rate, amount
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  items.forEach((item, index) => {
    const itemId = `itm_${crypto.randomBytes(6).toString('hex')}`;
    const qty = Number(item.quantity || 1);
    const rate = Number(item.rate || 0);
    const amount = Number(item.amount !== undefined ? item.amount : qty * rate);
    insertItem.run(
      itemId,
      invoiceId,
      index,
      item.description || '',
      item.subtext || '',
      qty,
      rate,
      amount
    );
  });

  try {
    logActivity(userId, {
      type: 'invoice_created',
      description: `Created invoice #${invoiceNumber} for ${data.client?.name || data.client_name || data.clientName || 'Client'}`,
      entityType: 'invoice',
      entityId: invoiceId
    });
    createNotification(userId, {
      title: 'Invoice Created',
      message: `Invoice #${invoiceNumber} has been saved successfully.`,
      type: 'info',
      link: 'dashboard.html#invoices'
    });
  } catch (e) {}

  return getInvoice(userId, invoiceId);
}

function updateInvoice(userId, invoiceId, data) {
  // Security: Confirm ownership
  const existing = db.prepare('SELECT id FROM invoices WHERE id = ? AND user_id = ?').get(invoiceId, userId);
  if (!existing) {
    throw new Error('Invoice not found or access denied.');
  }

  const now = new Date().toISOString();
  const invoiceNumber = data.number || data.invoice_number;

  const stmt = db.prepare(`
    UPDATE invoices SET
      invoice_number = COALESCE(?, invoice_number),
      status = COALESCE(?, status),
      issue_date = COALESCE(?, issue_date),
      due_date = COALESCE(?, due_date),
      currency = COALESCE(?, currency),
      currency_symbol = COALESCE(?, currency_symbol),
      po_number = COALESCE(?, po_number),
      payment_terms = COALESCE(?, payment_terms),
      sender_name = COALESCE(?, sender_name),
      sender_address = COALESCE(?, sender_address),
      sender_email = COALESCE(?, sender_email),
      sender_phone = COALESCE(?, sender_phone),
      client_name = COALESCE(?, client_name),
      client_address = COALESCE(?, client_address),
      client_email = COALESCE(?, client_email),
      client_phone = COALESCE(?, client_phone),
      ship_to_enabled = COALESCE(?, ship_to_enabled),
      ship_to_name = COALESCE(?, ship_to_name),
      ship_to_address = COALESCE(?, ship_to_address),
      notes = COALESCE(?, notes),
      subtotal = COALESCE(?, subtotal),
      tax_rate = COALESCE(?, tax_rate),
      tax_amount = COALESCE(?, tax_amount),
      discount_type = COALESCE(?, discount_type),
      discount_value = COALESCE(?, discount_value),
      discount_amount = COALESCE(?, discount_amount),
      shipping_fee = COALESCE(?, shipping_fee),
      amount_paid = COALESCE(?, amount_paid),
      total = COALESCE(?, total),
      balance_due = COALESCE(?, balance_due),
      template = COALESCE(?, template),
      updated_at = ?
    WHERE id = ? AND user_id = ?
  `);

  stmt.run(
    invoiceNumber || null,
    data.status || null,
    data.date || data.issue_date || null,
    data.dueDate || data.due_date || null,
    data.currency || null,
    data.currencySymbol || data.currency_symbol || null,
    data.poNumber || data.po_number || null,
    data.paymentTerms || data.payment_terms || null,
    data.sender?.name || data.sender_name || null,
    data.sender?.address || data.sender_address || null,
    data.sender?.email || data.sender_email || null,
    data.sender?.phone || data.sender_phone || null,
    data.client?.name || data.client_name || null,
    data.client?.address || data.client_address || null,
    data.client?.email || data.client_email || null,
    data.client?.phone || data.client_phone || null,
    data.shipTo?.enabled !== undefined ? (data.shipTo.enabled ? 1 : 0) : null,
    data.shipTo?.name || data.ship_to_name || null,
    data.shipTo?.address || data.ship_to_address || null,
    data.notes !== undefined ? data.notes : null,
    data.subtotal !== undefined ? Number(data.subtotal) : (data.totals?.subtotal !== undefined ? Number(data.totals.subtotal) : null),
    data.taxRate !== undefined ? Number(data.taxRate) : (data.tax_rate !== undefined ? Number(data.tax_rate) : null),
    data.taxAmount !== undefined ? Number(data.taxAmount) : (data.totals?.taxAmount !== undefined ? Number(data.totals.taxAmount) : null),
    data.discountType || data.discount_type || null,
    data.discountValue !== undefined ? Number(data.discountValue) : (data.discount_value !== undefined ? Number(data.discount_value) : null),
    data.discountAmount !== undefined ? Number(data.discountAmount) : (data.totals?.discountAmount !== undefined ? Number(data.totals.discountAmount) : null),
    data.shippingFee !== undefined ? Number(data.shippingFee) : (data.shipping_fee !== undefined ? Number(data.shipping_fee) : null),
    data.amountPaid !== undefined ? Number(data.amountPaid) : (data.amount_paid !== undefined ? Number(data.amount_paid) : null),
    data.total !== undefined ? Number(data.total) : (data.totals?.grandTotal !== undefined ? Number(data.totals.grandTotal) : null),
    data.balanceDue !== undefined ? Number(data.balanceDue) : (data.totals?.balanceDue !== undefined ? Number(data.totals.balanceDue) : null),
    data.template || null,
    now,
    invoiceId,
    userId
  );

  // If items array was provided, replace all items cleanly
  if (Array.isArray(data.items)) {
    db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(invoiceId);
    const insertItem = db.prepare(`
      INSERT INTO invoice_items (
        id, invoice_id, item_order, description, subtext, quantity, rate, amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    data.items.forEach((item, index) => {
      const itemId = `itm_${crypto.randomBytes(6).toString('hex')}`;
      const qty = Number(item.quantity || 1);
      const rate = Number(item.rate || 0);
      const amount = Number(item.amount !== undefined ? item.amount : qty * rate);
      insertItem.run(
        itemId,
        invoiceId,
        index,
        item.description || '',
        item.subtext || '',
        qty,
        rate,
        amount
      );
    });
  }

  try {
    logActivity(userId, {
      type: 'invoice_updated',
      description: `Updated invoice #${invoiceNumber || existing.invoice_number}`,
      entityType: 'invoice',
      entityId: invoiceId
    });
  } catch (e) {}

  return getInvoice(userId, invoiceId);
}

function getInvoice(userId, invoiceId) {
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ? AND user_id = ?').get(invoiceId, userId);
  if (!invoice) return null;

  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY item_order ASC').all(invoiceId);
  return {
    ...invoice,
    number: invoice.invoice_number,
    date: invoice.issue_date,
    dueDate: invoice.due_date,
    poNumber: invoice.po_number,
    paymentTerms: invoice.payment_terms,
    clientName: invoice.client_name,
    clientEmail: invoice.client_email,
    senderName: invoice.sender_name,
    senderEmail: invoice.sender_email,
    sender: {
      name: invoice.sender_name,
      address: invoice.sender_address,
      email: invoice.sender_email,
      phone: invoice.sender_phone
    },
    client: {
      name: invoice.client_name,
      address: invoice.client_address,
      email: invoice.client_email,
      phone: invoice.client_phone
    },
    shipTo: {
      enabled: Boolean(invoice.ship_to_enabled),
      name: invoice.ship_to_name,
      address: invoice.ship_to_address
    },
    totals: {
      subtotal: invoice.subtotal,
      taxAmount: invoice.tax_amount,
      discountAmount: invoice.discount_amount,
      shippingFee: invoice.shipping_fee,
      amountPaid: invoice.amount_paid,
      grandTotal: invoice.total,
      balanceDue: invoice.balance_due
    },
    items: items.map(it => ({
      id: it.id,
      description: it.description,
      subtext: it.subtext,
      quantity: it.quantity,
      rate: it.rate,
      amount: it.amount
    }))
  };
}

function deleteInvoice(userId, invoiceId) {
  const existing = db.prepare('SELECT id, invoice_number FROM invoices WHERE id = ? AND user_id = ?').get(invoiceId, userId);
  if (!existing) {
    throw new Error('Invoice not found or access denied.');
  }
  db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(invoiceId);
  db.prepare('DELETE FROM invoices WHERE id = ? AND user_id = ?').run(invoiceId, userId);
  try {
    logActivity(userId, {
      type: 'invoice_deleted',
      description: `Deleted invoice #${existing.invoice_number}`,
      entityType: 'invoice',
      entityId: invoiceId
    });
    createNotification(userId, {
      title: 'Invoice Deleted',
      message: `Invoice #${existing.invoice_number} was permanently deleted.`,
      type: 'info',
      link: 'dashboard.html#invoices'
    });
  } catch (e) {}
  return true;
}

function updateInvoiceStatus(userId, invoiceId, status) {
  const allowed = ['draft', 'sent', 'paid', 'pending', 'overdue'];
  if (!allowed.includes(status)) {
    throw new Error('Invalid invoice status.');
  }
  const now = new Date().toISOString();
  const res = db.prepare('UPDATE invoices SET status = ?, updated_at = ? WHERE id = ? AND user_id = ?').run(status, now, invoiceId, userId);
  if (res.changes === 0) {
    throw new Error('Invoice not found or access denied.');
  }
  const inv = getInvoice(userId, invoiceId);
  try {
    logActivity(userId, {
      type: 'invoice_status_updated',
      description: `Marked invoice #${inv.number} as ${status.toUpperCase()}`,
      entityType: 'invoice',
      entityId: invoiceId
    });
    if (status === 'paid') {
      createNotification(userId, {
        title: 'Payment Recorded',
        message: `Invoice #${inv.number} has been marked as Paid!`,
        type: 'success',
        link: 'dashboard.html#invoices'
      });
    }
  } catch (e) {}
  return inv;
}

function duplicateInvoice(userId, invoiceId) {
  const original = getInvoice(userId, invoiceId);
  if (!original) {
    throw new Error('Invoice not found or access denied.');
  }
  const nextNum = getNextInvoiceNumber(userId);
  const cloneData = {
    ...original,
    id: `inv_${crypto.randomBytes(8).toString('hex')}`,
    number: nextNum,
    status: 'draft',
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  };
  const created = createInvoice(userId, cloneData);
  try {
    logActivity(userId, {
      type: 'invoice_duplicated',
      description: `Duplicated invoice #${original.number} to #${nextNum}`,
      entityType: 'invoice',
      entityId: created.id
    });
  } catch (e) {}
  return created;
}

function listInvoices(userId, { search = '', status = 'all', sort = 'date_desc' } = {}) {
  let query = 'SELECT * FROM invoices WHERE user_id = ?';
  const params = [userId];

  if (status && status !== 'all') {
    query += ' AND status = ?';
    params.push(status);
  }

  if (search && search.trim()) {
    query += ' AND (invoice_number LIKE ? OR client_name LIKE ? OR client_email LIKE ? OR sender_name LIKE ?)';
    const term = `%${search.trim()}%`;
    params.push(term, term, term, term);
  }

  if (sort === 'date_asc') {
    query += ' ORDER BY created_at ASC';
  } else if (sort === 'amount_desc') {
    query += ' ORDER BY total DESC';
  } else if (sort === 'amount_asc') {
    query += ' ORDER BY total ASC';
  } else {
    query += ' ORDER BY created_at DESC';
  }

  const rows = db.prepare(query).all(...params);
  return rows.map(inv => ({
    id: inv.id,
    number: inv.invoice_number,
    status: inv.status,
    clientName: inv.client_name || 'Unnamed Client',
    clientEmail: inv.client_email || '',
    senderName: inv.sender_name || 'Your Business',
    date: inv.issue_date || '',
    dueDate: inv.due_date || '',
    currency: inv.currency || 'USD',
    currencySymbol: inv.currency_symbol || '$',
    total: inv.total || 0,
    balanceDue: inv.balance_due || 0,
    createdAt: inv.created_at,
    updatedAt: inv.updated_at
  }));
}

function getInvoiceStats(userId) {
  const rows = db.prepare('SELECT status, total, balance_due FROM invoices WHERE user_id = ?').all(userId);
  let totalInvoices = rows.length;
  let totalBilled = 0;
  let paidCount = 0;
  let paidAmount = 0;
  let pendingCount = 0;
  let pendingAmount = 0;
  let overdueCount = 0;
  let overdueAmount = 0;
  let draftCount = 0;

  for (const r of rows) {
    const tot = Number(r.total || 0);
    const bal = Number(r.balance_due || 0);
    totalBilled += tot;

    if (r.status === 'paid') {
      paidCount++;
      paidAmount += tot;
    } else if (r.status === 'pending') {
      pendingCount++;
      pendingAmount += bal > 0 ? bal : tot;
    } else if (r.status === 'overdue') {
      overdueCount++;
      overdueAmount += bal > 0 ? bal : tot;
    } else if (r.status === 'draft') {
      draftCount++;
    } else if (r.status === 'sent') {
      pendingCount++;
      pendingAmount += bal > 0 ? bal : tot;
    }
  }

  return {
    totalInvoices,
    totalBilled,
    paidCount,
    paidAmount,
    pendingCount,
    pendingAmount,
    overdueCount,
    overdueAmount,
    draftCount
  };
}

function findOrCreateGoogleUser({ name, email, avatar }) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error('Email is required for Google authentication.');
  }

  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
  const now = new Date().toISOString();

  if (!user) {
    const userId = `usr_${crypto.randomBytes(8).toString('hex')}`;
    const salt = crypto.randomBytes(16).toString('hex');
    const dummyHash = hashPassword(crypto.randomBytes(32).toString('hex'), salt);
    const stmt = db.prepare(`
      INSERT INTO users (id, name, email, password_hash, salt, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(userId, (name || 'Google User').trim(), normalizedEmail, dummyHash, salt, now, now);
    user = getUserById(userId);
  } else {
    delete user.password_hash;
    delete user.salt;
  }

  if (avatar) {
    user.avatar = avatar;
  }
  return user;
}

// --------------------------------------------------------------------------
// CLIENTS CRUD
// --------------------------------------------------------------------------

function createClient(userId, data) {
  if (!data.name || !data.name.trim()) {
    throw new Error('Client name is required.');
  }
  const id = `cli_${crypto.randomBytes(8).toString('hex')}`;
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO clients (
      id, user_id, name, company, email, phone,
      billing_address, shipping_address, currency, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    userId,
    data.name.trim(),
    (data.company || '').trim(),
    (data.email || '').trim(),
    (data.phone || '').trim(),
    (data.billing_address || data.address || '').trim(),
    (data.shipping_address || '').trim(),
    data.currency || 'USD',
    (data.notes || '').trim(),
    now,
    now
  );

  try {
    logActivity(userId, {
      type: 'client_created',
      description: `Added client "${data.name.trim()}"`,
      entityType: 'client',
      entityId: id
    });
    createNotification(userId, {
      title: 'Client Added',
      message: `Client "${data.name.trim()}" was successfully added to your directory.`,
      type: 'success',
      link: '#clients'
    });
  } catch (e) {}

  return getClient(userId, id);
}

function updateClient(userId, clientId, data) {
  const existing = db.prepare('SELECT id FROM clients WHERE id = ? AND user_id = ?').get(clientId, userId);
  if (!existing) {
    throw new Error('Client not found or access denied.');
  }

  const now = new Date().toISOString();
  const stmt = db.prepare(`
    UPDATE clients SET
      name = COALESCE(?, name),
      company = COALESCE(?, company),
      email = COALESCE(?, email),
      phone = COALESCE(?, phone),
      billing_address = COALESCE(?, billing_address),
      shipping_address = COALESCE(?, shipping_address),
      currency = COALESCE(?, currency),
      notes = COALESCE(?, notes),
      updated_at = ?
    WHERE id = ? AND user_id = ?
  `);

  stmt.run(
    data.name !== undefined ? data.name.trim() : null,
    data.company !== undefined ? data.company.trim() : null,
    data.email !== undefined ? data.email.trim() : null,
    data.phone !== undefined ? data.phone.trim() : null,
    data.billing_address !== undefined ? data.billing_address.trim() : null,
    data.shipping_address !== undefined ? data.shipping_address.trim() : null,
    data.currency !== undefined ? data.currency : null,
    data.notes !== undefined ? data.notes.trim() : null,
    now,
    clientId,
    userId
  );

  try {
    logActivity(userId, {
      type: 'client_updated',
      description: `Updated client "${data.name || 'Client'}" details`,
      entityType: 'client',
      entityId: clientId
    });
  } catch (e) {}

  return getClient(userId, clientId);
}

function getClient(userId, clientId) {
  const client = db.prepare('SELECT * FROM clients WHERE id = ? AND user_id = ?').get(clientId, userId);
  if (!client) return null;

  const invoices = db.prepare(`
    SELECT * FROM invoices
    WHERE user_id = ? AND (
      (client_name = ? AND client_name != '') OR
      (client_name = ? AND client_name != '') OR
      (client_email = ? AND client_email != '')
    )
    ORDER BY created_at DESC
  `).all(userId, client.name, client.company || client.name, client.email);

  let totalBilled = 0;
  let amountPaid = 0;
  let outstandingBalance = 0;

  for (const inv of invoices) {
    totalBilled += Number(inv.total || 0);
    amountPaid += Number(inv.amount_paid || 0);
    if (['pending', 'sent', 'overdue'].includes(inv.status)) {
      outstandingBalance += Number(inv.balance_due > 0 ? inv.balance_due : inv.total || 0);
    }
  }

  return {
    ...client,
    totalInvoiced: totalBilled,
    amountPaid,
    outstanding: outstandingBalance,
    stats: {
      invoicesCount: invoices.length,
      totalBilled,
      amountPaid,
      outstandingBalance
    },
    invoices: invoices.map(i => ({
      id: i.id,
      number: i.invoice_number,
      date: i.issue_date,
      dueDate: i.due_date,
      total: i.total,
      balanceDue: i.balance_due,
      status: i.status
    }))
  };
}

function deleteClient(userId, clientId) {
  const client = db.prepare('SELECT name FROM clients WHERE id = ? AND user_id = ?').get(clientId, userId);
  if (!client) {
    throw new Error('Client not found or access denied.');
  }
  db.prepare('DELETE FROM clients WHERE id = ? AND user_id = ?').run(clientId, userId);

  try {
    logActivity(userId, {
      type: 'client_deleted',
      description: `Deleted client "${client.name}"`,
      entityType: 'client',
      entityId: clientId
    });
  } catch (e) {}

  return true;
}

function listClients(userId, { search = '', sort = 'name_asc' } = {}) {
  let query = `
    SELECT c.*,
      (SELECT COUNT(i.id) FROM invoices i WHERE i.user_id = c.user_id AND ((i.client_name = c.name AND c.name != '') OR (i.client_email = c.email AND c.email != ''))) as invoices_count,
      (SELECT COALESCE(SUM(i.total), 0) FROM invoices i WHERE i.user_id = c.user_id AND ((i.client_name = c.name AND c.name != '') OR (i.client_email = c.email AND c.email != ''))) as total_billed,
      (SELECT COALESCE(SUM(CASE WHEN i.status IN ('pending', 'sent', 'overdue') THEN (CASE WHEN i.balance_due > 0 THEN i.balance_due ELSE i.total END) ELSE 0 END), 0) FROM invoices i WHERE i.user_id = c.user_id AND ((i.client_name = c.name AND c.name != '') OR (i.client_email = c.email AND c.email != ''))) as outstanding_balance,
      (SELECT MAX(i.issue_date) FROM invoices i WHERE i.user_id = c.user_id AND ((i.client_name = c.name AND c.name != '') OR (i.client_email = c.email AND c.email != ''))) as last_invoice_date
    FROM clients c
    WHERE c.user_id = ?
  `;

  const params = [userId];

  if (search && search.trim()) {
    query += ` AND (c.name LIKE ? OR c.company LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)`;
    const t = `%${search.trim()}%`;
    params.push(t, t, t, t);
  }

  if (sort === 'name_desc') {
    query += ` ORDER BY c.name DESC`;
  } else if (sort === 'billed_desc') {
    query += ` ORDER BY total_billed DESC`;
  } else if (sort === 'outstanding_desc') {
    query += ` ORDER BY outstanding_balance DESC`;
  } else if (sort === 'recent') {
    query += ` ORDER BY c.created_at DESC`;
  } else {
    query += ` ORDER BY c.name ASC`;
  }

  const rows = db.prepare(query).all(...params);
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    company: r.company || '',
    email: r.email || '',
    phone: r.phone || '',
    billingAddress: r.billing_address || '',
    shippingAddress: r.shipping_address || '',
    currency: r.currency || 'USD',
    notes: r.notes || '',
    invoicesCount: Number(r.invoices_count || 0),
    totalBilled: Number(r.total_billed || 0),
    outstandingBalance: Number(r.outstanding_balance || 0),
    lastInvoiceDate: r.last_invoice_date || '',
    createdAt: r.created_at
  }));
}

// --------------------------------------------------------------------------
// ACTIVITY LOGGING
// --------------------------------------------------------------------------

function logActivity(userId, { type, description, entityType = '', entityId = '' }) {
  if (!userId || !description) return;
  const id = `act_${crypto.randomBytes(8).toString('hex')}`;
  const now = new Date().toISOString();
  try {
    db.prepare(`
      INSERT INTO activities (id, user_id, type, description, entity_type, entity_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, type || 'general', description, entityType, entityId, now);
  } catch (e) {}
}

function listActivities(userId, limit = 10) {
  return db.prepare(`
    SELECT * FROM activities
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(userId, limit);
}

// --------------------------------------------------------------------------
// NOTIFICATIONS
// --------------------------------------------------------------------------

function createNotification(userId, { title, message, type = 'info', link = '' }) {
  if (!userId || !title) return;
  const id = `notif_${crypto.randomBytes(8).toString('hex')}`;
  const now = new Date().toISOString();
  try {
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, link, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `).run(id, userId, title, message, type, link, now);
  } catch (e) {}
}

function listNotifications(userId, limit = 20) {
  const items = db.prepare(`
    SELECT * FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(userId, limit);

  const unreadRow = db.prepare(`
    SELECT COUNT(id) as count FROM notifications
    WHERE user_id = ? AND is_read = 0
  `).get(userId);

  return {
    items,
    unreadCount: unreadRow ? unreadRow.count : 0
  };
}

function markNotificationRead(userId, notifId) {
  db.prepare(`
    UPDATE notifications SET is_read = 1
    WHERE id = ? AND user_id = ?
  `).run(notifId, userId);
  return true;
}

function markAllNotificationsRead(userId) {
  db.prepare(`
    UPDATE notifications SET is_read = 1
    WHERE user_id = ?
  `).run(userId);
  return true;
}

// --------------------------------------------------------------------------
// BILLING, SUBSCRIPTIONS & TOKENIZED PAYMENT METHODS
// --------------------------------------------------------------------------

function getBillingSummary(userId) {
  const user = getUserById(userId);
  if (!user) throw new Error('User not found');

  const methods = db.prepare(`
    SELECT id, brand, last4, exp_month, exp_year, is_default, created_at
    FROM payment_methods
    WHERE user_id = ?
    ORDER BY is_default DESC, created_at DESC
  `).all(userId);

  const transactions = db.prepare(`
    SELECT * FROM billing_transactions
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `).all(userId);

  const nextRenewal = new Date(Date.now() + 26 * 24 * 60 * 60 * 1000);
  const formattedRenewal = nextRenewal.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return {
    plan: user.plan || 'Free Forever Tier',
    billingCycle: user.billing_cycle || 'Monthly',
    status: 'Active',
    nextBillingDate: formattedRenewal,
    price: user.plan && user.plan.includes('Pro') ? '$12.00 / month' : '$0.00 / month',
    paymentMethods: methods.map(m => ({
      id: m.id,
      brand: m.brand,
      last4: m.last4,
      expMonth: m.exp_month,
      expYear: m.exp_year,
      isDefault: Boolean(m.is_default),
      createdAt: m.created_at
    })),
    transactions: transactions.map(t => ({
      id: t.id,
      description: t.description,
      amount: t.amount,
      paymentMethod: t.payment_method,
      status: t.status,
      receiptId: t.receipt_id,
      date: new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }))
  };
}

function addPaymentMethod(userId, { brand, last4, expMonth, expYear, token }) {
  if (!last4 || !brand) {
    throw new Error('Card brand and last 4 digits are required.');
  }

  const countRow = db.prepare('SELECT COUNT(id) as count FROM payment_methods WHERE user_id = ?').get(userId);
  const isDefault = countRow.count === 0 ? 1 : 0;

  const id = `pm_${crypto.randomBytes(8).toString('hex')}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO payment_methods (id, user_id, brand, last4, exp_month, exp_year, token_id, is_default, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, brand, last4, String(expMonth || '12'), String(expYear || '28'), token || `tok_${crypto.randomBytes(12).toString('hex')}`, isDefault, now);

  try {
    logActivity(userId, {
      type: 'payment_method_added',
      description: `Added payment method ${brand} •••• ${last4}`,
      entityType: 'billing',
      entityId: id
    });
    createNotification(userId, {
      title: 'Payment Method Saved',
      message: `${brand} card ending in ${last4} was added to your account.`,
      type: 'success',
      link: '#billing'
    });
  } catch (e) {}

  return getBillingSummary(userId);
}

function deletePaymentMethod(userId, cardId) {
  const existing = db.prepare('SELECT * FROM payment_methods WHERE id = ? AND user_id = ?').get(cardId, userId);
  if (!existing) {
    throw new Error('Payment method not found.');
  }

  db.prepare('DELETE FROM payment_methods WHERE id = ? AND user_id = ?').run(cardId, userId);

  if (existing.is_default) {
    const nextCard = db.prepare('SELECT id FROM payment_methods WHERE user_id = ? LIMIT 1').get(userId);
    if (nextCard) {
      db.prepare('UPDATE payment_methods SET is_default = 1 WHERE id = ?').run(nextCard.id);
    }
  }

  try {
    logActivity(userId, {
      type: 'payment_method_removed',
      description: `Removed payment method ${existing.brand} •••• ${existing.last4}`,
      entityType: 'billing'
    });
  } catch (e) {}

  return getBillingSummary(userId);
}

function setDefaultPaymentMethod(userId, cardId) {
  const existing = db.prepare('SELECT * FROM payment_methods WHERE id = ? AND user_id = ?').get(cardId, userId);
  if (!existing) {
    throw new Error('Payment method not found.');
  }

  db.prepare('UPDATE payment_methods SET is_default = 0 WHERE user_id = ?').run(userId);
  db.prepare('UPDATE payment_methods SET is_default = 1 WHERE id = ? AND user_id = ?').run(cardId, userId);

  try {
    logActivity(userId, {
      type: 'payment_method_default',
      description: `Set ${existing.brand} •••• ${existing.last4} as primary payment card`,
      entityType: 'billing'
    });
  } catch (e) {}

  return getBillingSummary(userId);
}

function updateSubscriptionPlan(userId, { plan, billingCycle }) {
  if (!plan) throw new Error('Plan name is required.');
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE users SET
      plan = ?,
      billing_cycle = COALESCE(?, billing_cycle),
      updated_at = ?
    WHERE id = ?
  `).run(plan, billingCycle || 'Monthly', now, userId);

  const isPro = plan.toLowerCase().includes('pro');
  const isBusiness = plan.toLowerCase().includes('business');
  if (isPro || isBusiness) {
    const txId = `tx_${crypto.randomBytes(8).toString('hex')}`;
    const amount = isPro ? 12.00 : 29.00;
    const planDisplay = isPro ? 'Pro Workspace Tier' : 'Business Scaling Tier';
    db.prepare(`
      INSERT INTO billing_transactions (id, user_id, description, amount, payment_method, status, receipt_id, created_at)
      VALUES (?, ?, ?, ?, 'Card', 'paid', ?, ?)
    `).run(txId, userId, `${planDisplay} (${billingCycle || 'Monthly'})`, amount, `rcpt_${crypto.randomBytes(6).toString('hex')}`, now);
  }

  try {
    logActivity(userId, {
      type: 'subscription_updated',
      description: `Updated subscription to ${plan} (${billingCycle || 'Monthly'})`,
      entityType: 'billing'
    });
    createNotification(userId, {
      title: 'Plan Updated',
      message: `Your account has been switched to ${plan}.`,
      type: 'success',
      link: '#billing'
    });
  } catch (e) {}

  return getBillingSummary(userId);
}

// --------------------------------------------------------------------------
// COMMAND CENTER DASHBOARD SUMMARY & ATTENTION NEEDED
// --------------------------------------------------------------------------

function getDashboardSummary(userId) {
  const user = getUserById(userId);
  if (!user) throw new Error('User not found');

  const stats = getInvoiceStats(userId);
  const recentInvoices = listInvoices(userId, { sort: 'date_desc' }).slice(0, 6);

  const attentionItems = [];

  const overdueInvoices = db.prepare(`
    SELECT id, invoice_number, client_name, total, balance_due, due_date
    FROM invoices
    WHERE user_id = ? AND status = 'overdue'
    ORDER BY created_at DESC
    LIMIT 3
  `).all(userId);

  overdueInvoices.forEach(inv => {
    attentionItems.push({
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      title: `Invoice #${inv.invoice_number} is Overdue`,
      clientName: inv.client_name || 'Client',
      amount: inv.balance_due > 0 ? inv.balance_due : inv.total,
      type: 'overdue',
      dueDate: inv.due_date,
      actionText: 'View Invoice',
      actionUrl: `index.html?id=${inv.id}`
    });
  });

  const pendingInvoices = db.prepare(`
    SELECT id, invoice_number, client_name, total, balance_due, due_date
    FROM invoices
    WHERE user_id = ? AND status IN ('pending', 'sent')
    ORDER BY created_at DESC
    LIMIT 3
  `).all(userId);

  pendingInvoices.forEach(inv => {
    attentionItems.push({
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      title: `Invoice #${inv.invoice_number} Awaiting Payment`,
      clientName: inv.client_name || 'Client',
      amount: inv.balance_due > 0 ? inv.balance_due : inv.total,
      type: 'pending',
      dueDate: inv.due_date,
      actionText: 'Record Payment',
      actionUrl: `index.html?id=${inv.id}`
    });
  });

  const draftInvoices = db.prepare(`
    SELECT id, invoice_number, client_name, total
    FROM invoices
    WHERE user_id = ? AND status = 'draft'
    ORDER BY created_at DESC
    LIMIT 2
  `).all(userId);

  draftInvoices.forEach(inv => {
    attentionItems.push({
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      title: `Draft #${inv.invoice_number} Ready to Send`,
      clientName: inv.client_name || 'Draft Client',
      amount: inv.total,
      type: 'draft',
      actionText: 'Edit & Send',
      actionUrl: `index.html?id=${inv.id}`
    });
  });

  const activities = listActivities(userId, 6);
  const clientCountRow = db.prepare('SELECT COUNT(id) as count FROM clients WHERE user_id = ?').get(userId);
  const notifications = listNotifications(userId, 10);

  return {
    user: {
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      avatar: user.avatar || '',
      businessName: user.business_name || '',
      businessEmail: user.business_email || '',
      businessPhone: user.business_phone || '',
      businessAddress: user.business_address || '',
      businessWebsite: user.business_website || '',
      businessCity: user.business_city || '',
      businessState: user.business_state || '',
      businessPostalCode: user.business_postal_code || '',
      businessCountry: user.business_country || '',
      businessTaxId: user.business_tax_id || '',
      defaultCurrency: user.default_currency || 'USD',
      defaultPaymentTerms: user.default_payment_terms || 'Due on Receipt',
      defaultNotes: user.default_notes || '',
      defaultTaxRate: user.default_tax_rate || 0,
      plan: user.plan || 'Free Forever Tier',
      billingCycle: user.billing_cycle || 'Monthly',
      createdAt: user.created_at
    },
    stats: {
      totalInvoices: stats.totalInvoices,
      totalBilled: stats.totalBilled,
      paidCount: stats.paidCount,
      paidAmount: stats.paidAmount,
      pendingCount: stats.pendingCount,
      pendingAmount: stats.pendingAmount,
      overdueCount: stats.overdueCount,
      overdueAmount: stats.overdueAmount,
      draftCount: stats.draftCount,
      outstandingAmount: stats.pendingAmount + stats.overdueAmount
    },
    kpis: {
      totalCount: stats.totalInvoices,
      paidCount: stats.paidCount,
      pendingCount: stats.pendingCount,
      overdueCount: stats.overdueCount,
      draftCount: stats.draftCount
    },
    financials: {
      totalInvoiced: stats.totalBilled,
      amountPaid: stats.paidAmount,
      outstanding: stats.pendingAmount + stats.overdueAmount
    },
    attentionNeeded: attentionItems,
    recentInvoices,
    recentActivities: activities.map(a => ({
      id: a.id,
      type: a.type,
      description: a.description,
      entityType: a.entity_type,
      entityId: a.entity_id,
      createdAt: a.created_at
    })),
    clientsCount: clientCountRow ? clientCountRow.count : 0,
    unreadNotificationsCount: notifications.unreadCount
  };
}

// --------------------------------------------------------------------------
// GLOBAL SEARCH (INVOICES, CLIENTS, TEMPLATES, TOOLS)
// --------------------------------------------------------------------------

function globalSearch(userId, rawQuery) {
  const q = (rawQuery || '').trim();
  if (!q) return { invoices: [], clients: [], templates: [], tools: [] };
  const pattern = `%${q}%`;

  const invoices = db.prepare(`
    SELECT id, invoice_number, client_name, total, status, issue_date
    FROM invoices
    WHERE user_id = ? AND (
      invoice_number LIKE ? OR
      client_name LIKE ? OR
      client_email LIKE ? OR
      notes LIKE ?
    )
    ORDER BY created_at DESC
    LIMIT 8
  `).all(userId, pattern, pattern, pattern, pattern);

  const clients = db.prepare(`
    SELECT id, name, company, email, phone
    FROM clients
    WHERE user_id = ? AND (
      name LIKE ? OR
      company LIKE ? OR
      email LIKE ? OR
      phone LIKE ?
    )
    ORDER BY name ASC
    LIMIT 8
  `).all(userId, pattern, pattern, pattern, pattern);

  const systemTemplates = [
    { id: 'emerald', name: 'Emerald Green', desc: 'Standard business layout with modern emerald accents', url: 'index.html?template=emerald' },
    { id: 'charcoal', name: 'Minimal Slate', desc: 'High-contrast monochrome for consultants & engineers', url: 'index.html?template=charcoal' },
    { id: 'corporate', name: 'Corporate Navy', desc: 'Enterprise formal layout with strict tabular structure', url: 'index.html?template=corporate' },
    { id: 'creative', name: 'Creative Indigo', desc: 'Vibrant modern header for agencies and designers', url: 'index.html?template=creative' }
  ];
  const matchedTemplates = systemTemplates.filter(t =>
    t.name.toLowerCase().includes(q.toLowerCase()) || t.desc.toLowerCase().includes(q.toLowerCase())
  );

  const systemTools = [
    { id: 'tool-pdf', name: 'PDF Invoice Generator', desc: 'Instant 0ms client-side vector PDF generation', url: 'pdf-invoice-generator.html' },
    { id: 'tool-num', name: 'Invoice Number Generator', desc: 'Auto-sequential numbering system', url: 'invoice-number-generator.html' },
    { id: 'tool-gst', name: 'GST & Tax Calculator', desc: 'Calculate CGST, SGST, IGST & VAT amounts', url: 'gst-invoice-generator.html' },
    { id: 'tool-freelance', name: 'Freelance Invoicing Tool', desc: 'Hourly rates & milestone billing structure', url: 'invoice-generator-for-freelancers.html' },
    { id: 'tool-payments', name: 'Payment Fee Simulator', desc: 'Calculate Stripe, PayPal, and gateway fees', url: 'payments.html' }
  ];
  const matchedTools = systemTools.filter(t =>
    t.name.toLowerCase().includes(q.toLowerCase()) || t.desc.toLowerCase().includes(q.toLowerCase())
  );

  return {
    invoices: invoices.map(i => ({
      id: i.id,
      number: i.invoice_number,
      clientName: i.client_name,
      total: i.total,
      status: i.status,
      date: i.issue_date,
      url: `index.html?id=${i.id}`
    })),
    clients: clients.map(c => ({
      id: c.id,
      name: c.name,
      company: c.company,
      email: c.email,
      url: `dashboard.html#clients`
    })),
    templates: matchedTemplates,
    tools: matchedTools
  };
}

// --------------------------------------------------------------------------
// JSON & CLOUD STORAGE HELPERS
// --------------------------------------------------------------------------

function safeParseJson(str, fallback = {}) {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
}

function saveFileRecord(userId, { fileName, fileType, mimeType, size, storageKey, sourceTool = '', metadata = {} }) {
  const id = 'fil_' + crypto.randomBytes(12).toString('hex');
  const now = new Date().toISOString();
  const metaStr = typeof metadata === 'string' ? metadata : JSON.stringify(metadata);

  db.prepare(`
    INSERT INTO files (id, user_id, file_name, file_type, mime_type, size, storage_key, source_tool, metadata, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, fileName, fileType, mimeType, size, storageKey, sourceTool, metaStr, now, now);

  logActivity(userId, {
    type: 'file_saved',
    description: `Saved "${fileName}" to Cloud Storage`,
    entityType: 'file',
    entityId: id
  });

  return getFile(userId, id);
}

function listFiles(userId, { search = '', fileType = 'all', sort = 'newest' } = {}) {
  let query = 'SELECT * FROM files WHERE user_id = ?';
  const params = [userId];

  if (search && search.trim()) {
    query += ' AND file_name LIKE ?';
    params.push(`%${search.trim()}%`);
  }

  if (fileType && fileType !== 'all') {
    query += ' AND file_type = ?';
    params.push(fileType.trim().toLowerCase());
  }

  if (sort === 'oldest') {
    query += ' ORDER BY created_at ASC';
  } else if (sort === 'name') {
    query += ' ORDER BY file_name COLLATE NOCASE ASC';
  } else if (sort === 'size') {
    query += ' ORDER BY size DESC';
  } else {
    query += ' ORDER BY created_at DESC';
  }

  const rows = db.prepare(query).all(...params);
  return rows.map(r => ({
    ...r,
    metadata: safeParseJson(r.metadata, {})
  }));
}

function getFile(userId, fileId) {
  const row = db.prepare('SELECT * FROM files WHERE id = ? AND user_id = ?').get(fileId, userId);
  if (!row) return null;
  return {
    ...row,
    metadata: safeParseJson(row.metadata, {})
  };
}

function deleteFile(userId, fileId) {
  const file = getFile(userId, fileId);
  if (!file) {
    throw new Error('File not found or unauthorized.');
  }

  // Delete physical file from disk
  const diskPath = path.join(UPLOADS_DIR, file.storage_key);
  try {
    if (fs.existsSync(diskPath)) {
      fs.unlinkSync(diskPath);
    }
  } catch (err) {
    console.error(`Notice: could not unlink ${diskPath}: ${err.message}`);
  }

  db.prepare('DELETE FROM files WHERE id = ? AND user_id = ?').run(fileId, userId);

  logActivity(userId, {
    type: 'file_deleted',
    description: `Deleted "${file.file_name}" from Cloud Storage`,
    entityType: 'file',
    entityId: fileId
  });

  return { success: true, id: fileId };
}

function renameFile(userId, fileId, newName) {
  const trimmed = (newName || '').trim();
  if (!trimmed) {
    throw new Error('File name cannot be empty.');
  }
  const file = getFile(userId, fileId);
  if (!file) {
    throw new Error('File not found or unauthorized.');
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE files SET file_name = ?, updated_at = ? WHERE id = ? AND user_id = ?')
    .run(trimmed, now, fileId, userId);

  return getFile(userId, fileId);
}

// --------------------------------------------------------------------------
// TOOL USAGE & ACTIVITY
// --------------------------------------------------------------------------

function logToolUsage(userId, { toolId, toolName, action, metadata = {} }) {
  const id = 'tul_' + crypto.randomBytes(8).toString('hex');
  const now = new Date().toISOString();
  const metaStr = typeof metadata === 'string' ? metadata : JSON.stringify(metadata);

  db.prepare(`
    INSERT INTO tool_usage (id, user_id, tool_id, tool_name, action, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, toolId, toolName, action, metaStr, now);

  logActivity(userId, {
    type: 'tool_used',
    description: `Used ${toolName} (${action})`,
    entityType: 'tool',
    entityId: toolId
  });

  return { id, toolId, toolName, action, created_at: now };
}

function listRecentToolUsage(userId, limit = 10) {
  const rows = db.prepare('SELECT * FROM tool_usage WHERE user_id = ? ORDER BY created_at DESC LIMIT ?')
    .all(userId, limit);
  return rows.map(r => ({
    ...r,
    metadata: safeParseJson(r.metadata, {})
  }));
}

// --------------------------------------------------------------------------
// PAYMENT LINKS
// --------------------------------------------------------------------------

function createPaymentLink(userId, { invoiceId = '', title, amount, currency = 'USD', description = '', expiresAt = '' }) {
  if (!title || !title.trim()) throw new Error('Title is required for payment link.');
  const numAmount = parseFloat(amount) || 0;
  if (numAmount <= 0) throw new Error('Amount must be greater than zero.');

  const id = 'plk_' + crypto.randomBytes(10).toString('hex');
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO payment_links (id, user_id, invoice_id, title, amount, currency, description, status, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
  `).run(id, userId, invoiceId, title.trim(), numAmount, currency.trim().toUpperCase(), description.trim(), expiresAt, now);

  logActivity(userId, {
    type: 'payment_link_created',
    description: `Created payment link for "${title}" (${currency} ${numAmount.toFixed(2)})`,
    entityType: 'payment_link',
    entityId: id
  });

  return getPaymentLink(id);
}

function listPaymentLinks(userId) {
  return db.prepare('SELECT * FROM payment_links WHERE user_id = ? ORDER BY created_at DESC').all(userId);
}

function getPaymentLink(linkId) {
  return db.prepare('SELECT * FROM payment_links WHERE id = ?').get(linkId);
}

function checkInvoiceNumberExists(userId, invoiceNumber) {
  if (!invoiceNumber) return { exists: false };
  const row = db.prepare('SELECT id, invoice_number FROM invoices WHERE user_id = ? AND invoice_number = ? COLLATE NOCASE').get(userId, invoiceNumber.trim());
  return {
    exists: !!row,
    invoiceId: row ? row.id : null,
    invoiceNumber: row ? row.invoice_number : null
  };
}

function recordInvoicePayment(userId, data = {}) {
  const invoiceId = data.invoiceId || data.invoice_id || '';
  const numAmount = parseFloat(data.amount);
  if (isNaN(numAmount) || numAmount <= 0) throw new Error('Valid payment amount is required.');
  const currency = data.currency || 'USD';
  const gateway = data.gateway || data.provider || 'Stripe';
  const rawStatus = (data.status || 'Paid').trim();
  const normalizedStatus = rawStatus.toLowerCase() === 'paid' ? 'Paid' :
                           rawStatus.toLowerCase() === 'partially paid' ? 'Partially Paid' :
                           rawStatus.toLowerCase() === 'pending' ? 'Pending' :
                           rawStatus.toLowerCase() === 'refunded' ? 'Refunded' :
                           rawStatus.toLowerCase() === 'failed' ? 'Failed' :
                           rawStatus.toLowerCase() === 'overdue' ? 'Overdue' : 'Paid';
  const reference = data.reference || data.transaction_reference || '';
  const payerName = data.payerName || data.payer_name || '';
  const payerEmail = data.payerEmail || data.payer_email || '';
  const notes = data.notes || '';
  const id = `pay_${crypto.randomBytes(8).toString('hex')}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO invoice_payments (id, user_id, invoice_id, amount, currency, gateway, status, reference, payer_name, payer_email, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, invoiceId, numAmount, currency, gateway, normalizedStatus, reference, payerName, payerEmail, notes, now);

  if (invoiceId && normalizedStatus === 'Paid') {
    try {
      db.prepare("UPDATE invoices SET status = 'paid', updated_at = ? WHERE id = ? AND user_id = ?").run(now, invoiceId, userId);
    } catch (e) {}
  } else if (invoiceId && normalizedStatus === 'Partially Paid') {
    try {
      db.prepare("UPDATE invoices SET status = 'partially_paid', updated_at = ? WHERE id = ? AND user_id = ?").run(now, invoiceId, userId);
    } catch (e) {}
  }

  try {
    logActivity(userId, {
      type: 'payment_recorded',
      description: `Recorded ${currency} ${numAmount.toFixed(2)} payment via ${gateway} (Ref: ${reference || 'N/A'})`,
      entityType: 'payment',
      entityId: id
    });
  } catch (e) {}

  return db.prepare('SELECT * FROM invoice_payments WHERE id = ?').get(id);
}

function listInvoicePayments(userId, { status = '', invoiceId = '' } = {}) {
  let sql = `
    SELECT p.*, i.invoice_number, i.client_name
    FROM invoice_payments p
    LEFT JOIN invoices i ON p.invoice_id = i.id
    WHERE p.user_id = ?
  `;
  const params = [userId];

  if (status && status !== 'all') {
    sql += ' AND p.status = ?';
    params.push(status);
  }
  if (invoiceId) {
    sql += ' AND p.invoice_id = ?';
    params.push(invoiceId);
  }
  sql += ' ORDER BY p.created_at DESC';

  return db.prepare(sql).all(...params);
}

function updatePaymentStatus(userId, paymentId, newStatus) {
  const allowed = ['Pending', 'Paid', 'Partially Paid', 'Failed', 'Refunded', 'Overdue'];
  if (!allowed.includes(newStatus)) throw new Error('Invalid payment status.');
  const existing = db.prepare('SELECT * FROM invoice_payments WHERE id = ? AND user_id = ?').get(paymentId, userId);
  if (!existing) throw new Error('Payment record not found.');

  db.prepare('UPDATE invoice_payments SET status = ? WHERE id = ? AND user_id = ?').run(newStatus, paymentId, userId);
  return db.prepare('SELECT * FROM invoice_payments WHERE id = ?').get(paymentId);
}

module.exports = {
  db,
  UPLOADS_DIR,
  createUser,
  verifyUser,
  findOrCreateGoogleUser,
  createSession,
  getSession,
  deleteSession,
  getUserById,
  updateUserProfile,
  changePassword,
  getNextInvoiceNumber,
  createInvoice,
  updateInvoice,
  getInvoice,
  deleteInvoice,
  updateInvoiceStatus,
  duplicateInvoice,
  listInvoices,
  getInvoiceStats,
  // Clients & Activity
  createClient,
  updateClient,
  getClient,
  deleteClient,
  listClients,
  logActivity,
  listActivities,
  createNotification,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getBillingSummary,
  addPaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  updateSubscriptionPlan,
  getDashboardSummary,
  globalSearch,
  // Cloud Files & Tool Suite
  saveFileRecord,
  listFiles,
  getFile,
  deleteFile,
  renameFile,
  logToolUsage,
  listRecentToolUsage,
  createPaymentLink,
  listPaymentLinks,
  getPaymentLink,
  checkInvoiceNumberExists,
  recordInvoicePayment,
  listInvoicePayments,
  updatePaymentStatus
};
