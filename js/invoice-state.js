/* ==========================================================================
   INVOICE STATE MANAGEMENT & CALCULATIONS
   Blank, clean default slate with sample demo available on demand
   ========================================================================== */

const CURRENCIES = {
  USD: { code: 'USD', symbol: '$', position: 'before' },
  EUR: { code: 'EUR', symbol: '€', position: 'before' },
  GBP: { code: 'GBP', symbol: '£', position: 'before' },
  BDT: { code: 'BDT', symbol: '৳', position: 'before' },
  INR: { code: 'INR', symbol: '₹', position: 'before' },
  CAD: { code: 'CAD', symbol: 'CA$', position: 'before' },
  AUD: { code: 'AUD', symbol: 'AU$', position: 'before' },
  JPY: { code: 'JPY', symbol: '¥', position: 'before' },
  AED: { code: 'AED', symbol: 'د.إ', position: 'before' },
  SAR: { code: 'SAR', symbol: '﷼', position: 'before' },
  SGD: { code: 'SGD', symbol: 'SG$', position: 'before' }
};

const getTodayDateString = () => {
  const d = new Date();
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getFutureDateString = (daysAhead = 14) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Blank default state
const BLANK_INVOICE = {
  title: 'INVOICE',
  number: 'INV-001',
  date: getTodayDateString(),
  dueDate: '',
  poNumber: '',
  paymentTerms: 'Due on Receipt',

  sender: {
    name: '',
    address: '',
    email: '',
    phone: ''
  },

  client: {
    name: '',
    address: '',
    email: '',
    phone: ''
  },

  shipTo: {
    enabled: true,
    name: '',
    address: ''
  },

  items: [
    {
      id: 1,
      description: '',
      subtext: '',
      quantity: 1,
      rate: 0
    }
  ],

  discountType: 'percent',
  discountValue: 0,
  taxRate: 0,
  shippingFee: 0,
  amountPaid: 0,

  currency: 'USD',
  logo: null,
  notes: ''
};

// Super Realistic Demo Sample Data for instant preview & testing
const DEMO_INVOICE = {
  title: 'INVOICE',
  number: 'INV-2026-0842',
  date: getTodayDateString(),
  dueDate: getFutureDateString(14),
  poNumber: 'PO-98412',
  paymentTerms: 'Net 14 Days',

  sender: {
    name: 'Apex Digital Solutions Inc.',
    address: '742 Montgomery St, Suite 400\nSan Francisco, CA 94111, United States',
    email: 'billing@apexdigital.io',
    phone: '+1 (415) 890-2415'
  },

  client: {
    name: 'Stratosphere Technologies LLC',
    address: '1000 Brickell Ave, Penthouse 12\nMiami, FL 33131, United States',
    email: 'accounts@stratosphere.tech',
    phone: '+1 (305) 552-8901'
  },

  shipTo: {
    enabled: true,
    name: 'Stratosphere Tech Innovation Lab',
    address: '1000 Brickell Ave, Floor 14, Miami, FL 33131'
  },

  items: [
    {
      id: 1,
      description: 'Full-Stack Web Application Development',
      subtext: 'Phase 2: High-performance REST APIs, database migrations, and responsive UI components',
      quantity: 40,
      rate: 85,
      amount: 3400
    },
    {
      id: 2,
      description: 'Cloud Infrastructure & DevOps Pipeline',
      subtext: 'Docker containerization, automated GitHub Actions CI/CD, SSL certificate and edge CDN setup',
      quantity: 1,
      rate: 750,
      amount: 750
    },
    {
      id: 3,
      description: 'UI/UX Design Sprint & Mobile Optimization',
      subtext: 'Figma interactive prototypes, design token alignment, and WCAG 2.1 accessibility audit',
      quantity: 12,
      rate: 75,
      amount: 900
    }
  ],

  discountType: 'percent',
  discountValue: 5,
  taxRate: 8.5,
  shippingFee: 0,
  amountPaid: 1500,

  currency: 'USD',
  logo: null,
  notes: 'Payment is due within 14 days of invoice issuance. Wire transfer: JPMorgan Chase Bank (Routing: 021000021, Account: 982347192). We sincerely appreciate your business!'
};
const SAMPLE_INVOICE = DEMO_INVOICE;

class InvoiceStore {
  constructor() {
    this.state = this.loadFromStorage() || JSON.parse(JSON.stringify(BLANK_INVOICE));
    this.listeners = [];
  }

  subscribe(callback) {
    this.listeners.push(callback);
  }

  notify() {
    this.listeners.forEach(cb => cb(this.state));
    this.saveToStorage();
  }

  getState() {
    return this.state;
  }

  updateState(path, value) {
    const keys = path.split('.');
    let current = this.state;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    this.notify();
  }

  addItem(description = '', quantity = 1, rate = 0) {
    const newId = Date.now() + Math.floor(Math.random() * 1000);
    const q = parseFloat(quantity) || 1;
    const r = parseFloat(rate) || 0;
    this.state.items.push({
      id: newId,
      description: description,
      subtext: '',
      quantity: q,
      rate: r,
      amount: q * r
    });
    this.notify();
    return newId;
  }

  removeItem(id) {
    if (!this.state.items || this.state.items.length <= 1) {
      this.state.items = [{ id: Date.now(), description: '', subtext: '', quantity: 1, rate: 0, amount: 0 }];
    } else {
      this.state.items = this.state.items.filter(item => item.id != id);
      if (this.state.items.length === 0) {
        this.state.items = [{ id: Date.now(), description: '', subtext: '', quantity: 1, rate: 0, amount: 0 }];
      }
    }
    this.notify();
  }

  updateItem(id, field, value) {
    const item = this.state.items.find(it => it.id == id);
    if (item) {
      if (field === 'quantity' || field === 'rate') {
        item[field] = parseFloat(value) || 0;
        item.amount = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
      } else {
        item[field] = value;
      }
      this.notify();
    }
  }

  calculateTotals() {
    const roundCents = (val) => Math.round((Number(val || 0) + Number.EPSILON) * 100) / 100;

    let subtotalCents = 0;
    (this.state.items || []).forEach((item) => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      subtotalCents += Math.round((qty * rate) * 100);
    });

    const subtotal = roundCents(subtotalCents / 100);

    let discount = 0;
    const discountVal = parseFloat(this.state.discountValue) || 0;
    if (this.state.discountType === 'percent') {
      discount = roundCents((subtotal * discountVal) / 100);
    } else {
      discount = roundCents(discountVal);
    }
    discount = Math.min(discount, subtotal);

    const taxRate = parseFloat(this.state.taxRate) || 0;
    const taxAmount = roundCents((subtotal * taxRate) / 100);

    const shipping = roundCents(parseFloat(this.state.shippingFee) || 0);

    // Subtotal + Tax - Discount + Shipping = Grand Total
    const grandTotal = roundCents(Math.max(0, subtotal + taxAmount - discount + shipping));
    const amountPaid = roundCents(parseFloat(this.state.amountPaid) || 0);
    const balanceDue = roundCents(Math.max(0, grandTotal - amountPaid));

    return {
      subtotal,
      discount,
      taxAmount,
      shipping,
      grandTotal,
      amountPaid,
      balanceDue
    };
  }

  formatMoney(amount, currencyCode = null) {
    const code = currencyCode || this.state.currency || 'USD';
    const cur = CURRENCIES[code] || CURRENCIES.USD;
    const num = parseFloat(amount) || 0;
    const formatted = Math.abs(num).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    const sign = num < 0 ? '-' : '';
    return cur.position === 'before' ? `${sign}${cur.symbol}${formatted}` : `${sign}${formatted} ${cur.symbol}`;
  }

  setCurrency(currCode) {
    if (CURRENCIES[currCode]) {
      this.state.currency = currCode;
      this.notify();
    }
  }

  setLogo(dataUrl) {
    this.state.logo = dataUrl;
    this.notify();
  }

  removeLogo() {
    this.state.logo = null;
    this.notify();
  }

  isFormEmpty() {
    const s = this.state;
    if (!s) return true;

    // Check items: if any item has a description or rate > 0, or more than 1 item
    const items = s.items || [];
    const hasItemsData = items.some(it => {
      const desc = (it.description || '').trim();
      const rate = parseFloat(it.rate) || 0;
      return desc !== '' || rate > 0;
    }) || items.length > 1;
    if (hasItemsData) return false;

    // Check client details
    if (s.client && ((s.client.name || '').trim() !== '' || (s.client.address || '').trim() !== '' || (s.client.email || '').trim() !== '')) {
      return false;
    }

    // Check shipTo details (if enabled)
    if (s.shipTo && s.shipTo.enabled && ((s.shipTo.name || '').trim() !== '' || (s.shipTo.address || '').trim() !== '')) {
      return false;
    }

    // Check notes or signature
    if ((s.notes || '').trim() !== '' || (s.signature || '').trim() !== '') {
      return false;
    }

    // Check rates/adjustments
    if ((parseFloat(s.taxRate) || 0) > 0 || (parseFloat(s.discountValue) || 0) > 0 || (parseFloat(s.amountPaid) || 0) > 0 || (parseFloat(s.shippingFee) || 0) > 0) {
      return false;
    }

    // Check poNumber
    if ((s.poNumber || '').trim() !== '') {
      return false;
    }

    return true;
  }

  loadSample() {
    this.state = JSON.parse(JSON.stringify(DEMO_INVOICE));
    this.state.date = getTodayDateString();
    this.state.dueDate = getFutureDateString(14);
    this.notify();
    return this.state;
  }

  loadDemo() {
    return this.loadSample();
  }

  async loadCloudProfile() {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data && data.authenticated && data.user) {
        const u = data.user;
        const bizName = u.business_name || u.name || '';
        const bizAddr = u.business_address || '';
        const bizEmail = u.business_email || u.email || '';
        const bizPhone = u.business_phone || u.phone || '';
        let fullAddr = bizAddr;
        const contactLine = [bizEmail, bizPhone].filter(Boolean).join(' • ');
        if (contactLine && !fullAddr.includes(bizEmail) && !fullAddr.includes(bizPhone)) {
          fullAddr = fullAddr ? `${fullAddr}\n${contactLine}` : contactLine;
        }
        if (u.business_tax_id && !fullAddr.includes(u.business_tax_id)) {
          fullAddr = `${fullAddr}\nTax ID: ${u.business_tax_id}`;
        }

        if (bizName && (!this.state.sender || !this.state.sender.name)) {
          this.state.sender = {
            name: bizName,
            address: fullAddr,
            email: bizEmail,
            phone: bizPhone
          };
        }
        if (u.default_currency && (!this.state.currency || this.state.currency === 'USD')) {
          this.state.currency = u.default_currency;
        }
        if (u.default_payment_terms && (!this.state.paymentTerms || this.state.paymentTerms === 'Due on Receipt')) {
          this.state.paymentTerms = u.default_payment_terms;
        }
        if (u.default_notes && !this.state.notes) {
          this.state.notes = u.default_notes;
        }
        this.notify();
        return u;
      }
    } catch (e) {}
    return null;
  }

  async loadFromCloud() {
    try {
      const res = await fetch('/api/user/draft');
      if (!res.ok) return null;
      const data = await res.json();
      if (data && data.success && data.draft) {
        const draft = data.draft;
        if (draft.number) this.state.number = draft.number;
        if (draft.date) this.state.date = draft.date;
        if (draft.dueDate !== undefined) this.state.dueDate = draft.dueDate;
        if (draft.poNumber !== undefined) this.state.poNumber = draft.poNumber;
        if (draft.paymentTerms) this.state.paymentTerms = draft.paymentTerms;
        if (draft.currency) this.state.currency = draft.currency;
        if (draft.sender) this.state.sender = draft.sender;
        if (draft.client) this.state.client = draft.client;
        if (draft.shipTo) this.state.shipTo = draft.shipTo;
        if (draft.notes !== undefined) this.state.notes = draft.notes;
        if (draft.taxRate !== undefined) this.state.taxRate = draft.taxRate;
        if (draft.discountValue !== undefined) this.state.discountValue = draft.discountValue;
        if (draft.amountPaid !== undefined) this.state.amountPaid = draft.amountPaid;
        if (Array.isArray(draft.items) && draft.items.length > 0) {
          this.state.items = draft.items;
        }
        this.notify();
        return this.state;
      }
    } catch (e) {}
    return null;
  }

  async syncToCloud() {
    try {
      const res = await fetch('/api/user/draft', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.state)
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  resetInvoice(preserveSavedProfile = true) {
    let savedSender = null;
    let savedLogo = null;
    if (preserveSavedProfile) {
      try {
        const rawProfile = localStorage.getItem('invoicegen_business_profile');
        const rawUser = localStorage.getItem('invoicegen_user');
        const bp = rawProfile ? JSON.parse(rawProfile) : (rawUser ? JSON.parse(rawUser) : null);
        if (bp && (bp.businessName || bp.business_name || bp.name)) {
          savedSender = {
            name: bp.businessName || bp.business_name || bp.name || '',
            address: bp.address || bp.business_address || '',
            email: bp.email || bp.business_email || '',
            phone: bp.phone || bp.business_phone || ''
          };
          if (bp.logo) savedLogo = bp.logo;
        }
      } catch (e) {}
    }

    this.state = JSON.parse(JSON.stringify(BLANK_INVOICE));
    this.state.date = getTodayDateString();
    this.state.number = 'INV-001';
    this.state.items = [{ id: Date.now(), description: '', subtext: '', quantity: 1, rate: 0, amount: 0 }];
    this.state.taxRate = 0;
    this.state.discountValue = 0;
    this.state.amountPaid = 0;
    this.state.shippingFee = 0;
    this.state.notes = '';
    this.state.dueDate = '';
    this.state.poNumber = '';
    this.state.paymentTerms = 'Due on Receipt';

    if (savedSender) {
      this.state.sender = savedSender;
      this.state.logo = savedLogo;
    }

    // Try populating from cloud user profile as primary source of truth
    this.loadCloudProfile();

    this.notify();
    return this.state;
  }

  clear() {
    // Clear cloud draft when resetting form
    fetch('/api/user/draft', { method: 'DELETE' }).catch(() => {});
    return this.resetInvoice(true);
  }

  createNewInvoice(options = {}) {
    const preserveSender = options.preserveSender !== false;
    const preserveCurrency = options.preserveCurrency !== false;
    const currentSender = preserveSender ? JSON.parse(JSON.stringify(this.state.sender || {})) : { name: '', address: '', email: '', phone: '' };
    const currentLogo = preserveSender ? this.state.logo : null;
    const currentCurrency = preserveCurrency ? (this.state.currency || 'USD') : 'USD';
    const currentTerms = this.state.paymentTerms || 'Due on Receipt';

    this.state = JSON.parse(JSON.stringify(BLANK_INVOICE));
    this.state.date = getTodayDateString();
    if (preserveSender) {
      this.state.sender = currentSender;
      this.state.logo = currentLogo;
    }
    if (preserveCurrency) {
      this.state.currency = currentCurrency;
    }
    this.state.paymentTerms = currentTerms;
    if (options.nextNumber) {
      this.state.number = options.nextNumber;
    }
    this.notify();
    return this.state;
  }

  saveToStorage() {
    // Also sync to cloud
    this.syncToCloud();
    try {
      localStorage.setItem('invoicegen_active_v3', JSON.stringify(this.state));
    } catch (e) {
      console.warn('LocalStorage save fallback notice:', e);
    }
  }

  loadFromStorage() {
    try {
      const data = localStorage.getItem('invoicegen_active_v3');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }
}

window.invoiceStore = new InvoiceStore();
