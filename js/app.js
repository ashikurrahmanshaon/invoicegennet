/* ==========================================================================
   APPLICATION CONTROLLER & DOM INTERACTION
   Pure Professional Client-Side Invoice Generator
   Header Quick Tools, Auth Modal, Sidebar Customizer & Multiple Styles
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const store = window.invoiceStore;

  // DOM Elements - Document Header
  const invoiceTitleHeading = document.getElementById('invoiceTitleHeading');
  const invoiceNumberInput = document.getElementById('invoiceNumber');
  const invoiceDateInput = document.getElementById('invoiceDate');
  const dueDateInput = document.getElementById('dueDateInput');
  const paymentTermsSelect = document.getElementById('paymentTerms');
  const poNumberInput = document.getElementById('poNumber');

  // DOM Elements - Sender
  const senderName = document.getElementById('senderName');
  const senderAddress = document.getElementById('senderAddress');

  // DOM Elements - Client & Shipping
  const clientName = document.getElementById('clientName');
  const clientAddress = document.getElementById('clientAddress');
  const shipToCardPanel = document.getElementById('shipToCardPanel');
  const shipToName = document.getElementById('shipToName');
  const shipToAddress = document.getElementById('shipToAddress');

  // DOM Elements - Logo
  const btnUploadLogo = document.getElementById('btnUploadLogo');
  const logoFileInput = document.getElementById('logoFileInput');
  const logoPreviewBox = document.getElementById('logoPreviewBox');
  const logoImg = document.getElementById('logoImg');
  const btnRemoveLogo = document.getElementById('btnRemoveLogo');

  // DOM Elements - Table
  const itemsTableBody = document.getElementById('itemsTableBody');
  const btnAddItem = document.getElementById('btnAddItem');

  // DOM Elements - Notes & Tax & Calculations
  const invoiceNotes = document.getElementById('invoiceNotes');
  const taxRateInput = document.getElementById('taxRate');
  const discountRateInput = document.getElementById('discountRate');
  const discountLineRow = document.getElementById('discountLineRow');
  const discountAmountDisplay = document.getElementById('discountAmountDisplay');
  const amountPaidInput = document.getElementById('amountPaidInput');
  const amountPaidLineRow = document.getElementById('amountPaidLineRow');
  const signatureBlockWrap = document.getElementById('signatureBlockWrap');
  const signatureInput = document.getElementById('signatureInput');

  // DOM Elements - Calculation Displays
  const subtotalDisplay = document.getElementById('subtotalDisplay');
  const taxAmountDisplay = document.getElementById('taxAmountDisplay');
  const grandTotalDisplay = document.getElementById('grandTotalDisplay');
  const balanceDueDisplay = document.getElementById('balanceDueDisplay');

  // DOM Elements - Invoice Paper Sheet
  const invoicePaper = document.getElementById('invoicePaper');

  // DOM Elements - Header & Mobile Navigation
  const btnHeaderLogin = document.getElementById('btnHeaderLogin');
  const btnHeaderSignup = document.getElementById('btnHeaderSignup');
  const btnMobileNavToggle = document.getElementById('btnMobileNavToggle');
  const mobileNavDrawer = document.getElementById('mobileNavDrawer');
  const btnMobileLogin = document.getElementById('btnMobileLogin');
  const btnMobileSignup = document.getElementById('btnMobileSignup');

  // DOM Elements - Sidebar Controls
  const btnDownloadPDF = document.getElementById('btnDownloadPDF');
  const btnPrintSidebar = document.getElementById('btnPrintSidebar');
  const btnOpenSendEmail = document.getElementById('btnOpenSendEmail');
  const currencySelect = document.getElementById('currencySelector');
  const btnLoadSample = document.getElementById('btnLoadSample');
  const btnClearInvoice = document.getElementById('btnClearInvoice');

  // DOM Elements - Sidebar Customizer (Theme Palette)
  const themePalettePills = document.querySelectorAll('.theme-palette-pill, .style-pill-btn, .color-swatch');

  // DOM Elements - Sidebar Document Field Toggles
  const toggleShipTo = document.getElementById('toggleShipTo');
  const togglePoNumber = document.getElementById('togglePoNumber');
  const toggleDueDate = document.getElementById('toggleDueDate');
  const toggleDiscount = document.getElementById('toggleDiscount');
  const toggleAmountPaid = document.getElementById('toggleAmountPaid');
  const toggleSignature = document.getElementById('toggleSignature');
  const poFieldRows = document.querySelectorAll('.po-field-row');
  const dueDateFieldRows = document.querySelectorAll('.due-date-field-row');

  // DOM Elements - Auth Modal
  const authModal = document.getElementById('authModal');
  const btnCloseAuthModal = document.getElementById('btnCloseAuthModal');
  const authModalTitle = document.getElementById('authModalTitle');
  const authModalSub = document.getElementById('authModalSub');
  const btnAuthSubmit = document.getElementById('btnAuthSubmit');
  const authToggleText = document.getElementById('authToggleText');
  const authToggleAction = document.getElementById('authToggleAction');
  const btnGoogleAuth = document.getElementById('btnGoogleAuth');
  const authEmailInput = document.getElementById('authEmail');

  // DOM Elements - Send Email Modal
  const sendEmailModal = document.getElementById('sendEmailModal');
  const btnCloseSendEmail = document.getElementById('btnCloseSendEmail');
  const sendEmailForm = document.getElementById('sendEmailForm');
  const clientSendEmail = document.getElementById('clientSendEmail');
  const emailSubject = document.getElementById('emailSubject');
  const emailMessage = document.getElementById('emailMessage');

  // Track Auth Modal Mode ('login' or 'signup')
  let currentAuthMode = 'login';

  // ---------------------------------------------------------------------------
  // 1. Sync UI from State
  // ---------------------------------------------------------------------------
  function syncUIFromState(state) {
    if (invoiceTitleHeading) invoiceTitleHeading.value = state.title || 'INVOICE';
    if (invoiceNumberInput) invoiceNumberInput.value = state.number || '';
    if (invoiceDateInput) invoiceDateInput.value = state.date || '';
    if (dueDateInput) dueDateInput.value = state.dueDate || '';
    if (paymentTermsSelect) paymentTermsSelect.value = state.paymentTerms || 'Due on Receipt';
    if (poNumberInput) poNumberInput.value = state.poNumber || '';

    // Sender
    if (senderName) senderName.value = state.sender?.name || '';
    if (senderAddress) senderAddress.value = state.sender?.address || '';

    // Client
    if (clientName) clientName.value = state.client?.name || '';
    if (clientAddress) clientAddress.value = state.client?.address || '';

    // Shipping
    if (shipToName) shipToName.value = state.shipTo?.name || '';
    if (shipToAddress) shipToAddress.value = state.shipTo?.address || '';

    // Notes & Signature
    if (invoiceNotes) invoiceNotes.value = state.notes || '';
    if (signatureInput && state.signature) signatureInput.value = state.signature;

    // Tax & Discount & Amount Paid
    if (taxRateInput) taxRateInput.value = state.taxRate ?? 0;
    if (discountRateInput) discountRateInput.value = state.discountValue ?? 0;
    if (amountPaidInput) amountPaidInput.value = state.amountPaid ? state.amountPaid : '';

    // Auto-fill from saved business profile if current sender fields are blank
    if (!state.sender?.name) {
      try {
        const rawProfile = localStorage.getItem('invoicegen_business_profile');
        if (rawProfile) {
          const bp = JSON.parse(rawProfile);
          if (bp.businessName && senderName) {
            senderName.value = bp.businessName;
            state.sender.name = bp.businessName;
          }
          if (bp.address && senderAddress) {
            senderAddress.value = bp.address;
            state.sender.address = bp.address;
          }
          if (bp.notes && invoiceNotes && !state.notes) {
            invoiceNotes.value = bp.notes;
            state.notes = bp.notes;
          }
        }
      } catch (e) {}
    }

    // Currency
    if (currencySelect) currencySelect.value = state.currency || 'USD';

    // Logo
    if (state.logo) {
      if (logoImg) logoImg.src = state.logo;
      if (logoPreviewBox) logoPreviewBox.style.display = 'block';
      if (btnUploadLogo) btnUploadLogo.style.display = 'none';
    } else {
      if (logoPreviewBox) logoPreviewBox.style.display = 'none';
      if (btnUploadLogo) btnUploadLogo.style.display = 'inline-flex';
    }

    // Line items
    renderItems(state.items || []);

    // Totals
    updateCalculations();
  }

  // ---------------------------------------------------------------------------
  // 2. Render Line Items Table
  // ---------------------------------------------------------------------------
  function renderItems(items) {
    if (!itemsTableBody) return;
    itemsTableBody.innerHTML = '';

    items.forEach((item) => {
      const row = document.createElement('tr');
      row.className = 'item-row';
      row.dataset.id = item.id;

      const itemTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);

      row.innerHTML = `
        <td>
          <input type="text" class="table-input-field item-desc-field" placeholder="e.g. Website Development / Consulting service" value="${escapeHtml(item.description || '')}">
        </td>
        <td>
          <input type="number" min="0" step="any" class="table-input-field item-qty-field" style="text-align: right;" value="${item.quantity}">
        </td>
        <td>
          <input type="number" min="0" step="0.01" class="table-input-field item-rate-field" style="text-align: right;" value="${item.rate}">
        </td>
        <td class="table-amount-val item-amount-col">
          ${store.formatMoney(itemTotal)}
        </td>
        <td class="col-action">
          <button type="button" class="btn-trash-row" title="Delete Row" data-id="${item.id}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </td>
      `;

      const descInput = row.querySelector('.item-desc-field');
      const qtyInput = row.querySelector('.item-qty-field');
      const rateInput = row.querySelector('.item-rate-field');
      const deleteBtn = row.querySelector('.btn-trash-row');

      descInput.addEventListener('input', (e) => store.updateItem(item.id, 'description', e.target.value));
      qtyInput.addEventListener('input', (e) => {
        store.updateItem(item.id, 'quantity', e.target.value);
        updateRowTotal(row, item.id);
      });
      rateInput.addEventListener('input', (e) => {
        store.updateItem(item.id, 'rate', e.target.value);
        updateRowTotal(row, item.id);
      });
      deleteBtn.addEventListener('click', () => {
        store.removeItem(item.id);
      });

      itemsTableBody.appendChild(row);
    });
  }

  function updateRowTotal(row, itemId) {
    const item = store.getState().items.find(it => it.id == itemId);
    if (!item) return;
    const total = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
    const displayEl = row.querySelector('.item-amount-col');
    if (displayEl) {
      displayEl.textContent = store.formatMoney(total);
    }
  }

  function updateCalculations() {
    const totals = store.calculateTotals();

    if (subtotalDisplay) subtotalDisplay.textContent = store.formatMoney(totals.subtotal);
    if (discountAmountDisplay) discountAmountDisplay.textContent = `-${store.formatMoney(totals.discount)}`;
    if (taxAmountDisplay) taxAmountDisplay.textContent = store.formatMoney(totals.taxAmount);
    if (grandTotalDisplay) grandTotalDisplay.textContent = store.formatMoney(totals.grandTotal);
    if (balanceDueDisplay) balanceDueDisplay.textContent = store.formatMoney(totals.balanceDue);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Subscribe to store updates
  store.subscribe(() => {
    updateCalculations();
  });

  // Attach two-way bindings
  const setupInputBinding = (el, path) => {
    if (!el) return;
    el.addEventListener('input', (e) => {
      store.updateState(path, e.target.value);
    });
  };

  setupInputBinding(invoiceTitleHeading, 'title');
  setupInputBinding(invoiceNumberInput, 'number');
  setupInputBinding(invoiceDateInput, 'date');
  setupInputBinding(dueDateInput, 'dueDate');
  if (paymentTermsSelect) {
    paymentTermsSelect.addEventListener('change', (e) => {
      store.updateState('paymentTerms', e.target.value);
    });
  }
  setupInputBinding(poNumberInput, 'poNumber');

  setupInputBinding(senderName, 'sender.name');
  setupInputBinding(senderAddress, 'sender.address');
  setupInputBinding(clientName, 'client.name');
  setupInputBinding(clientAddress, 'client.address');
  setupInputBinding(shipToName, 'shipTo.name');
  setupInputBinding(shipToAddress, 'shipTo.address');
  setupInputBinding(invoiceNotes, 'notes');
  setupInputBinding(signatureInput, 'signature');

  if (taxRateInput) {
    taxRateInput.addEventListener('input', (e) => {
      store.updateState('taxRate', parseFloat(e.target.value) || 0);
      updateCalculations();
    });
  }

  if (discountRateInput) {
    discountRateInput.addEventListener('input', (e) => {
      store.updateState('discountValue', parseFloat(e.target.value) || 0);
      updateCalculations();
    });
  }

  if (amountPaidInput) {
    amountPaidInput.addEventListener('input', (e) => {
      store.updateState('amountPaid', parseFloat(e.target.value) || 0);
      updateCalculations();
    });
  }

  // ---------------------------------------------------------------------------
  // 3. Add Item Button
  // ---------------------------------------------------------------------------
  if (btnAddItem) {
    btnAddItem.addEventListener('click', () => {
      store.addItem('', 1, 0);
      renderItems(store.getState().items);
      const rows = itemsTableBody.querySelectorAll('.item-row');
      if (rows.length > 0) {
        const lastRowDesc = rows[rows.length - 1].querySelector('.item-desc-field');
        if (lastRowDesc) lastRowDesc.focus();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 4. Currency Selector (Sidebar)
  // ---------------------------------------------------------------------------
  if (currencySelect) {
    currencySelect.addEventListener('change', (e) => {
      store.setCurrency(e.target.value);
      renderItems(store.getState().items);
      updateCalculations();
      if (window.pdfEngine) window.pdfEngine.showToast(`Currency changed to ${e.target.value}`);
    });
  }

  // ---------------------------------------------------------------------------
  // 5. Logo Upload & Removal
  // ---------------------------------------------------------------------------
  if (btnUploadLogo && logoFileInput) {
    btnUploadLogo.addEventListener('click', () => logoFileInput.click());
    logoFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          store.setLogo(event.target.result);
          if (logoImg) logoImg.src = event.target.result;
          if (logoPreviewBox) logoPreviewBox.style.display = 'block';
          if (btnUploadLogo) btnUploadLogo.style.display = 'none';
          if (window.pdfEngine) window.pdfEngine.showToast('Company logo attached!');
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (btnRemoveLogo) {
    btnRemoveLogo.addEventListener('click', () => {
      store.removeLogo();
      if (logoPreviewBox) logoPreviewBox.style.display = 'none';
      if (btnUploadLogo) btnUploadLogo.style.display = 'inline-flex';
      if (logoFileInput) logoFileInput.value = '';
      if (window.pdfEngine) window.pdfEngine.showToast('Logo removed');
    });
  }

  // ---------------------------------------------------------------------------
  // 6. Primary PDF Export & Print Actions
  // ---------------------------------------------------------------------------
  const handleDownload = () => {
    if (window.pdfEngine) {
      window.pdfEngine.downloadPDF();
    }
    // Record to saved invoices in localStorage for Dashboard visibility
    try {
      const state = store.getState();
      const totals = store.calculateTotals();
      const rawInvoices = localStorage.getItem('invoicegen_invoices');
      let invoices = rawInvoices ? JSON.parse(rawInvoices) : [];
      const curSymbol = CURRENCIES[state.currency]?.symbol || '$';
      const invRecord = {
        id: 'inv-' + Date.now(),
        number: `INV-${state.number || '001'}`,
        clientName: state.client?.name || 'Client',
        clientEmail: state.client?.email || '',
        issueDate: state.date || 'Today',
        dueDate: state.dueDate || 'Upon Receipt',
        amount: totals.grandTotal || 0,
        currency: state.currency || 'USD',
        currencySymbol: curSymbol,
        status: totals.balanceDue <= 0 ? 'paid' : 'pending'
      };
      const existingIdx = invoices.findIndex(i => i.number === invRecord.number);
      if (existingIdx >= 0) {
        invoices[existingIdx] = { ...invoices[existingIdx], ...invRecord };
      } else {
        invoices.unshift(invRecord);
      }
      localStorage.setItem('invoicegen_invoices', JSON.stringify(invoices));
    } catch (e) {}
  };

  const handlePrint = () => {
    window.print();
  };

  const handleNewInvoice = () => {
    if (confirm('Create a fresh new invoice? Current unsaved entries will be reset.')) {
      store.clear();
      syncUIFromState(store.getState());
      if (window.pdfEngine) window.pdfEngine.showToast('New blank invoice ready!');
    }
  };

  // Sidebar actions
  if (btnDownloadPDF) btnDownloadPDF.addEventListener('click', handleDownload);
  if (btnPrintSidebar) btnPrintSidebar.addEventListener('click', handlePrint);

  // Demo Sample & Reset in Sidebar
  if (btnLoadSample) {
    btnLoadSample.addEventListener('click', () => {
      store.loadSample();
      syncUIFromState(store.getState());
      if (window.pdfEngine) window.pdfEngine.showToast('Sample invoice loaded!');
    });
  }

  if (btnClearInvoice) {
    btnClearInvoice.addEventListener('click', handleNewInvoice);
  }

  // ---------------------------------------------------------------------------
  // 7. Sidebar Style & Theme Customizer
  // ---------------------------------------------------------------------------
  function applyTheme(themeName) {
    if (!invoicePaper) return;

    // Remove all previous theme classes
    invoicePaper.classList.remove('theme-emerald', 'theme-navy', 'theme-charcoal', 'theme-indigo');

    if (themeName !== 'emerald') {
      invoicePaper.classList.add(`theme-${themeName}`);
    }

    // Sync active theme pills
    themePalettePills.forEach(btn => {
      if (btn.dataset.style === themeName || btn.dataset.color === themeName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const displayName = themeName.charAt(0).toUpperCase() + themeName.slice(1);
    if (window.pdfEngine) window.pdfEngine.showToast(`Applied ${displayName} invoice style`);
  }

  themePalettePills.forEach(btn => {
    btn.addEventListener('click', () => {
      const style = btn.dataset.style || btn.dataset.color || 'emerald';
      applyTheme(style);
    });
  });

  // ---------------------------------------------------------------------------
  // 8. Sidebar Document Field Toggles
  // ---------------------------------------------------------------------------
  if (toggleShipTo) {
    toggleShipTo.addEventListener('change', (e) => {
      if (shipToCardPanel) {
        shipToCardPanel.style.display = e.target.checked ? 'block' : 'none';
      }
    });
  }

  if (togglePoNumber) {
    togglePoNumber.addEventListener('change', (e) => {
      poFieldRows.forEach(el => {
        el.style.display = e.target.checked ? 'inline-block' : 'none';
      });
    });
  }

  if (toggleDueDate) {
    toggleDueDate.addEventListener('change', (e) => {
      dueDateFieldRows.forEach(el => {
        el.style.display = e.target.checked ? 'inline-block' : 'none';
      });
    });
  }

  if (toggleDiscount) {
    toggleDiscount.addEventListener('change', (e) => {
      if (discountLineRow) {
        discountLineRow.style.display = e.target.checked ? 'flex' : 'none';
      }
    });
  }

  if (toggleAmountPaid) {
    toggleAmountPaid.addEventListener('change', (e) => {
      if (amountPaidLineRow) {
        amountPaidLineRow.style.display = e.target.checked ? 'flex' : 'none';
      }
    });
  }

  if (toggleSignature) {
    toggleSignature.addEventListener('change', (e) => {
      if (signatureBlockWrap) {
        signatureBlockWrap.style.display = e.target.checked ? 'block' : 'none';
      }
    });
  }

  // Mobile Navigation Drawer Toggle
  if (btnMobileNavToggle && mobileNavDrawer) {
    btnMobileNavToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      mobileNavDrawer.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!mobileNavDrawer.contains(e.target) && !btnMobileNavToggle.contains(e.target)) {
        mobileNavDrawer.classList.remove('active');
      }
    });
  }

  if (btnMobileLogin) {
    btnMobileLogin.addEventListener('click', () => {
      if (mobileNavDrawer) mobileNavDrawer.classList.remove('active');
      openAuthModal('login');
    });
  }

  if (btnMobileSignup) {
    btnMobileSignup.addEventListener('click', () => {
      if (mobileNavDrawer) mobileNavDrawer.classList.remove('active');
      openAuthModal('signup');
    });
  }

  // ---------------------------------------------------------------------------
  // 9. Auth Modal (Log In / Sign Up Free)
  // ---------------------------------------------------------------------------
  function openAuthModal(mode = 'login') {
    if (!authModal) return;
    currentAuthMode = mode;

    if (mode === 'signup') {
      if (authModalTitle) authModalTitle.textContent = 'Create Free Account';
      if (authModalSub) authModalSub.textContent = 'Start generating unlimited professional invoices';
      if (btnAuthSubmit) btnAuthSubmit.textContent = 'Create Free Account';
      if (authToggleText) authToggleText.textContent = 'Already have an account?';
      if (authToggleAction) authToggleAction.textContent = 'Log In';
    } else {
      if (authModalTitle) authModalTitle.textContent = 'Welcome to InvoiceGen';
      if (authModalSub) authModalSub.textContent = 'Sign in to access advanced tools and templates';
      if (btnAuthSubmit) btnAuthSubmit.textContent = 'Sign In';
      if (authToggleText) authToggleText.textContent = "Don't have an account?";
      if (authToggleAction) authToggleAction.textContent = 'Sign Up Free';
    }

    authModal.classList.add('active');
    if (authEmailInput) setTimeout(() => authEmailInput.focus(), 150);
  }

  function closeAuthModal() {
    if (authModal) authModal.classList.remove('active');
  }

  // Notice: btnHeaderLogin and btnHeaderSignup are direct links to login.html and signup.html

  if (btnCloseAuthModal) {
    btnCloseAuthModal.addEventListener('click', closeAuthModal);
  }

  if (authToggleAction) {
    authToggleAction.addEventListener('click', (e) => {
      e.preventDefault();
      openAuthModal(currentAuthMode === 'login' ? 'signup' : 'login');
    });
  }

  function syncLoggedInUser() {
    try {
      const stored = localStorage.getItem('invoicegen_user');
      if (stored) {
        const user = JSON.parse(stored);
        // Strictly purge any legacy demo / mock accounts
        if (!user || !user.email || user.isDemo || user.email === 'user@company.com' || user.email === 'google.user@gmail.com' || user.email.includes('alex.') || user.email.includes('sarah.')) {
          localStorage.removeItem('invoicegen_user');
          return;
        }

        const firstName = user.name ? user.name.split(' ')[0] : 'User';
        if (btnHeaderLogin) {
          btnHeaderLogin.textContent = `Dashboard (${firstName})`;
          btnHeaderLogin.href = 'dashboard.html';
          btnHeaderLogin.title = `Signed in as ${user.email} (Open Dashboard)`;
          btnHeaderLogin.onclick = null;
        }
        if (btnHeaderSignup) btnHeaderSignup.style.display = 'none';
        if (btnMobileLogin) {
          btnMobileLogin.textContent = `Dashboard (${firstName})`;
          btnMobileLogin.href = 'dashboard.html';
          btnMobileLogin.onclick = null;
        }
        if (btnMobileSignup) btnMobileSignup.style.display = 'none';
      }
    } catch (e) {}
  }
  syncLoggedInUser();

  if (btnGoogleAuth) {
    btnGoogleAuth.addEventListener('click', () => {
      if (typeof window.triggerGoogleLogin === 'function') {
        window.triggerGoogleLogin();
      } else {
        window.location.href = 'login.html';
      }
    });
  }

  window.handleAuthSubmit = function () {
    const email = authEmailInput ? authEmailInput.value.trim() : '';
    if (!email) {
      if (window.pdfEngine) window.pdfEngine.showToast('Please enter your email', 'warning');
      return;
    }
    localStorage.setItem('invoicegen_user', JSON.stringify({ email: email, name: email.split('@')[0] }));
    closeAuthModal();
    const actionText = currentAuthMode === 'signup' ? 'Account created' : 'Welcome back';
    if (window.pdfEngine) window.pdfEngine.showToast(`${actionText}! Signed in as ${email}`);
    syncLoggedInUser();
  };

  // Close modal when clicking on backdrop
  if (authModal) {
    authModal.addEventListener('click', (e) => {
      if (e.target === authModal) closeAuthModal();
    });
  }

  // ---------------------------------------------------------------------------
  // 10. Send via Email Modal
  // ---------------------------------------------------------------------------
  function openSendEmailModal() {
    if (!sendEmailModal) return;
    const state = store.getState();
    const totals = store.calculateTotals();

    if (clientSendEmail && state.client?.email) {
      clientSendEmail.value = state.client.email;
    }
    if (emailSubject) {
      emailSubject.value = `Invoice #${state.number || '001'} from ${state.sender?.name || 'InvoiceGen'}`;
    }
    if (emailMessage) {
      emailMessage.value = `Hi ${state.client?.name || 'there'},\n\nPlease find attached invoice #${state.number || '001'} for ${store.formatMoney(totals.balanceDue)}. Due: ${state.date || 'Upon Receipt'}.\n\nThank you for your business!`;
    }

    sendEmailModal.classList.add('active');
  }

  function closeSendEmailModal() {
    if (sendEmailModal) sendEmailModal.classList.remove('active');
  }

  if (btnOpenSendEmail) {
    btnOpenSendEmail.addEventListener('click', openSendEmailModal);
  }

  if (btnCloseSendEmail) {
    btnCloseSendEmail.addEventListener('click', closeSendEmailModal);
  }

  if (sendEmailModal) {
    sendEmailModal.addEventListener('click', (e) => {
      if (e.target === sendEmailModal) closeSendEmailModal();
    });
  }

  window.handleSendEmailSubmit = function () {
    const recipient = clientSendEmail ? encodeURIComponent(clientSendEmail.value) : '';
    const subject = emailSubject ? encodeURIComponent(emailSubject.value) : '';
    const body = emailMessage ? encodeURIComponent(emailMessage.value) : '';

    closeSendEmailModal();
    if (window.pdfEngine) window.pdfEngine.showToast('Preparing email client with invoice details...');

    // Open native mailto
    const mailtoLink = `mailto:${recipient}?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;
  };

  // ---------------------------------------------------------------------------
  // 11. Initial State Render & Query Parameter Check
  // ---------------------------------------------------------------------------
  syncUIFromState(store.getState());

  // Check if a template was chosen from templates.html (e.g., ?template=corporate)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const requestedTemplate = urlParams.get('template');
    if (requestedTemplate && requestedTemplate !== 'emerald') {
      const stored = localStorage.getItem('invoicegen_user');
      let isValidUser = false;
      if (stored) {
        const u = JSON.parse(stored);
        if (u && u.email && !u.isDemo && u.email !== 'user@company.com' && u.email !== 'google.user@gmail.com' && !u.email.includes('alex.') && !u.email.includes('sarah.')) {
          isValidUser = true;
        }
      }
      if (!isValidUser) {
        // Not logged in! Redirect to login page
        window.location.href = `login.html?redirect=templates&template=${requestedTemplate}`;
      } else {
        applyTheme(requestedTemplate);
      }
    } else if (requestedTemplate === 'emerald') {
      applyTheme('emerald');
    }
  } catch (e) {
    // Ignore URL parsing errors
  }
});
