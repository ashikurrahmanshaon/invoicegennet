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
  const btnAddItemHeader = document.getElementById('btnAddItemHeader');
  const saveStatusSubtext = document.getElementById('saveStatusSubtext');

  // Helper for quiet autosave feedback
  function setAutoSaveStatus(status) {
    if (!saveStatusSubtext) return;
    if (status === 'saving') {
      saveStatusSubtext.textContent = 'Saving to cloud…';
    } else if (status === 'saved') {
      saveStatusSubtext.textContent = 'Cloud saved ✓';
    } else {
      saveStatusSubtext.textContent = 'Saves automatically to your cloud account';
    }
  }

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
    try {
      const rawProfile = localStorage.getItem('invoicegen_business_profile');
      const rawUser = localStorage.getItem('invoicegen_user');
      const bp = rawProfile ? JSON.parse(rawProfile) : (rawUser ? JSON.parse(rawUser) : null);
      if (bp && (bp.businessName || bp.business_name || bp.name)) {
        const bName = bp.businessName || bp.business_name || bp.name;
        const bAddr = bp.address || bp.business_address || '';
        if (!state.sender?.name && senderName) {
          senderName.value = bName;
          state.sender.name = bName;
        }
        if (!state.sender?.address && senderAddress && bAddr) {
          senderAddress.value = bAddr;
          state.sender.address = bAddr;
        }
        if (bp.notes && invoiceNotes && !state.notes) {
          invoiceNotes.value = bp.notes;
          state.notes = bp.notes;
        }
      }
    } catch (e) {}

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
  // Debounced Auto-Save for Drafts & Local State
  // ---------------------------------------------------------------------------
  let autoSaveTimer = null;
  function triggerAutoSaveDebounced() {
    clearTimeout(autoSaveTimer);
    setAutoSaveStatus('saving');
    autoSaveTimer = setTimeout(() => {
      autoSaveDraftSilently();
    }, 800);
  }

  async function autoSaveDraftSilently() {
    try {
      const payload = buildInvoicePayload('draft');
      if (store.isFormEmpty()) {
        setAutoSaveStatus('ready');
        return;
      }

      if (activeInvoiceId && !String(activeInvoiceId).startsWith('inv-draft-')) {
        const res = await fetch(`/api/invoices/${activeInvoiceId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setAutoSaveStatus('saved');
          setTimeout(() => setAutoSaveStatus('ready'), 2200);
          if (btnSaveInvoiceText && !btnSaveInvoiceText.textContent.includes('...')) {
            const original = btnSaveInvoiceText.textContent;
            btnSaveInvoiceText.textContent = 'Saved (Draft)';
            setTimeout(() => {
              if (btnSaveInvoiceText) btnSaveInvoiceText.textContent = original;
            }, 1500);
          }
        } else {
          setAutoSaveStatus('ready');
        }
      } else {
        // Sync working draft to Cloud SQLite Database
        const res = await fetch('/api/user/draft', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setAutoSaveStatus('saved');
          setTimeout(() => setAutoSaveStatus('ready'), 2200);
        } else {
          // Unauthenticated fallback to localStorage
          try {
            localStorage.setItem('invoicegen_draft', JSON.stringify(payload));
          } catch (e) {}
          setAutoSaveStatus('ready');
        }
      }
    } catch (e) {
      setAutoSaveStatus('ready');
    }
  }

  // Helper to build a single row element with bound event handlers
  function createRowElement(item, isNew = false) {
    const row = document.createElement('tr');
    row.className = isNew ? 'item-row row-new' : 'item-row';
    row.dataset.id = item.id;

    const itemTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);

    row.innerHTML = `
      <td class="col-desc">
        <input type="text" class="table-input-field item-desc-field item-desc-input" placeholder="e.g. Website Design" value="${escapeHtml(item.description || '')}" aria-label="Item description">
      </td>
      <td class="col-qty">
        <input type="number" min="0" step="any" class="table-input-field item-qty-field item-qty-input item-qty" style="text-align: right;" value="${item.quantity !== undefined && item.quantity !== '' ? item.quantity : 1}" placeholder="1" aria-label="Quantity">
      </td>
      <td class="col-rate">
        <input type="number" min="0" step="0.01" class="table-input-field item-rate-field item-rate-input item-rate" style="text-align: right;" value="${item.rate !== undefined && item.rate !== null ? item.rate : 0}" placeholder="0.00" aria-label="Rate or unit price">
      </td>
      <td class="col-amount">
        <div class="table-amount-val item-amount-col">${store.formatMoney(itemTotal)}</div>
      </td>
      <td class="col-action">
        <button type="button" class="btn-trash-row btn-del-item" title="Delete item" data-id="${item.id}" aria-label="Delete item">
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
    const emptyRow = itemsTableBody ? itemsTableBody.querySelector('.items-empty-row') : null;
    if (emptyRow) emptyRow.remove();

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

    if (!items || items.length === 0) {
      const defaultId = store.addItem('', 1, 0);
      const newItems = store.getState().items || [];
      const initialItem = newItems.find(it => it.id === defaultId) || { id: defaultId, description: '', quantity: 1, rate: 0 };
      itemsTableBody.appendChild(createRowElement(initialItem, false));
      updateCalculations();
      return;
    }

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

  // Bind both Add Item buttons (Header and Table bottom)
  if (btnAddItem) {
    btnAddItem.addEventListener('click', addNewRowAndFocus);
  }
  if (btnAddItemHeader) {
    btnAddItemHeader.addEventListener('click', addNewRowAndFocus);
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
  const handleDownload = async () => {
    if (window.pdfEngine) {
      window.pdfEngine.downloadPDF();
    }
    // Automatically persist invoice to Cloud Database upon download
    try {
      const payload = buildInvoicePayload('pending');
      const authRes = await fetch('/api/auth/me');
      const authData = await authRes.json();
      if (authData && authData.authenticated) {
        const isUpdate = Boolean(activeInvoiceId && !String(activeInvoiceId).startsWith('inv-draft-'));
        const endpoint = isUpdate ? `/api/invoices/${activeInvoiceId}` : '/api/invoices';
        const method = isUpdate ? 'PUT' : 'POST';
        const res = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && data.success) {
          activeInvoiceId = data.id || (data.invoice && data.invoice.id) || activeInvoiceId;
          // Clear working draft since invoice is now generated & saved to database
          fetch('/api/user/draft', { method: 'DELETE' }).catch(() => {});
          if (window.loadDashboardSummary) window.loadDashboardSummary();
          if (window.loadInvoicesTable) window.loadInvoicesTable();
          if (window.showToast) window.showToast(`Invoice #${payload.number} saved to your cloud account!`, 'success');
        }
      }
    } catch (e) {
      console.warn('Cloud auto-save on download notice:', e);
    }

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

  // Confirmation Modal Dialog Controller (for Demo Sample & Reset Form)
  const confirmModal = document.getElementById('confirmActionModal');
  const confirmModalTitle = document.getElementById('confirmModalTitle');
  const confirmModalMsg = document.getElementById('confirmModalMsg');
  const confirmModalIconBadge = document.getElementById('confirmModalIconBadge');
  const btnConfirmCancel = document.getElementById('btnConfirmCancel');
  const btnConfirmProceed = document.getElementById('btnConfirmProceed');
  let onConfirmCallback = null;

  function showConfirmDialog({ title, message, proceedText, isDanger = false, onConfirm }) {
    if (!confirmModal) {
      if (window.confirm(`${title}\n${message}`)) {
        if (typeof onConfirm === 'function') onConfirm();
      }
      return;
    }
    if (confirmModalTitle) confirmModalTitle.textContent = title;
    if (confirmModalMsg) confirmModalMsg.textContent = message;
    if (btnConfirmProceed) {
      btnConfirmProceed.textContent = proceedText;
      btnConfirmProceed.className = isDanger ? 'btn-confirm-proceed' : 'btn-confirm-proceed btn-confirm-primary';
    }
    if (confirmModalIconBadge) {
      confirmModalIconBadge.className = isDanger ? 'confirm-modal-icon-badge' : 'confirm-modal-icon-badge info';
    }
    onConfirmCallback = onConfirm;
    confirmModal.classList.add('active');
    document.body.classList.add('modal-open');
  }

  function closeConfirmDialog() {
    if (confirmModal) confirmModal.classList.remove('active');
    document.body.classList.remove('modal-open');
    onConfirmCallback = null;
  }

  if (btnConfirmCancel) btnConfirmCancel.addEventListener('click', closeConfirmDialog);
  if (btnConfirmProceed) {
    btnConfirmProceed.addEventListener('click', () => {
      const cb = onConfirmCallback;
      closeConfirmDialog();
      if (typeof cb === 'function') cb();
    });
  }
  if (confirmModal) {
    confirmModal.addEventListener('click', (e) => {
      if (e.target === confirmModal) closeConfirmDialog();
    });
  }

  // Reset Form Action
  let isResettingAction = false;
  const handleResetForm = () => {
    if (isResettingAction) return;

    if (store.isFormEmpty()) {
      const emptyMsg = 'The invoice is already empty.';
      if (window.showToast) window.showToast(emptyMsg, 'info');
      else if (window.pdfEngine) window.pdfEngine.showToast(emptyMsg, 'info');
      return;
    }

    showConfirmDialog({
      title: 'Reset this invoice?',
      message: 'Your current invoice information will be cleared.',
      proceedText: 'Reset',
      isDanger: true,
      onConfirm: () => {
        isResettingAction = true;
        if (btnClearInvoice) btnClearInvoice.disabled = true;

        store.resetInvoice(true);
        syncUIFromState(store.getState());
        activeInvoiceId = null;
        if (btnSaveInvoiceText) btnSaveInvoiceText.textContent = 'Save Invoice';
        try {
          if (window.history && typeof window.history.replaceState === 'function') {
            window.history.replaceState({}, '', window.location.pathname || '/');
          }
        } catch (e) {}

        const resetMsg = 'Invoice reset.';
        if (window.showToast) window.showToast(resetMsg, 'success');
        else if (window.pdfEngine) window.pdfEngine.showToast(resetMsg, 'success');

        setTimeout(() => {
          isResettingAction = false;
          if (btnClearInvoice) btnClearInvoice.disabled = false;
        }, 400);
      }
    });
  };

  // Demo Sample Action
  let isDemoLoadingAction = false;
  const handleLoadDemo = () => {
    if (isDemoLoadingAction) return;

    const executeLoadDemo = () => {
      isDemoLoadingAction = true;
      if (btnLoadSample) btnLoadSample.disabled = true;

      store.loadDemo();
      syncUIFromState(store.getState());
      activeInvoiceId = null;
      if (btnSaveInvoiceText) btnSaveInvoiceText.textContent = 'Save Invoice';
      try {
        if (window.history && typeof window.history.replaceState === 'function') {
          window.history.replaceState({}, '', window.location.pathname || '/');
        }
      } catch (e) {}

      const demoMsg = 'Demo invoice loaded.';
      if (window.showToast) window.showToast(demoMsg, 'success');
      else if (window.pdfEngine) window.pdfEngine.showToast(demoMsg, 'success');

      setTimeout(() => {
        isDemoLoadingAction = false;
        if (btnLoadSample) btnLoadSample.disabled = false;
      }, 400);
    };

    if (store.isFormEmpty()) {
      executeLoadDemo();
    } else {
      showConfirmDialog({
        title: 'Load demo invoice?',
        message: 'This will replace the current form data.',
        proceedText: 'Load Demo',
        isDanger: false,
        onConfirm: executeLoadDemo
      });
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
    const activeTheme = (typeof invoicePaper?.className === 'string' ? invoicePaper.className.match(/theme-(\w+)/)?.[1] : null) || 'emerald';

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

  // Action State Tracking & Save Execution
  let isSavingAction = false;
  async function handleSaveInvoice(targetStatus = 'pending') {
    if (isSavingAction) return;

    const isDraft = targetStatus === 'draft';
    const btn = isDraft ? btnSaveDraft : btnSaveInvoice;
    const mobileBtn = isDraft ? document.getElementById('btnMobileSaveInvoice') : null;
    const origHtml = btn ? btn.innerHTML : '';

    const payload = buildInvoicePayload(targetStatus);

    // Essential validation for draft vs full validation for final save
    if (!payload.number || !payload.number.trim()) {
      const msg = 'Invoice number is required.';
      if (window.showToast) window.showToast(msg, 'warning');
      else if (window.pdfEngine) window.pdfEngine.showToast(msg, 'warning');
      return;
    }

    if (!isDraft) {
      const validationErrors = validateInvoice(payload);
      if (validationErrors.length > 0) {
        if (window.showToast) window.showToast(validationErrors[0], 'warning');
        else if (window.pdfEngine) window.pdfEngine.showToast(validationErrors[0], 'warning');
        return;
      }
    }

    isSavingAction = true;
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<svg class="spinner-inline" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 0.8s linear infinite; margin-right: 6px;"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path></svg><span>Saving...</span>`;
    }
    if (mobileBtn) mobileBtn.disabled = true;

    try {
      // 1. Always save to local storage (unauthenticated and authenticated users alike)
      const curSymbol = CURRENCIES[payload.currency]?.symbol || '$';
      const draftRecord = {
        id: activeInvoiceId || ('inv-draft-' + Date.now()),
        number: payload.number,
        clientName: payload.client?.name || 'Draft Client',
        clientEmail: payload.client?.email || '',
        issueDate: payload.date || 'Today',
        dueDate: payload.dueDate || 'Upon Receipt',
        amount: payload.total || 0,
        currency: payload.currency || 'USD',
        currencySymbol: curSymbol,
        status: isDraft ? 'draft' : 'pending',
        updatedAt: new Date().toISOString(),
        payload: payload
      };

      localStorage.setItem('invoicegen_draft', JSON.stringify(payload));
      localStorage.setItem('invoicegen_active_v3', JSON.stringify(store.getState()));

      try {
        const rawInvoices = localStorage.getItem('invoicegen_invoices');
        let invoices = rawInvoices ? JSON.parse(rawInvoices) : [];
        const existingIdx = invoices.findIndex(i => (activeInvoiceId && i.id === activeInvoiceId) || i.number === draftRecord.number);
        if (existingIdx >= 0) {
          draftRecord.id = invoices[existingIdx].id || draftRecord.id;
          invoices[existingIdx] = { ...invoices[existingIdx], ...draftRecord };
        } else {
          invoices.unshift(draftRecord);
        }
        localStorage.setItem('invoicegen_invoices', JSON.stringify(invoices));
        if (!activeInvoiceId) activeInvoiceId = draftRecord.id;
      } catch (e) {}

      // 2. If authenticated, sync with server database API
      try {
        const authRes = await fetch('/api/auth/me');
        const authData = await authRes.json();

        if (authData && authData.authenticated) {
          const isUpdate = Boolean(activeInvoiceId && !String(activeInvoiceId).startsWith('inv-draft-'));
          const endpoint = isUpdate ? `/api/invoices/${activeInvoiceId}` : '/api/invoices';
          const method = isUpdate ? 'PUT' : 'POST';

          const res = await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (res.ok && data.success) {
            activeInvoiceId = data.id || (data.invoice && data.invoice.id) || activeInvoiceId;
            if (activeInvoiceId && !window.location.search.includes(activeInvoiceId)) {
              window.history.replaceState({}, '', `/?id=${activeInvoiceId}`);
            }
            if (window.loadDashboardSummary) window.loadDashboardSummary();
            if (window.loadInvoicesTable) window.loadInvoicesTable();
          }
        } else if (!isDraft) {
          if (window.showToast) window.showToast('Signed out: Invoice saved locally. Sign in to sync with cloud.', 'info');
        }
      } catch (e) {
        // Local persistence succeeded
      }

      // Success feedback
      if (btn) {
        btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Saved</span>`;
        setTimeout(() => {
          if (btn) {
            const label = isDraft ? 'Draft' : (activeInvoiceId ? 'Update Invoice' : 'Save Invoice');
            btn.innerHTML = isDraft ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg><span>Draft</span>` : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg><span id="btnSaveInvoiceText">${label}</span>`;
          }
        }, 1800);
      }

      const msg = isDraft ? 'Draft saved successfully.' : `Invoice ${payload.number} saved successfully!`;
      if (window.showToast) window.showToast(msg, 'success');
      else if (window.pdfEngine) window.pdfEngine.showToast(msg, 'success');
    } catch (e) {
      if (btn) btn.innerHTML = origHtml;
      const errMsg = isDraft ? "We couldn't save this draft. Please try again." : "We couldn't save this invoice. Please try again.";
      if (window.showToast) window.showToast(errMsg, 'warning');
      else if (window.pdfEngine) window.pdfEngine.showToast(errMsg, 'warning');
    } finally {
      isSavingAction = false;
      if (btn) btn.disabled = false;
      if (mobileBtn) mobileBtn.disabled = false;
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

    // Pull from live DOM inputs into store to ensure zero stale data in preview
    buildInvoicePayload('draft');

    previewModalBody.innerHTML = '';
    if (window.pdfEngine) {
      const previewEl = window.pdfEngine.renderPreviewElement();
      previewModalBody.appendChild(previewEl);
    }
    previewModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.body.classList.add('preview-modal-open');
  }

  function closePreviewModal() {
    if (!previewModal) return;
    previewModal.classList.remove('active');
    document.body.style.overflow = '';
    document.body.classList.remove('preview-modal-open');
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
    btnLoadSample.addEventListener('click', handleLoadDemo);
  }

  if (btnClearInvoice) {
    btnClearInvoice.addEventListener('click', handleResetForm);
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
        window.location.href = '/login';
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
  const emailErrorMsg = document.getElementById('emailErrorMsg');
  const emailAttachmentName = document.getElementById('emailAttachmentName');
  const btnSubmitSendEmail = document.getElementById('btnSubmitSendEmail');
  const btnCancelSendEmail = document.getElementById('btnCancelSendEmail');
  let isSendingEmail = false;

  function openSendEmailModal() {
    if (!sendEmailModal) return;
    const state = store.getState();
    const totals = store.calculateTotals();

    // Reset inline error
    if (emailErrorMsg) {
      emailErrorMsg.textContent = '';
      emailErrorMsg.style.display = 'none';
    }

    const rawInvNumber = (document.getElementById('invoiceNumber')?.value || state.number || '001').trim();
    const cleanInvNumber = rawInvNumber.replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '') || 'INV-001';
    const rawClientName = (document.getElementById('clientName')?.value || state.client?.name || '').trim();
    const cleanClientName = rawClientName.replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
    const filename = cleanClientName ? `Invoice-${cleanInvNumber}-${cleanClientName}.pdf` : `Invoice-${cleanInvNumber}.pdf`;

    if (emailAttachmentName) {
      emailAttachmentName.textContent = filename;
    }

    if (clientSendEmail) {
      const currentEmail = (document.getElementById('clientEmail')?.value || state.client?.email || '').trim();
      clientSendEmail.value = currentEmail;
      clientSendEmail.style.borderColor = '';
    }
    if (emailSubject) {
      emailSubject.value = `Invoice #${cleanInvNumber} from ${state.sender?.name || 'InvoiceGen'}`;
    }
    if (emailMessage) {
      emailMessage.value = `Hi ${state.client?.name || 'there'},\n\nPlease find attached invoice #${cleanInvNumber} for ${store.formatMoney(totals.balanceDue)}. Due: ${state.date || 'Upon Receipt'}.\n\nThank you for your business!`;
    }

    sendEmailModal.classList.add('active');
    document.body.classList.add('modal-open');
    if (clientSendEmail) setTimeout(() => clientSendEmail.focus(), 120);
  }

  function closeSendEmailModal() {
    if (sendEmailModal) sendEmailModal.classList.remove('active');
    document.body.classList.remove('modal-open');
    if (emailErrorMsg) {
      emailErrorMsg.textContent = '';
      emailErrorMsg.style.display = 'none';
    }
    if (clientSendEmail) clientSendEmail.style.borderColor = '';
  }

  if (btnOpenSendEmail) {
    btnOpenSendEmail.addEventListener('click', openSendEmailModal);
  }

  if (btnCloseSendEmail) {
    btnCloseSendEmail.addEventListener('click', closeSendEmailModal);
  }

  if (btnCancelSendEmail) {
    btnCancelSendEmail.addEventListener('click', closeSendEmailModal);
  }

  if (sendEmailModal) {
    sendEmailModal.addEventListener('click', (e) => {
      if (e.target === sendEmailModal) closeSendEmailModal();
    });
  }

  window.handleSendEmailSubmit = async function () {
    if (isSendingEmail) return;

    const emailVal = clientSendEmail ? clientSendEmail.value.trim() : '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Requirement 13: Validate recipient & format inline without layout shift
    if (!emailVal || !emailRegex.test(emailVal)) {
      if (emailErrorMsg) {
        emailErrorMsg.textContent = 'Please enter a valid email address.';
        emailErrorMsg.style.display = 'block';
      }
      if (clientSendEmail) {
        clientSendEmail.style.borderColor = '#ef4444';
        clientSendEmail.focus();
      }
      return;
    }

    if (emailErrorMsg) {
      emailErrorMsg.textContent = '';
      emailErrorMsg.style.display = 'none';
    }
    if (clientSendEmail) clientSendEmail.style.borderColor = '';

    isSendingEmail = true;
    const origBtnHtml = btnSubmitSendEmail ? btnSubmitSendEmail.innerHTML : 'Send Invoice';
    if (btnSubmitSendEmail) {
      btnSubmitSendEmail.disabled = true;
      btnSubmitSendEmail.innerHTML = `
        <svg style="width:15px;height:15px;animation:spin 0.8s linear infinite;margin-right:6px;vertical-align:middle;display:inline-block;" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-opacity="0.25"></circle>
          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Sending…</span>
      `;
    }

    try {
      // 1. Generate CURRENT invoice PDF
      if (window.pdfEngine && typeof window.pdfEngine.generatePDFBlob === 'function') {
        await window.pdfEngine.generatePDFBlob();
      }

      const filename = (emailAttachmentName?.textContent || 'Invoice-INV-001.pdf').trim();
      const subject = emailSubject?.value || 'Invoice';
      const message = emailMessage?.value || '';

      // 2. Call backend /api/send-email
      let serverDispatched = false;
      try {
        const res = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: emailVal,
            subject,
            message,
            filename
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          serverDispatched = true;
        }
      } catch (err) {
        // Network or server unreachable
      }

      if (serverDispatched) {
        closeSendEmailModal();
        if (window.showToast) window.showToast('Invoice sent successfully.', 'success');
        else if (window.pdfEngine) window.pdfEngine.showToast('Invoice sent successfully.', 'success');
      } else {
        // Requirement 12: Safe genuine fallback when SMTP is unconfigured (NO fake "sent" claim!)
        closeSendEmailModal();

        // Trigger PDF download for the user to attach
        if (window.pdfEngine) {
          window.pdfEngine.downloadPDF();
        }

        // Launch user's default mail client with prefilled parameters
        const mailtoLink = `mailto:${encodeURIComponent(emailVal)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
        window.location.href = mailtoLink;

        const notice = 'Send via Email requires email configuration. Mail client launched.';
        if (window.showToast) window.showToast(notice, 'info');
        else if (window.pdfEngine) window.pdfEngine.showToast(notice, 'info');
      }
    } catch (err) {
      if (window.showToast) window.showToast("We couldn't send the invoice. Check the email address and try again.", 'warning');
      else if (window.pdfEngine) window.pdfEngine.showToast("We couldn't send the invoice. Check the email address and try again.", 'warning');
    } finally {
      isSendingEmail = false;
      if (btnSubmitSendEmail) {
        btnSubmitSendEmail.disabled = false;
        btnSubmitSendEmail.innerHTML = origBtnHtml;
      }
    }
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
            if (user.business_logo && !store.state?.logo) {
              store.setLogo(user.business_logo);
              if (logoImg) logoImg.src = user.business_logo;
              if (logoPreviewBox) logoPreviewBox.style.display = 'block';
              if (btnUploadLogo) btnUploadLogo.style.display = 'none';
            }
          }
        }).catch(() => {});

      // Fallback: load business profile from localStorage for offline/unauthenticated users
      try {
        const rawBiz = localStorage.getItem('invoicegen_business_profile');
        if (rawBiz) {
          const biz = JSON.parse(rawBiz);
          if (biz.name && senderName && !senderName.value) {
            senderName.value = biz.name;
            store.updateState('sender.name', biz.name);
          }
          if (biz.address && senderAddress && !senderAddress.value) {
            let fullAddr = biz.address;
            const contactLine = [biz.email, biz.phone].filter(Boolean).join(' • ');
            if (contactLine && !fullAddr.includes(biz.email) && !fullAddr.includes(biz.phone)) {
              fullAddr = fullAddr ? `${fullAddr}\n${contactLine}` : contactLine;
            }
            if (biz.taxId && !fullAddr.includes(biz.taxId)) {
              fullAddr = `${fullAddr}\nTax ID: ${biz.taxId}`;
            }
            senderAddress.value = fullAddr;
            store.updateState('sender.address', fullAddr);
          }
          if (biz.currency && currencySelect && (!currencySelect.value || currencySelect.value === 'USD')) {
            currencySelect.value = biz.currency;
            store.setCurrency(biz.currency);
          }
          if (biz.paymentTerms && paymentTermsSelect) {
            paymentTermsSelect.value = biz.paymentTerms;
            store.updateState('paymentTerms', biz.paymentTerms);
          }
        }
      } catch (e) {}

      // Restore saved draft (Cloud draft has priority, with fallback to local draft)
      (async () => {
        try {
          if (!activeInvoiceId && store.isFormEmpty()) {
            const cloudDraft = await store.loadFromCloud();
            if (cloudDraft) {
              syncUIFromState(store.getState());
              if (saveStatusSubtext) saveStatusSubtext.textContent = 'Restored cloud draft ✓';
              return;
            }
          }
        } catch (e) {}

        // Fallback: check localStorage for offline users
        try {
          const rawDraft = localStorage.getItem('invoicegen_draft');
          if (rawDraft && store.isFormEmpty()) {
            const draft = JSON.parse(rawDraft);
            if (draft && draft.number) {
              activeInvoiceId = draft.id || null;
              if (btnSaveInvoiceText && activeInvoiceId) btnSaveInvoiceText.textContent = 'Update Invoice';
              store.updateState('number', draft.number);
              if (draft.date) store.updateState('date', draft.date);
              if (draft.dueDate) store.updateState('dueDate', draft.dueDate);
              if (draft.poNumber) store.updateState('poNumber', draft.poNumber);
              if (draft.paymentTerms) store.updateState('paymentTerms', draft.paymentTerms);
              if (draft.currency) store.updateState('currency', draft.currency);
              if (draft.sender?.name) store.updateState('sender.name', draft.sender.name);
              if (draft.sender?.address) store.updateState('sender.address', draft.sender.address);
              if (draft.client?.name) store.updateState('client.name', draft.client.name);
              if (draft.client?.address) store.updateState('client.address', draft.client.address);
              if (draft.client?.email) store.updateState('client.email', draft.client.email);
              if (draft.shipTo?.name) store.updateState('shipTo.name', draft.shipTo.name);
              if (draft.shipTo?.address) store.updateState('shipTo.address', draft.shipTo.address);
              if (draft.notes) store.updateState('notes', draft.notes);
              if (draft.taxRate !== undefined) store.updateState('taxRate', draft.taxRate);
              if (draft.discountValue !== undefined) store.updateState('discountValue', draft.discountValue);
              if (draft.amountPaid !== undefined) store.updateState('amountPaid', draft.amountPaid);
              if (Array.isArray(draft.items) && draft.items.length > 0) {
                store.updateState('items', draft.items);
              }
              syncUIFromState(store.getState());
            }
          }
        } catch (e) {}
      })();
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
                const panel = document.getElementById('shipToCardPanel');
                if (panel) panel.style.display = 'block';
                store.updateState('shipTo.enabled', true);
              }
            }
            if (window.showToast) window.showToast(`Loaded client "${cl.name}"`, 'info');
          }
        })
        .catch(() => {});
    }

    // Populate client autocomplete datalist from user's clients
    fetch('/api/clients')
      .then(res => res.json())
      .then(clData => {
        let clientsList = (clData && clData.success && Array.isArray(clData.clients)) ? clData.clients : [];
        if (!clientsList.length) {
          try {
            const rawStored = localStorage.getItem('invoicegen_clients');
            if (rawStored) clientsList = JSON.parse(rawStored);
            if (!clientsList.length) {
              const rawInvs = localStorage.getItem('invoicegen_invoices');
              if (rawInvs) {
                const invs = JSON.parse(rawInvs);
                const seen = new Set();
                invs.forEach(inv => {
                  if (inv.client_name && !seen.has(inv.client_name)) {
                    seen.add(inv.client_name);
                    clientsList.push({ id: 'loc_' + seen.size, name: inv.client_name, billing_address: inv.client_address || '' });
                  }
                });
              }
            }
          } catch (e) {}
        }
        if (clientsList.length > 0) {
          const datalist = document.getElementById('clientsDatalist');
          if (datalist) {
            datalist.innerHTML = clientsList.map(c => `<option value="${c.name}">${c.billing_address ? c.billing_address.replace(/\n/g, ' ') : ''}</option>`).join('');
          }

          const clientPickerSelect = document.getElementById('clientPickerSelect');
          const clientSelectWrap = document.getElementById('clientSelectWrap');
          if (clientPickerSelect && clientSelectWrap) {
            clientSelectWrap.style.display = 'inline-flex';
            clientPickerSelect.innerHTML = `<option value="">Select Client ▼</option>` +
              clientsList.map(c => `<option value="${c.name}">${c.name}${c.company ? ' (' + c.company + ')' : ''}</option>`).join('');

            clientPickerSelect.addEventListener('change', (e) => {
              const val = e.target.value.trim().toLowerCase();
              if (!val) return;
              const chosen = clientsList.find(c => c.name.toLowerCase() === val || (c.company && c.company.toLowerCase() === val));
              if (chosen && clientName) {
                const displayName = chosen.company ? `${chosen.name} (${chosen.company})` : chosen.name;
                clientName.value = displayName;
                store.updateState('client.name', displayName);
                if (chosen.billing_address && clientAddress) {
                  clientAddress.value = chosen.billing_address;
                  store.updateState('client.address', chosen.billing_address);
                }
                if (chosen.shipping_address && shipToAddress) {
                  shipToAddress.value = chosen.shipping_address;
                  store.updateState('shipTo.address', chosen.shipping_address);
                  if (shipToName && !shipToName.value) {
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

          if (clientName) {
            clientName.addEventListener('change', () => {
              const val = clientName.value.trim().toLowerCase();
              const chosen = clientsList.find(c => c.name.toLowerCase() === val || (c.company && c.company.toLowerCase() === val));
              if (chosen) {
                const displayName = chosen.company ? `${chosen.name} (${chosen.company})` : chosen.name;
                clientName.value = displayName;
                store.updateState('client.name', displayName);
                if (clientAddress && !clientAddress.value) {
                  clientAddress.value = chosen.billing_address || '';
                  store.updateState('client.address', chosen.billing_address || '');
                }
                if (chosen.shipping_address && shipToAddress && !shipToAddress.value) {
                  shipToAddress.value = chosen.shipping_address;
                  store.updateState('shipTo.address', chosen.shipping_address);
                  if (shipToName && !shipToName.value) {
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
    const btnMobilePreview = document.getElementById('btnMobilePreviewPdf');
    const btnMobileSave = document.getElementById('btnMobileSaveInvoice');
    if (btnMobileDownload) {
      btnMobileDownload.addEventListener('click', handleDownload);
    }
    if (btnMobilePreview) {
      btnMobilePreview.addEventListener('click', openPreviewModal);
    }
    if (btnMobileSave) {
      btnMobileSave.addEventListener('click', () => {
        handleSaveInvoice('draft');
      });
    }
    const btnHeroCreate = document.getElementById('btnHeroCreateInvoice');
    if (btnHeroCreate) {
      btnHeroCreate.addEventListener('click', (e) => {
        e.preventDefault();
        const paper = document.getElementById('invoicePaper');
        if (paper) {
          paper.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setTimeout(() => {
            const firstInput = document.getElementById('senderName') || document.getElementById('clientName');
            if (firstInput && !firstInput.value) firstInput.focus();
          }, 400);
        }
      });
    }
    document.body.classList.add('has-mobile-sticky-actions');
  } catch (e) {
    console.error('Invoice editor initialization error:', e);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.initInvoiceEditorPage);
} else {
  window.initInvoiceEditorPage();
}
