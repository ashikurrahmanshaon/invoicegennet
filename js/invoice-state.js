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
  AED: { code: 'AED', symbol: 'AED ', position: 'before' },
  SGD: { code: 'SGD', symbol: 'SG$', position: 'before' }
};

const getTodayDateString = () => {
  const d = new Date();
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Blank default state as requested ("faka rakho")
const BLANK_INVOICE = {
  title: 'INVOICE',
  number: '001',
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

// Sample data loaded only when user clicks "Sample Data"
const SAMPLE_INVOICE = {
  title: 'INVOICE',
  number: '37',
  date: 'Sep 4, 2026',
  dueDate: 'Sep 18, 2026',
  poNumber: 'PO-8921',
  paymentTerms: 'Due on Receipt',

  sender: {
    name: 'Asif Mehedi',
    address: 'P.Hans Frankfurthersingel 128, 1060 TN\nAmsterdam, Netherlands\nasif@example.com\n+31 6 1234 5678',
    email: 'asif@example.com',
    phone: '+31 6 1234 5678'
  },

  client: {
    name: 'Huze Frankendael',
    address: 'Middenweg 72\n1097BS Amsterdam',
    email: 'invoices@huizefrankendael.nl',
    phone: '+31 20 987 6543'
  },

  shipTo: {
    enabled: true,
    name: 'Middenweg 72',
    address: '1097BS Amsterdam\nNetherlands'
  },

  items: [
    {
      id: 1,
      description: 'Web Application Consulting & Development',
      subtext: '',
      quantity: 252,
      rate: 20.00
    }
  ],

  discountType: 'percent',
  discountValue: 0,
  taxRate: 21,
  shippingFee: 0,
  amountPaid: 0,

  currency: 'EUR',
  logo: null,
  notes: 'KvK: 91435382\nVAT Number: NL004890664B78\nBank A/C Name: A. Mehedi\nIBAN: NL54 ABNA 0125632436\n\nThank you for your business!'
};

class InvoiceStore {
  constructor() {
    this.state = this.loadFromStorage() || JSON.parse(JSON.stringify(SAMPLE_INVOICE));
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
    const newId = Date.now();
    this.state.items.push({
      id: newId,
      description: description,
      subtext: '',
      quantity: Number(quantity),
      rate: Number(rate)
    });
    this.notify();
    return newId;
  }

  removeItem(id) {
    if (this.state.items.length <= 1) {
      this.state.items = [{ id: Date.now(), description: '', subtext: '', quantity: 1, rate: 0 }];
    } else {
      this.state.items = this.state.items.filter(item => item.id != id);
    }
    this.notify();
  }

  updateItem(id, field, value) {
    const item = this.state.items.find(it => it.id == id);
    if (item) {
      if (field === 'quantity' || field === 'rate') {
        item[field] = parseFloat(value) || 0;
      } else {
        item[field] = value;
      }
      this.notify();
    }
  }

  calculateTotals() {
    const subtotal = this.state.items.reduce((acc, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      return acc + (qty * rate);
    }, 0);

    let discount = 0;
    const discountVal = parseFloat(this.state.discountValue) || 0;
    if (this.state.discountType === 'percent') {
      discount = (subtotal * discountVal) / 100;
    } else {
      discount = discountVal;
    }
    discount = Math.min(discount, subtotal);

    const afterDiscount = Math.max(0, subtotal - discount);

    const taxRate = parseFloat(this.state.taxRate) || 0;
    const taxAmount = (afterDiscount * taxRate) / 100;

    const shipping = parseFloat(this.state.shippingFee) || 0;

    const grandTotal = afterDiscount + taxAmount + shipping;
    const amountPaid = parseFloat(this.state.amountPaid) || 0;
    const balanceDue = Math.max(0, grandTotal - amountPaid);

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

  formatMoney(amount) {
    const cur = CURRENCIES[this.state.currency] || CURRENCIES.USD;
    const formatted = Math.abs(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return cur.position === 'before' ? `${cur.symbol}${formatted}` : `${formatted} ${cur.symbol}`;
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

  loadSample() {
    this.state = JSON.parse(JSON.stringify(SAMPLE_INVOICE));
    this.notify();
  }

  clear() {
    this.state = JSON.parse(JSON.stringify(BLANK_INVOICE));
    this.state.date = getTodayDateString();
    this.notify();
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
