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

// Blank default state as requested ("faka rakho")
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

// Realistic Demo Sample data clearly distinguished as demonstration
const DEMO_INVOICE = {
  title: 'INVOICE',
  number: 'DEMO-001',
  date: getTodayDateString(),
  dueDate: '',
  poNumber: '',
  paymentTerms: 'Due on Receipt',

  sender: {
    name: 'Demo Business',
    address: '123 Demo Street\nDemo City, DC 10101',
    email: 'contact@demobusiness.example',
    phone: '(555) 000-DEMO'
  },

  client: {
    name: 'Demo Client',
    address: '456 Client Avenue\nSuite 200, Metropolis, MP 20202',
    email: 'billing@democlient.example',
    phone: '(555) 123-DEMO'
  },

  shipTo: {
    enabled: true,
    name: 'Demo Client Delivery',
    address: '456 Client Avenue, Metropolis, MP 20202'
  },

  items: [
    {
      id: 1,
      description: 'Website Design',
      subtext: 'Modern responsive website mockup & UI layout',
      quantity: 1,
      rate: 500,
      amount: 500
    }
  ],

  discountType: 'percent',
  discountValue: 0,
  taxRate: 0,
  shippingFee: 0,
  amountPaid: 0,

  currency: 'USD',
  logo: null,
  notes: 'Thank you for testing the demo invoice. Payment terms: Due on Receipt.'
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
    this.notify();
    return this.state;
  }

  loadDemo() {
    return this.loadSample();
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

    this.notify();
    return this.state;
  }

  clear() {
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
    try {
      localStorage.setItem('invoicegen_active_v3', JSON.stringify(this.state));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
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
