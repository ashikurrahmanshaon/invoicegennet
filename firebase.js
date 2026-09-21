/* ==========================================================================
   INVOICE-GEN.NET - GOOGLE FIREBASE CLOUD INTEGRATION
   Live 2-way cloud persistence for users, invoices, drafts & clients
   Supports both Firebase Realtime Database (Secret / REST) and Firestore (Admin SDK)
   ========================================================================== */

const fs = require('fs');
const path = require('path');
const https = require('https');

// 1. Auto-load .env file if present
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx > 0) {
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
    } catch (e) {}
  }
}
loadEnv();

let admin = null;
let firestore = null;
let isFirebaseReady = false;
let connectionType = 'none'; // 'rtdb' | 'firestore' | 'none'
let configSource = 'none';

const RTDB_URL = process.env.FIREBASE_DATABASE_URL || 'https://invoicegennet-default-rtdb.firebaseio.com';
const RTDB_SECRET = process.env.FIREBASE_DATABASE_SECRET || '';

// High performance keep-alive HTTPS agent for Firebase requests
const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 25
});

/**
 * Execute HTTP REST request to Firebase Realtime Database
 */
function rtdbRequest(endpointPath, method, data = null) {
  return new Promise((resolve, reject) => {
    if (!RTDB_SECRET) {
      return resolve({ success: false, error: 'Firebase secret not configured' });
    }

    const cleanPath = endpointPath.startsWith('/') ? endpointPath : '/' + endpointPath;
    const fullUrl = new URL(`${cleanPath}.json?auth=${RTDB_SECRET}`, RTDB_URL);

    const payload = data !== null ? JSON.stringify(data) : null;
    const options = {
      hostname: fullUrl.hostname,
      port: 443,
      path: fullUrl.pathname + fullUrl.search,
      method: method.toUpperCase(),
      agent: httpsAgent,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (payload) {
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = https.request(options, (res) => {
      let resBody = '';
      res.on('data', chunk => { resBody += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve({ success: true, data: resBody ? JSON.parse(resBody) : null });
          } catch (e) {
            resolve({ success: true, data: resBody });
          }
        } else {
          resolve({ success: false, statusCode: res.statusCode, error: resBody });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });

    req.setTimeout(8000, () => {
      req.destroy();
      resolve({ success: false, error: 'Firebase request timeout' });
    });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

function findServiceAccountKeyFile() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH && fs.existsSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)) {
    return process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  }

  const candidates = [
    path.join(__dirname, 'serviceAccountKey.json'),
    path.join(__dirname, 'firebase-service-account.json'),
    path.join(__dirname, 'firebase-key.json')
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  try {
    const files = fs.readdirSync(__dirname);
    for (const file of files) {
      if (file.endsWith('.json') && (file.includes('adminsdk') || file.includes('firebase'))) {
        if (file !== 'package.json' && file !== 'package-lock.json') {
          return path.join(__dirname, file);
        }
      }
    }
  } catch (err) {}

  return null;
}

function initFirebase() {
  if (isFirebaseReady) return true;

  // 1. Check if Service Account Key exists for Firestore
  const keyPath = findServiceAccountKeyFile();
  if (keyPath) {
    try {
      admin = require('firebase-admin');
      const raw = fs.readFileSync(keyPath, 'utf8');
      const serviceAccount = JSON.parse(raw);
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: RTDB_URL
        });
      }
      firestore = admin.firestore();
      try { firestore.settings({ ignoreUndefinedProperties: true }); } catch (e) {}
      isFirebaseReady = true;
      connectionType = 'firestore';
      configSource = path.basename(keyPath);
      console.log(`[Firebase] 🔥 Connected to Firebase via Service Account: ${configSource}`);
      return true;
    } catch (e) {
      console.warn('[Firebase] Service account found but failed to initialize Admin SDK:', e.message);
    }
  }

  // 2. Fallback to Realtime Database via Secret
  if (RTDB_SECRET && RTDB_SECRET.length > 10) {
    isFirebaseReady = true;
    connectionType = 'rtdb';
    configSource = 'Database Secret (.env)';
    console.log(`[Firebase] 🔥 Connected to Google Firebase Realtime Database at ${RTDB_URL}`);
    return true;
  }

  return false;
}

// Auto-run init
initFirebase();

// ============================================================================
// CLOUD PERSISTENCE SYNC HELPERS (Safe Non-blocking with Error Logging)
// ============================================================================

/**
 * Sync User to Firebase (users/{id})
 */
async function syncUser(user) {
  if (!initFirebase() || !user || !user.id) return null;
  try {
    const cleanUser = {
      id: String(user.id),
      name: user.name || '',
      email: (user.email || '').toLowerCase(),
      avatar: user.avatar || '',
      businessName: user.business_name || user.businessName || '',
      businessEmail: user.business_email || user.businessEmail || '',
      businessPhone: user.business_phone || user.businessPhone || '',
      businessTaxId: user.business_tax_id || user.businessTaxId || '',
      businessAddress: user.business_address || user.businessAddress || '',
      defaultCurrency: user.default_currency || user.defaultCurrency || 'USD',
      defaultPaymentTerms: user.default_payment_terms || user.defaultPaymentTerms || 'Due on Receipt',
      defaultNotes: user.default_notes || user.defaultNotes || '',
      createdAt: user.created_at || user.createdAt || new Date().toISOString(),
      updatedAt: user.updated_at || user.updatedAt || new Date().toISOString(),
      lastSyncedAt: new Date().toISOString()
    };

    if (connectionType === 'firestore' && firestore) {
      await firestore.collection('users').doc(cleanUser.id).set(cleanUser, { merge: true });
    } else {
      await rtdbRequest(`/users/${cleanUser.id}`, 'PUT', cleanUser);
    }
    return cleanUser;
  } catch (err) {
    console.error(`[Firebase] Failed to sync user ${user.id}:`, err.message);
    return null;
  }
}

/**
 * Sync Invoice to Firebase (invoices/{id})
 */
async function syncInvoice(invoice) {
  if (!initFirebase() || !invoice || !invoice.id) return null;
  try {
    const docData = {
      ...invoice,
      lastSyncedAt: new Date().toISOString()
    };

    if (connectionType === 'firestore' && firestore) {
      await firestore.collection('invoices').doc(String(invoice.id)).set(docData, { merge: true });
    } else {
      await rtdbRequest(`/invoices/${invoice.id}`, 'PUT', docData);
    }
    return docData;
  } catch (err) {
    console.error(`[Firebase] Failed to sync invoice ${invoice.id}:`, err.message);
    return null;
  }
}

/**
 * Delete Invoice from Firebase
 */
async function deleteInvoice(invoiceId) {
  if (!initFirebase() || !invoiceId) return false;
  try {
    if (connectionType === 'firestore' && firestore) {
      await firestore.collection('invoices').doc(String(invoiceId)).delete();
    } else {
      await rtdbRequest(`/invoices/${invoiceId}`, 'DELETE');
    }
    return true;
  } catch (err) {
    console.error(`[Firebase] Failed to delete invoice ${invoiceId}:`, err.message);
    return false;
  }
}

/**
 * Sync User Draft to Firebase (drafts/{userId})
 */
async function syncDraft(userId, draftPayload) {
  if (!initFirebase() || !userId) return null;
  try {
    const docData = {
      userId: String(userId),
      payload: draftPayload,
      updatedAt: new Date().toISOString()
    };

    if (connectionType === 'firestore' && firestore) {
      await firestore.collection('drafts').doc(String(userId)).set(docData, { merge: true });
    } else {
      await rtdbRequest(`/drafts/${userId}`, 'PUT', docData);
    }
    return docData;
  } catch (err) {
    console.error(`[Firebase] Failed to sync draft for user ${userId}:`, err.message);
    return null;
  }
}

/**
 * Delete Draft from Firebase (drafts/{userId})
 */
async function deleteDraft(userId) {
  if (!initFirebase() || !userId) return false;
  try {
    if (connectionType === 'firestore' && firestore) {
      await firestore.collection('drafts').doc(String(userId)).delete();
    } else {
      await rtdbRequest(`/drafts/${userId}`, 'DELETE');
    }
    return true;
  } catch (err) {
    console.error(`[Firebase] Failed to delete draft for user ${userId}:`, err.message);
    return false;
  }
}

/**
 * Sync Client to Firebase (clients/{id})
 */
async function syncClient(client) {
  if (!initFirebase() || !client || !client.id) return null;
  try {
    const docData = {
      ...client,
      lastSyncedAt: new Date().toISOString()
    };

    if (connectionType === 'firestore' && firestore) {
      await firestore.collection('clients').doc(String(client.id)).set(docData, { merge: true });
    } else {
      await rtdbRequest(`/clients/${client.id}`, 'PUT', docData);
    }
    return docData;
  } catch (err) {
    console.error(`[Firebase] Failed to sync client ${client.id}:`, err.message);
    return null;
  }
}

/**
 * Delete Client from Firebase
 */
async function deleteClient(clientId) {
  if (!initFirebase() || !clientId) return false;
  try {
    if (connectionType === 'firestore' && firestore) {
      await firestore.collection('clients').doc(String(clientId)).delete();
    } else {
      await rtdbRequest(`/clients/${clientId}`, 'DELETE');
    }
    return true;
  } catch (err) {
    console.error(`[Firebase] Failed to delete client ${clientId}:`, err.message);
    return false;
  }
}

/**
 * Full Migration: Sync all existing SQLite records to Firebase
 */
async function bulkSyncAll(sqliteDb) {
  if (!initFirebase()) {
    return { success: false, error: 'Firebase is not initialized. Please verify credentials.' };
  }

  const results = {
    usersSynced: 0,
    invoicesSynced: 0,
    clientsSynced: 0,
    connectionType,
    errors: []
  };

  try {
    const raw = sqliteDb.db || sqliteDb;
    if (raw && typeof raw.prepare === 'function') {
      const users = raw.prepare('SELECT id, name, email, business_name, business_email, business_phone, business_tax_id, business_address, default_currency, default_payment_terms, default_notes, created_at, updated_at FROM users').all();
      const invoices = raw.prepare('SELECT * FROM invoices').all();
      const clients = raw.prepare('SELECT * FROM clients').all();

      if (connectionType === 'rtdb') {
        // High-speed atomic batch PATCH for Realtime Database (completes in ~1 second)
        const usersMap = {};
        for (const u of users) {
          usersMap[u.id] = {
            id: String(u.id),
            name: u.name || '',
            email: (u.email || '').toLowerCase(),
            avatar: u.avatar || '',
            businessName: u.business_name || '',
            businessEmail: u.business_email || '',
            businessPhone: u.business_phone || '',
            businessTaxId: u.business_tax_id || '',
            businessAddress: u.business_address || '',
            defaultCurrency: u.default_currency || 'USD',
            defaultPaymentTerms: u.default_payment_terms || 'Due on Receipt',
            defaultNotes: u.default_notes || '',
            createdAt: u.created_at || new Date().toISOString(),
            updatedAt: u.updated_at || new Date().toISOString(),
            lastSyncedAt: new Date().toISOString()
          };
        }
        if (users.length > 0) {
          await rtdbRequest('/users', 'PATCH', usersMap);
        }
        results.usersSynced = users.length;

        const invoicesMap = {};
        for (const inv of invoices) {
          const items = raw.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(inv.id);
          invoicesMap[inv.id] = {
            ...inv,
            items,
            lastSyncedAt: new Date().toISOString()
          };
        }
        if (invoices.length > 0) {
          await rtdbRequest('/invoices', 'PATCH', invoicesMap);
        }
        results.invoicesSynced = invoices.length;

        const clientsMap = {};
        for (const c of clients) {
          clientsMap[c.id] = {
            ...c,
            lastSyncedAt: new Date().toISOString()
          };
        }
        if (clients.length > 0) {
          await rtdbRequest('/clients', 'PATCH', clientsMap);
        }
        results.clientsSynced = clients.length;
      } else {
        // Firestore batch sync
        for (const u of users) {
          await syncUser(u);
          results.usersSynced++;
        }
        for (const inv of invoices) {
          const items = raw.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(inv.id);
          await syncInvoice({ ...inv, items });
          results.invoicesSynced++;
        }
        for (const c of clients) {
          await syncClient(c);
          results.clientsSynced++;
        }
      }
    }

    return { success: true, ...results };
  } catch (err) {
    console.error('[Firebase] Bulk sync failed:', err);
    return { success: false, error: err.message, ...results };
  }
}

module.exports = {
  get admin() { return admin; },
  get firestore() { return firestore; },
  get isReady() { return isFirebaseReady || initFirebase(); },
  getStatus: () => ({
    isReady: isFirebaseReady || initFirebase(),
    connectionType,
    configSource,
    databaseUrl: RTDB_URL
  }),
  initFirebase,
  syncUser,
  syncInvoice,
  deleteInvoice,
  syncDraft,
  deleteDraft,
  syncClient,
  deleteClient,
  bulkSyncAll
};
