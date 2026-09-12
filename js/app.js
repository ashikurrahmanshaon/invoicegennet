/* ==========================================================================
   APPLICATION CONTROLLER & DOM INTERACTION
   Pure Professional Client-Side Invoice Generator
   Header Quick Tools, Auth Modal, Sidebar Customizer & Multiple Styles
   ========================================================================== */

window.initInvoiceEditorPage = function () {
  if (!document.getElementById('invoicePaper')) return;
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

  // DOM Elements - Live Preview Modal
  const btnPreviewInvoice = document.getElementById('btnPreviewInvoice');
  const previewModal = document.getElementById('previewModal');
  const previewModalBody = document.getElementById('previewModalBody');
  const btnClosePreviewModal = document.getElementById('btnClosePreviewModal');
  const btnPreviewPrint = document.getElementById('btnPreviewPrint');
  const btnPreviewDownload = document.getElementById('btnPreviewDownload');

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

    // Sync adaptive Ship To column
    const billingRow = document.getElementById('sheetBillingRow');
    if (billingRow && toggleShipTo) {
      billingRow.classList.toggle('ship-to-hidden', !toggleShipTo.checked);
    }

    // Sync Balance Due and Amount Paid rows
    const balDueRow = document.getElementById('balanceDueLineRow');
    const hasAmtPaid = toggleAmountPaid ? toggleAmountPaid.checked : false;
    if (amountPaidLineRow) amountPaidLineRow.style.display = hasAmtPaid ? 'flex' : 'none';
    if (balDueRow) balDueRow.style.display = hasAmtPaid ? 'flex' : 'none';

    // Totals
    updateCalculations();
  }

  // ---------------------------------------------------------------------------
  // Debounced Auto-Save for Drafts
  // ---------------------------------------------------------------------------
  let autoSaveTimer = null;
  function triggerAutoSaveDebounced() {
    if (!activeInvoiceId) return;
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      autoSaveDraftSilently();
    }, 2000);
  }

  async function autoSaveDraftSilently() {
    if (!activeInvoiceId) return;
    try {
      const payload = buildInvoicePayload('draft');
      const errs = validateInvoice(payload);
      if (errs.length > 0) return;

      const res = await fetch(`/api/invoices/${activeInvoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        if (btnSaveInvoiceText && !btnSaveInvoiceText.textContent.includes('...')) {
          const original = btnSaveInvoiceText.textContent;
          btnSaveInvoiceText.textContent = 'Saved (Draft)';
          setTimeout(() => {
            if (btnSaveInvoiceText) btnSaveInvoiceText.textContent = original;
          }, 1500);
        }
      }
    } catch (e) {}
  }

  // Helper to build a single row element with bound event handlers
  function createRowElement(item, isNew = false) {
    const row = document.createElement('tr');
    row.className = isNew ? 'item-row row-new' : 'item-row';
    row.dataset.id = item.id;

    const itemTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);

    row.innerHTML = `
      <td class="col-desc">
        <input type="text" class="table-input-field item-desc-field item-desc-input" placeholder="e.g. Website Design &amp; Consulting" value="${escapeHtml(item.description || '')}" aria-label="Item description">
      </td>
      <td class="col-qty">
        <input type="number" min="0" step="any" class="table-input-field item-qty-field item-qty-input" style="text-align: right;" value="${item.quantity !== undefined && item.quantity !== '' ? item.quantity : 1}" placeholder="1" aria-label="Quantity">
      </td>
      <td class="col-rate">
        <input type="number" min="0" step="0.01" class="table-input-field item-rate-field item-rate-input" style="text-align: right;" value="${item.rate !== undefined && item.rate !== 0 ? item.rate : (item.rate === 0 && !item.description ? '' : item.rate)}" placeholder="0.00" aria-label="Rate or unit price">
      </td>
      <td class="col-amount">
        <div class="table-amount-val item-amount-col">${store.formatMoney(itemTotal)}</div>
      </td>
      <td class="col-action">
        <button type="button" class="btn-trash-row" title="Delete Row" data-id="${item.id}" aria-label="Delete line item">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </td>
    `;

    const descInput = row.querySelector('.item-desc-field, .item-desc-input');
    const qtyInput = row.querySelector('.item-qty-field, .item-qty-input');
    const rateInput = row.querySelector('.item-rate-field, .item-rate-input');
    const deleteBtn = row.querySelector('.btn-trash-row');

    descInput.addEventListener('input', (e) => {
      store.updateItem(item.id, 'description', e.target.value);
      triggerAutoSaveDebounced();
    });

    qtyInput.addEventListener('input', (e) => {
      const qVal = e.target.value === '' ? '' : (parseFloat(e.target.value) || 0);
      store.updateItem(item.id, 'quantity', qVal);
      updateRowTotal(row, item.id);
      updateCalculations();
      triggerAutoSaveDebounced();
    });

    rateInput.addEventListener('input', (e) => {
      const rVal = e.target.value === '' ? '' : (parseFloat(e.target.value) || 0);
      store.updateItem(item.id, 'rate', rVal);
      updateRowTotal(row, item.id);
      updateCalculations();
      triggerAutoSaveDebounced();
    });

    // Pressing Enter in Rate adds next row and focuses description
    rateInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addNewRowAndFocus();
      }
    });

    const handleDelete = () => {
      const allItems = store.getState().items || [];
      if (allItems.length <= 1) {
        store.removeItem(item.id);
        renderItems(store.getState().items);
        updateCalculations();
        triggerAutoSaveDebounced();
      } else {
        row.classList.add('row-fade-out');
        setTimeout(() => {
          store.removeItem(item.id);
          row.remove();
          updateCalculations();
          triggerAutoSaveDebounced();
        }, 140);
      }
    };

    deleteBtn.addEventListener('click', handleDelete);
    deleteBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleDelete();
      }
    });

    return row;
  }

  // Helper to add empty line item and focus description smoothly
  function addNewRowAndFocus() {
    const newId = store.addItem('', 1, 0);
    const stateItems = store.getState().items || [];
    const newItem = stateItems.find(it => it.id === newId) || { id: newId, description: '', quantity: 1, rate: 0 };
    if (itemsTableBody) {
      const row = createRowElement(newItem, true);
      itemsTableBody.appendChild(row);
      const descInput = row.querySelector('.item-desc-field, .item-desc-input');
      if (descInput) {
        descInput.focus();
      }
    }
    updateCalculations();
    triggerAutoSaveDebounced();
  }

  // ---------------------------------------------------------------------------
  // 2. Render Line Items Table
  // ---------------------------------------------------------------------------
  function renderItems(items) {
    if (!itemsTableBody) return;
    itemsTableBody.innerHTML = '';

    items.forEach((item) => {
      itemsTableBody.appendChild(createRowElement(item, false));
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
    btnAddItem.addEventListener('click', addNewRowAndFocus);
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

  const btnReplaceLogo = document.getElementById('btnReplaceLogo');
  if (btnReplaceLogo && logoFileInput) {
    btnReplaceLogo.addEventListener('click', (e) => {
      e.stopPropagation();
      logoFileInput.click();
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

    // Log PDF download activity if logged in
    try {
      fetch('/api/activities/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'invoice_downloaded',
          description: `Downloaded PDF for invoice #${store.getState()?.number || '001'}`,
          entityType: 'invoice',
          entityId: activeInvoiceId || ''
        })
      }).catch(() => {});
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

  // DOM Elements - Save Actions
  const btnSaveInvoice = document.getElementById('btnSaveInvoice');
  const btnSaveInvoiceText = document.getElementById('btnSaveInvoiceText');
  const btnSaveDraft = document.getElementById('btnSaveDraft');
  let activeInvoiceId = null;

  function buildInvoicePayload(targetStatus = 'draft') {
    const rows = document.querySelectorAll('#itemsTableBody .item-row');
    const items = [];
    rows.forEach((r, idx) => {
      const descInput = r.querySelector('.item-desc-field, .item-desc-input');
      const subInput = r.querySelector('.item-subtext-field, .item-subtext-input');
      const qtyInput = r.querySelector('.item-qty-field, .item-qty-input');
      const rateInput = r.querySelector('.item-rate-field, .item-rate-input');
      const q = parseFloat(qtyInput?.value) || 0;
      const rt = parseFloat(rateInput?.value) || 0;
      items.push({
        id: r.dataset.id || (Date.now() + idx),
        description: descInput?.value.trim() || '',
        subtext: subInput?.value.trim() || '',
        quantity: q,
        rate: rt,
        amount: q * rt
      });
    });

    if (items.length > 0) {
      store.getState().items = items;
    }
    const totals = store.calculateTotals();
    const activeTheme = invoicePaper ? (invoicePaper.className.match(/theme-(\w+)/)?.[1] || 'emerald') : 'emerald';

    return {
      id: activeInvoiceId || undefined,
      number: invoiceNumberInput?.value.trim() || 'INV-001',
      status: targetStatus,
      date: invoiceDateInput?.value || '',
      dueDate: dueDateInput?.value || '',
      currency: currencySelect?.value || 'USD',
      currencySymbol: (CURRENCIES[currencySelect?.value || 'USD'] || {}).symbol || '$',
      poNumber: poNumberInput?.value || '',
      paymentTerms: paymentTermsSelect?.value || 'Due on Receipt',
      sender: {
        name: senderName?.value || '',
        address: senderAddress?.value || ''
      },
      client: {
        name: clientName?.value || '',
        address: clientAddress?.value || ''
      },
      shipTo: {
        enabled: toggleShipTo ? toggleShipTo.checked : false,
        name: shipToName?.value || '',
        address: shipToAddress?.value || ''
      },
      notes: invoiceNotes?.value || '',
      items: items.length > 0 ? items : [{ description: 'General Services', quantity: 1, rate: 0, amount: 0 }],
      subtotal: totals.subtotal,
      taxRate: parseFloat(taxRateInput?.value) || 0,
      taxAmount: totals.taxAmount,
      discountType: 'percent',
      discountValue: parseFloat(discountRateInput?.value) || 0,
      discountAmount: totals.discount,
      amountPaid: totals.amountPaid,
      total: totals.grandTotal,
      balanceDue: totals.balanceDue,
      template: activeTheme
    };
  }

  function validateInvoice(payload) {
    const errors = [];
    if (!payload.number || !payload.number.trim()) {
      errors.push('Invoice number is required.');
    }
    if (isNaN(payload.taxRate) || payload.taxRate < 0) {
      errors.push('Tax percentage must be a valid number >= 0.');
    }
    if (isNaN(payload.discountValue) || payload.discountValue < 0) {
      errors.push('Discount percentage must be a valid number >= 0.');
    }
    if (isNaN(payload.amountPaid) || payload.amountPaid < 0) {
      errors.push('Amount paid must be a valid number >= 0.');
    }
    if (payload.client?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.client.email.trim())) {
      errors.push('Client email address is invalid.');
    }
    if (!payload.items || payload.items.length === 0) {
      errors.push('Invoice must contain at least one line item.');
    } else {
      payload.items.forEach((item, index) => {
        const rowNum = index + 1;
        if (isNaN(item.quantity) || parseFloat(item.quantity) < 0) {
          errors.push(`Row ${rowNum}: Quantity must be numeric and >= 0.`);
        }
        if (isNaN(item.rate) || parseFloat(item.rate) < 0) {
          errors.push(`Row ${rowNum}: Rate must be numeric and >= 0.`);
        }
      });
    }
    return errors;
  }

  async function handleSaveInvoice(targetStatus = 'pending') {
    const btn = targetStatus === 'draft' ? btnSaveDraft : btnSaveInvoice;
    const origHtml = btn ? btn.innerHTML : '';

    const payload = buildInvoicePayload(targetStatus);
    const validationErrors = validateInvoice(payload);
    if (validationErrors.length > 0) {
      if (window.showToast) {
        window.showToast(validationErrors[0], 'warning');
      } else if (window.pdfEngine) {
        window.pdfEngine.showToast(validationErrors[0], 'warning');
      }
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<svg class="spinner-inline" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 0.8s linear infinite; margin-right: 6px;"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path></svg><span>Saving...</span>`;
    }

    let data = null;
    try {
      const authRes = await fetch('/api/auth/me');
      const authData = await authRes.json();

      if (!authData || !authData.authenticated) {
        if (window.showToast) {
          window.showToast('Please sign in or create an account to save invoices to the database.', 'warning');
        }
        setTimeout(() => {
          window.location.href = 'login.html?redirect=generator';
        }, 1200);
        return;
      }

      const isUpdate = Boolean(activeInvoiceId);
      const endpoint = isUpdate ? `/api/invoices/${activeInvoiceId}` : '/api/invoices';
      const method = isUpdate ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      data = await res.json();

      if (res.ok && data.success) {
        activeInvoiceId = data.id || (data.invoice && data.invoice.id);
        const saveSubtext = document.getElementById('saveStatusSubtext');
        if (saveSubtext) {
          saveSubtext.textContent = 'Saved to cloud database just now';
          saveSubtext.style.color = '#059669';
        }

        // Show "Saved" state on the button
        if (btn) {
          btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Saved</span>`;
          setTimeout(() => {
            if (btn) {
              const label = activeInvoiceId ? 'Update Invoice' : 'Save Invoice';
              btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg><span id="btnSaveInvoiceText">${label}</span>`;
            }
          }, 2000);
        }

        const msg = targetStatus === 'draft' 
          ? `Draft ${payload.number} saved to database!` 
          : `Invoice ${payload.number} saved successfully!`;
        if (window.showToast) {
          window.showToast(msg, 'success');
        }
        if (activeInvoiceId && !window.location.search.includes(activeInvoiceId)) {
          window.history.replaceState({}, '', `index.html?id=${activeInvoiceId}`);
        }
      } else {
        if (window.showToast) {
          window.showToast(data.error || 'Could not save invoice.', 'warning');
        }
      }
    } catch (e) {
      if (window.showToast) {
        window.showToast('Could not save invoice. Please check your connection.', 'warning');
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        if (!data || !data.success) {
          btn.innerHTML = origHtml;
        }
      }
    }
  }

  // Hook save buttons
  if (btnSaveInvoice) {
    btnSaveInvoice.addEventListener('click', () => handleSaveInvoice('pending'));
  }
  if (btnSaveDraft) {
    btnSaveDraft.addEventListener('click', () => handleSaveInvoice('draft'));
  }
  const btnSaveToCloud = document.getElementById('btnSaveToCloud');
  if (btnSaveToCloud) {
    btnSaveToCloud.addEventListener('click', () => {
      if (window.pdfEngine && typeof window.pdfEngine.saveToCloud === 'function') {
        window.pdfEngine.saveToCloud();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Live Document Preview Modal Actions
  // ---------------------------------------------------------------------------
  function openPreviewModal() {
    if (!previewModal || !previewModalBody) return;
    previewModalBody.innerHTML = '';
    if (window.pdfEngine) {
      const previewEl = window.pdfEngine.renderPreviewElement();
      previewModalBody.appendChild(previewEl);
    }
    previewModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closePreviewModal() {
    if (!previewModal) return;
    previewModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (btnPreviewInvoice) {
    btnPreviewInvoice.addEventListener('click', openPreviewModal);
  }
  if (btnClosePreviewModal) {
    btnClosePreviewModal.addEventListener('click', closePreviewModal);
  }
  if (previewModal) {
    previewModal.addEventListener('click', (e) => {
      if (e.target === previewModal) closePreviewModal();
    });
  }
  if (btnPreviewPrint) {
    btnPreviewPrint.addEventListener('click', () => {
      window.print();
    });
  }
  if (btnPreviewDownload) {
    btnPreviewDownload.addEventListener('click', () => {
      if (window.pdfEngine) window.pdfEngine.downloadPDF();
    });
  }

  // Sidebar actions
  if (btnDownloadPDF) btnDownloadPDF.addEventListener('click', handleDownload);
  if (btnPrintSidebar) btnPrintSidebar.addEventListener('click', handlePrint);

  // Demo Sample & Reset in Sidebar
  if (btnLoadSample) {
    btnLoadSample.addEventListener('click', () => {
      store.loadSample();
      syncUIFromState(store.getState());
      if (window.showToast) window.showToast('Sample demo loaded! Click "Save Invoice" to persist to database.', 'info');
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
  // 8. Sidebar Document Field Toggles (Smooth Animated Reveal)
  // ---------------------------------------------------------------------------
  function revealField(el, show, displayType = 'block') {
    if (!el) return;
    if (show) {
      el.style.display = displayType;
      el.classList.add('toggleable-reveal');
      requestAnimationFrame(() => {
        el.classList.add('revealed');
      });
    } else {
      el.classList.remove('revealed');
      el.style.display = 'none';
    }
  }

  if (toggleShipTo) {
    toggleShipTo.addEventListener('change', (e) => {
      revealField(shipToCardPanel, e.target.checked, 'block');
      const billingRow = document.getElementById('sheetBillingRow');
      if (billingRow) {
        billingRow.classList.toggle('ship-to-hidden', !e.target.checked);
      }
    });
  }

  if (togglePoNumber) {
    togglePoNumber.addEventListener('change', (e) => {
      poFieldRows.forEach(el => {
        revealField(el, e.target.checked, 'inline-block');
      });
    });
  }

  if (toggleDueDate) {
    toggleDueDate.addEventListener('change', (e) => {
      dueDateFieldRows.forEach(el => {
        revealField(el, e.target.checked, 'inline-block');
      });
    });
  }

  if (toggleDiscount) {
    toggleDiscount.addEventListener('change', (e) => {
      revealField(discountLineRow, e.target.checked, 'flex');
    });
  }

  const balanceDueLineRow = document.getElementById('balanceDueLineRow');
  if (toggleAmountPaid) {
    toggleAmountPaid.addEventListener('change', (e) => {
      revealField(amountPaidLineRow, e.target.checked, 'flex');
      revealField(balanceDueLineRow, e.target.checked, 'flex');
      updateCalculations();
    });
  }

  if (toggleSignature) {
    toggleSignature.addEventListener('change', (e) => {
      revealField(signatureBlockWrap, e.target.checked, 'block');
    });
  }

  // Mobile Navigation Drawer Toggle is handled universally by instant-nav.js

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
    if (window.Auth && typeof window.Auth.renderHeader === 'function') {
      window.Auth.renderHeader();
    }
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

  // Check if loading an existing invoice (e.g. ?id=inv_... or ?load=inv_...)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('id') || urlParams.get('load');

    if (editId) {
      fetch(`/api/invoices/${editId}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.success && data.invoice) {
            activeInvoiceId = editId;
            const inv = data.invoice;
            if (btnSaveInvoiceText) btnSaveInvoiceText.textContent = 'Update Invoice';

            store.updateState('number', inv.number || inv.invoice_number);
            store.updateState('date', inv.date || inv.issue_date);
            store.updateState('dueDate', inv.dueDate || inv.due_date);
            store.updateState('poNumber', inv.poNumber || inv.po_number || '');
            store.updateState('paymentTerms', inv.paymentTerms || inv.payment_terms || 'Due on Receipt');
            store.updateState('currency', inv.currency || 'USD');
            store.updateState('sender.name', inv.sender?.name || inv.sender_name || '');
            store.updateState('sender.address', inv.sender?.address || inv.sender_address || '');
            store.updateState('client.name', inv.client?.name || inv.client_name || '');
            store.updateState('client.address', inv.client?.address || inv.client_address || '');
            store.updateState('notes', inv.notes || '');
            store.updateState('taxRate', inv.taxRate || inv.tax_rate || 0);
            store.updateState('discountValue', inv.discountValue || inv.discount_value || 0);
            store.updateState('amountPaid', inv.amountPaid || inv.amount_paid || 0);
            if (Array.isArray(inv.items) && inv.items.length > 0) {
              store.updateState('items', inv.items);
            }
            syncUIFromState(store.getState());
            if (inv.template) applyTheme(inv.template);
            if (window.showToast) window.showToast(`Loaded invoice ${inv.number}`, 'info');
          }
        })
        .catch(() => {});
    } else {
      // New invoice mode: fetch next sequential number & defaults from user profile
      fetch('/api/auth/me')
        .then(res => res.json())
        .then(data => {
          if (data && data.authenticated && data.user) {
            const user = data.user;
            fetch('/api/invoices/next-number')
              .then(r => r.json())
              .then(numData => {
                if (numData && numData.nextNumber && invoiceNumberInput) {
                  invoiceNumberInput.value = numData.nextNumber;
                  store.updateState('number', numData.nextNumber);
                }
              }).catch(() => {});

            if (user.business_name && senderName && !senderName.value) {
              senderName.value = user.business_name;
              store.updateState('sender.name', user.business_name);
            }
            if (user.business_address && senderAddress && !senderAddress.value) {
              senderAddress.value = user.business_address;
              store.updateState('sender.address', user.business_address);
            }
            if (user.default_currency && currencySelect && !currencySelect.value) {
              currencySelect.value = user.default_currency;
              store.updateState('currency', user.default_currency);
            }
            if (user.default_payment_terms && paymentTermsSelect) {
              paymentTermsSelect.value = user.default_payment_terms;
              store.updateState('paymentTerms', user.default_payment_terms);
            }
            if (user.default_notes && invoiceNotes && !invoiceNotes.value) {
              invoiceNotes.value = user.default_notes;
              store.updateState('notes', user.default_notes);
            }
            if (user.default_tax_rate !== undefined && user.default_tax_rate !== null && taxRateInput && !taxRateInput.value) {
              taxRateInput.value = user.default_tax_rate;
              store.updateState('taxRate', user.default_tax_rate);
              updateCalculations();
            }
          }
        }).catch(() => {});
    }

    // Check if client_id was passed in URL
    const targetClientId = urlParams.get('client_id') || urlParams.get('client');
    if (targetClientId) {
      fetch(`/api/clients/${targetClientId}`)
        .then(res => res.json())
        .then(cData => {
          if (cData && cData.success && cData.client) {
            const cl = cData.client;
            const displayName = cl.company ? `${cl.name} (${cl.company})` : cl.name;
            if (clientName) {
              clientName.value = displayName;
              store.updateState('client.name', displayName);
            }
            if (clientAddress) {
              clientAddress.value = cl.billing_address || '';
              store.updateState('client.address', cl.billing_address || '');
            }
            if (cl.shipping_address && shipToAddress) {
              shipToAddress.value = cl.shipping_address;
              store.updateState('shipTo.address', cl.shipping_address);
              if (shipToName && cl.name) {
                shipToName.value = cl.name;
                store.updateState('shipTo.name', cl.name);
              }
              if (toggleShipTo && !toggleShipTo.checked) {
                toggleShipTo.checked = true;
                const bRow = document.getElementById('sheetBillingRow');
                if (bRow) bRow.classList.remove('ship-to-hidden');
                store.updateState('shipTo.enabled', true);
              }
            }
            if (window.showToast) window.showToast(`Loaded client "${cl.name}"`, 'info');
          }
        })
        .catch(() => {});
    }

    // Populate client dropdown if user has existing clients
    fetch('/api/clients')
      .then(res => res.json())
      .then(clData => {
        if (clData && clData.success && Array.isArray(clData.clients) && clData.clients.length > 0) {
          let picker = document.getElementById('clientQuickSelect');
          if (!picker) {
            const billToHeader = document.querySelector('#billToCol .sheet-col-header');
            if (billToHeader) {
              billToHeader.style.display = 'flex';
              billToHeader.style.alignItems = 'center';
              billToHeader.style.justifyContent = 'space-between';
              picker = document.createElement('select');
              picker.id = 'clientQuickSelect';
              picker.className = 'form-select client-quick-picker';
              picker.style.cssText = 'width: auto; max-width: 170px; height: 26px; padding: 2px 8px; font-size: 0.72rem; border-radius: 6px; border: 1px solid #cbd5e1; background-color: #ffffff; color: #334155; font-weight: 500; cursor: pointer;';
              billToHeader.appendChild(picker);
            }
          }
          if (picker) {
            picker.style.display = 'inline-block';
            picker.innerHTML = '<option value="">+ Existing Client</option>' + clData.clients.map(c => 
              `<option value="${c.id}">${c.name}${c.company ? ' (' + c.company + ')' : ''}</option>`
            ).join('');

            picker.addEventListener('change', (e) => {
              const selectedId = e.target.value;
              if (!selectedId) return;
              const chosen = clData.clients.find(c => c.id === selectedId);
              if (chosen) {
                const displayName = chosen.company ? `${chosen.name} (${chosen.company})` : chosen.name;
                if (clientName) {
                  clientName.value = displayName;
                  store.updateState('client.name', displayName);
                }
                if (clientAddress) {
                  clientAddress.value = chosen.billing_address || '';
                  store.updateState('client.address', chosen.billing_address || '');
                }
                if (chosen.shipping_address && shipToAddress) {
                  shipToAddress.value = chosen.shipping_address;
                  store.updateState('shipTo.address', chosen.shipping_address);
                  if (shipToName && chosen.name) {
                    shipToName.value = chosen.name;
                    store.updateState('shipTo.name', chosen.name);
                  }
                  if (toggleShipTo && !toggleShipTo.checked) {
                    toggleShipTo.checked = true;
                    const bRow = document.getElementById('sheetBillingRow');
                    if (bRow) bRow.classList.remove('ship-to-hidden');
                    store.updateState('shipTo.enabled', true);
                  }
                }
                triggerAutoSaveDebounced();
                if (window.showToast) window.showToast(`Selected client "${chosen.name}"`, 'info');
              }
            });
          }
        }
      })
      .catch(() => {});

    const requestedTemplate = urlParams.get('template');
    if (requestedTemplate && requestedTemplate !== 'emerald') {
      applyTheme(requestedTemplate);
    } else if (requestedTemplate === 'emerald') {
      applyTheme('emerald');
    }

    // Wire Mobile Sticky Bottom Action Bar
    const btnMobileDownload = document.getElementById('btnMobileDownloadPdf');
    const btnMobileSave = document.getElementById('btnMobileSaveInvoice');
    const btnMobileOpts = document.getElementById('btnMobileOpenOptions');
    if (btnMobileDownload && downloadPdfBtn) {
      btnMobileDownload.addEventListener('click', () => downloadPdfBtn.click());
    }
    if (btnMobileSave && btnSaveInvoice) {
      btnMobileSave.addEventListener('click', () => btnSaveInvoice.click());
    }
    if (btnMobileOpts) {
      btnMobileOpts.addEventListener('click', () => {
        const sidebar = document.getElementById('inspectorSidebar');
        if (sidebar) {
          sidebar.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
    document.body.classList.add('has-mobile-sticky-actions');
  } catch (e) {}
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.initInvoiceEditorPage);
} else {
  window.initInvoiceEditorPage();
}
