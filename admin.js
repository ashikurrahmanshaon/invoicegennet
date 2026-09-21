#!/usr/bin/env node
/* ==========================================================================
   INVOICE-GEN.NET - ADMIN INSPECTOR CLI TOOL
   Quickly inspect registered users, active login sessions, and invoices
   Usage: node admin.js [optional: email]
   ========================================================================== */

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'data', 'invoicegen.db');

if (!fs.existsSync(DB_PATH)) {
  console.error('[ERROR] Database file not found at:', DB_PATH);
  process.exit(1);
}

const db = new DatabaseSync(DB_PATH);

console.log('\n========================================================================');
console.log('            INVOICE-GEN.NET — DATABASE & USER ADMIN MONITOR             ');
console.log('========================================================================');
console.log(`Database Location: ${DB_PATH}\n`);

// 1. Overview Metrics
const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
const totalInvoices = db.prepare('SELECT COUNT(*) as count FROM invoices').get().count;
const totalClients = db.prepare('SELECT COUNT(*) as count FROM clients').get().count;
const activeSessions = db.prepare("SELECT COUNT(*) as count FROM sessions WHERE expires_at > datetime('now')").get().count;

// Check Firebase Status
let fbStatus = { isReady: false };
try {
  const firebase = require('./firebase');
  fbStatus = firebase.getStatus();
} catch (e) {}

console.log('------------------------------------------------------------------------');
console.log(`TOTAL REGISTERED USERS : ${totalUsers}`);
console.log(`TOTAL INVOICES CREATED : ${totalInvoices}`);
console.log(`TOTAL SAVED CLIENTS    : ${totalClients}`);
console.log(`CURRENT ACTIVE SESSIONS: ${activeSessions}`);
console.log(`FIREBASE CLOUD SYNC    : ${fbStatus.isReady ? '🔥 CONNECTED (' + fbStatus.configSource + ')' : '⚠️ Not connected yet (Local SQLite only)'}`);
console.log('------------------------------------------------------------------------\n');

// 2. Filter or Show Recent Users
const searchArg = process.argv[2];

if (searchArg) {
  console.log(`Searching for user matching "${searchArg}":`);
  const matched = db.prepare(`
    SELECT u.id, u.name, u.email, u.business_name, u.created_at,
           (SELECT COUNT(*) FROM invoices WHERE user_id = u.id) as invoice_count,
           (SELECT COUNT(*) FROM clients WHERE user_id = u.id) as client_count
    FROM users u
    WHERE u.email LIKE ? OR u.name LIKE ?
    ORDER BY u.created_at DESC
  `).all(`%${searchArg}%`, `%${searchArg}%`);

  if (matched.length === 0) {
    console.log('No users found matching that query.');
  } else {
    console.table(matched.map(u => ({
      ID: u.id,
      Name: u.name,
      Email: u.email,
      Business: u.business_name || '—',
      Invoices: u.invoice_count,
      Clients: u.client_count,
      Registered: new Date(u.created_at).toLocaleString()
    })));
  }
} else {
  console.log('LATEST 15 REGISTERED USERS:');
  const recentUsers = db.prepare(`
    SELECT u.id, u.name, u.email, u.business_name, u.created_at,
           (SELECT COUNT(*) FROM invoices WHERE user_id = u.id) as invoice_count
    FROM users u
    ORDER BY u.created_at DESC
    LIMIT 15
  `).all();

  console.table(recentUsers.map(u => ({
    ID: u.id,
    Name: u.name,
    Email: u.email,
    Business: u.business_name || '—',
    Invoices: u.invoice_count,
    Registered: new Date(u.created_at).toLocaleString()
  })));

  console.log('\nLATEST ACTIVE LOGIN SESSIONS:');
  const recentLogins = db.prepare(`
    SELECT s.id as session_id, u.name, u.email, s.created_at, s.expires_at
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    ORDER BY s.created_at DESC
    LIMIT 8
  `).all();

  console.table(recentLogins.map(s => ({
    User: s.name,
    Email: s.email,
    'Login Time': new Date(s.created_at).toLocaleString(),
    'Expires At': new Date(s.expires_at).toLocaleDateString()
  })));
}

console.log('\n========================================================================');
console.log('Tips:');
console.log(' - To search a user by email/name: node admin.js [email or name]');
console.log(' - To view in visual GUI tool: Open "data/invoicegen.db" with DB Browser for SQLite');
console.log('========================================================================\n');
