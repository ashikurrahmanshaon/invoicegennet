/* ==========================================================================
   HIGH-PRECISION A4 PDF GENERATOR & PRINT EXPORT ENGINE
   Matches reference styling with exact typography, ISO A4 dimensions, and black/monochrome default
   ========================================================================== */

class PDFEngine {
  constructor() {
    this.isGenerating = false;
  }

  showToast(message, type = 'success') {
    let toast = document.getElementById('toastNotice');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toastNotice';
      toast.className = 'toast-notice';
      document.body.appendChild(toast);
    }
    let icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    if (type === 'info') {
      icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    } else if (type === 'warning') {
      icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
    }
    toast.innerHTML = `<span class="toast-icon-badge">${icon}</span><span class="toast-text">${message}</span>`;
    toast.onclick = () => toast.classList.remove('show');
    toast.className = `toast-notice toast-${type} show`;
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  }

  printInvoice() {
    window.print();
  }

  // Ensure html2pdf bundle is loaded
  async ensureLibrary() {
    if (typeof window.html2pdf !== 'undefined') return true;

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'js/html2pdf.bundle.min.js';
      script.onload = () => resolve(typeof window.html2pdf !== 'undefined');
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Build high-fidelity ISO A4 printable layout matching reference
  buildPrintableA4Element() {
    const store = window.invoiceStore ? window.invoiceStore.getState() : {};

    const getVal = (id, fallback = '') => {
      const el = document.getElementById(id);
      return el && el.value !== undefined ? el.value.trim() : fallback;
    };

    const getText = (id, fallback = '') => {
      const el = document.getElementById(id);
      return el ? el.textContent.trim() : fallback;
    };

    const senderName = getVal('senderName', store.sender?.name || '');
    const senderAddress = getVal('senderAddress', store.sender?.address || '');
    const invoiceTitle = getVal('invoiceTitleHeading', store.title || 'INVOICE');
    const invoiceNumber = getVal('invoiceNumber', store.number || '001');
    const invoiceDate = getVal('invoiceDate', store.date || '');
    const paymentTerms = getVal('paymentTerms', store.paymentTerms || 'Due on Receipt');
    const dueDate = getVal('dueDateInput', store.dueDate || '');
    const poNumber = getVal('poNumber', store.poNumber || '');

    const clientName = getVal('clientName', store.client?.name || '');
    const clientAddress = getVal('clientAddress', store.client?.address || '');

    const shipToCard = document.getElementById('shipToCardPanel');
    const isShipToVisible = shipToCard && window.getComputedStyle(shipToCard).display !== 'none';
    const shipToName = getVal('shipToName', store.shipTo?.name || '');
    const shipToAddress = getVal('shipToAddress', store.shipTo?.address || '');

    const notes = getVal('invoiceNotes', store.notes || '');

    const sigWrap = document.getElementById('signatureBlockWrap');
    const isSigVisible = sigWrap && window.getComputedStyle(sigWrap).display !== 'none';
    const signature = getVal('signatureInput', '');

    // Logo check
    let logoSrc = store.logo || '';
    const logoImg = document.getElementById('logoImg');
    const logoBox = document.getElementById('logoPreviewBox');
    if (logoBox && window.getComputedStyle(logoBox).display !== 'none' && logoImg && logoImg.src && !logoImg.src.endsWith('#')) {
      logoSrc = logoImg.src;
    }

    // Totals
    const subtotal = getText('subtotalDisplay', '$0.00');
    const discountLine = document.getElementById('discountLineRow');
    const hasDiscount = discountLine && window.getComputedStyle(discountLine).display !== 'none';
    const discountAmt = getText('discountAmountDisplay', '-$0.00');
    const discountRate = getVal('discountRate', store.discountValue || '0');

    const taxAmt = getText('taxAmountDisplay', '+$0.00');
    const taxRate = getVal('taxRate', getVal('taxRateInput', store.taxRate || '0'));

    const shippingLine = document.getElementById('shippingLineRow');
    const hasShipping = shippingLine && window.getComputedStyle(shippingLine).display !== 'none';
    const shippingAmt = getText('shippingFeeDisplay', '+$0.00');

    const grandTotal = getText('grandTotalDisplay', '$0.00');

    const amountPaidLine = document.getElementById('amountPaidRow');
    const hasAmountPaid = amountPaidLine && window.getComputedStyle(amountPaidLine).display !== 'none';
    const amountPaidAmt = getText('amountPaidDisplay', '$0.00');

    const balanceDue = getText('balanceDueDisplay', '$0.00');

    // Line items extraction - robust detection across DOM inputs and store
    const items = [];
    const rows = document.querySelectorAll('#itemsTableBody tr.item-row, #itemsTableBody tr');
    const storeItems = (store && store.items) ? store.items : [];

    if (rows && rows.length > 0) {
      rows.forEach((row, idx) => {
        const storeItem = storeItems[idx] || {};
        const descInput = row.querySelector('.item-desc-field') || row.querySelector('.item-desc-input') || row.querySelector('input[type="text"]');
        const qtyInput = row.querySelector('.item-qty-field') || row.querySelector('.item-qty-input');
        const rateInput = row.querySelector('.item-rate-field') || row.querySelector('.item-rate-input');
        const amountEl = row.querySelector('.item-amount-col') || row.querySelector('.table-amount-val') || row.querySelector('.item-amount-val');

        const desc = (descInput && descInput.value !== undefined && descInput.value.trim() !== '') 
          ? descInput.value.trim() 
          : (storeItem.description || storeItem.desc || '');

        const subtext = storeItem.subtext || '';

        const qty = (qtyInput && qtyInput.value !== undefined && qtyInput.value !== '') 
          ? qtyInput.value 
          : (storeItem.quantity !== undefined ? storeItem.quantity : 1);

        const rateNum = (rateInput && rateInput.value !== undefined && rateInput.value !== '') 
          ? parseFloat(rateInput.value) 
          : (storeItem.rate !== undefined ? parseFloat(storeItem.rate) : 0);

        let formattedRate = '';
        if (window.invoiceStore) {
          formattedRate = window.invoiceStore.formatMoney(rateNum);
        } else {
          formattedRate = (rateNum || 0).toFixed(2);
        }

        let amountStr = '';
        if (amountEl && amountEl.textContent && amountEl.textContent.trim()) {
          amountStr = amountEl.textContent.trim();
        } else if (window.invoiceStore) {
          amountStr = window.invoiceStore.formatMoney((parseFloat(qty) || 0) * (rateNum || 0));
        } else {
          amountStr = ((parseFloat(qty) || 0) * (rateNum || 0)).toFixed(2);
        }

        if (desc || subtext || (parseFloat(qty) || 0) > 0 || (rateNum || 0) > 0) {
          items.push({ desc, subtext, qty, rate: formattedRate, amount: amountStr });
        }
      });
    }

    // Fallback if rows query yielded nothing
    if (items.length === 0 && storeItems.length > 0) {
      storeItems.forEach(it => {
        const q = parseFloat(it.quantity) || 1;
        const r = parseFloat(it.rate) || 0;
        const fmtRate = window.invoiceStore ? window.invoiceStore.formatMoney(r) : r.toFixed(2);
        const fmtAmt = window.invoiceStore ? window.invoiceStore.formatMoney(q * r) : (q * r).toFixed(2);
        items.push({
          desc: it.description || it.desc || '',
          subtext: it.subtext || '',
          qty: q,
          rate: fmtRate,
          amount: fmtAmt
        });
      });
    }

    // Color Accent Logic:
    // DEFAULT MODE IS ALWAYS CLEAN BLACK/NEUTRAL UNLESS USER EXPLICITLY SELECTS A COLOR ACCENT
    const paper = document.getElementById('invoicePaper');
    let themeAccent = '#111827'; // Pure black by default
    let tableHeaderBg = '#383838'; // Classic dark charcoal/black by default

    if (paper) {
      if (paper.classList.contains('theme-emerald')) {
        themeAccent = '#00c875';
        tableHeaderBg = '#00c875';
      } else if (paper.classList.contains('theme-navy')) {
        themeAccent = '#2563eb';
        tableHeaderBg = '#1e40af';
      } else if (paper.classList.contains('theme-indigo')) {
        themeAccent = '#6366f1';
        tableHeaderBg = '#4f46e5';
      }
    }

    // Create container with clean document flow (NO position: fixed or negative coordinates!)
    const container = document.createElement('div');
    container.id = 'printableInvoiceA4';
    container.style.cssText = `
      width: 100%;
      box-sizing: border-box;
      background: #ffffff;
      color: #111827;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 11px;
      line-height: 1.45;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    `;

    // Table rows HTML - Clean minimalist layout matching reference (No heavy borders!)
    let tableRowsHtml = '';
    if (items.length === 0) {
      tableRowsHtml = `
        <tr style="border: none;">
          <td colspan="4" style="padding: 14px 14px; text-align: center; color: #9ca3af; font-style: italic; font-size: 11px;">
            No items listed.
          </td>
        </tr>
      `;
    } else {
      items.forEach((item) => {
        tableRowsHtml += `
          <tr style="border: none;">
            <td style="padding: 7px 14px; vertical-align: top;">
              <div style="font-weight: 400; font-size: 11px; color: #111827; line-height: 1.35;">
                ${this.escapeHtml(item.desc || '')}
              </div>
              ${item.subtext ? `<div style="font-size: 10px; color: #6b7280; margin-top: 2px; line-height: 1.3;">${this.escapeHtml(item.subtext)}</div>` : ''}
            </td>
            <td style="padding: 7px 14px; text-align: right; vertical-align: top; font-size: 11px; font-weight: 400; color: #111827;">
              ${this.escapeHtml(item.qty)}
            </td>
            <td style="padding: 7px 14px; text-align: right; vertical-align: top; font-size: 11px; font-weight: 400; color: #111827;">
              ${this.escapeHtml(item.rate)}
            </td>
            <td style="padding: 7px 14px; text-align: right; vertical-align: top; font-size: 11px; font-weight: 400; color: #111827;">
              ${this.escapeHtml(item.amount)}
            </td>
          </tr>
        `;
      });
    }

    container.innerHTML = `
      <style>
        #printableInvoiceA4, #printableInvoiceA4 * {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
          box-sizing: border-box;
        }
      </style>

      <!-- Top Row: Sender Info & Invoice Title -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 26px;">
        
        <!-- Left: Sender Details & Logo -->
        <div style="max-width: 380px;">
          ${logoSrc ? `
            <div style="margin-bottom: 12px;">
              <img src="${logoSrc}" alt="Company Logo" style="max-height: 52px; max-width: 170px; object-fit: contain; display: block;">
            </div>
          ` : ''}
          <div style="font-size: 13px; font-weight: 700; color: #111827; line-height: 1.3; margin-bottom: 3px;">
            ${this.escapeHtml(senderName || 'Your Business Name')}
          </div>
          <div style="font-size: 10.5px; color: #4b5563; white-space: pre-wrap; line-height: 1.45;">${this.escapeHtml(senderAddress || '')}</div>
        </div>

        <!-- Right: Title & Invoice Number -->
        <div style="text-align: right;">
          <div style="font-size: 30px; font-weight: 300; color: #111827; letter-spacing: 0.05em; text-transform: uppercase; line-height: 1; margin-bottom: 4px;">
            ${this.escapeHtml(invoiceTitle)}
          </div>
          <div style="font-size: 13px; font-weight: 400; color: #6b7280; line-height: 1.2;">
            # ${this.escapeHtml(invoiceNumber)}
          </div>
        </div>
      </div>

      <!-- Second Row: Bill To / Ship To on Left, Date & Balance Due on Right -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 26px;">
        
        <!-- Left: Bill To & Optional Ship To -->
        <div style="display: flex; gap: 32px; max-width: 440px;">
          <div>
            <div style="font-size: 10px; font-weight: 500; color: #6b7280; margin-bottom: 3px;">
              Bill To:
            </div>
            <div style="font-size: 12px; font-weight: 700; color: #111827; margin-bottom: 2px;">
              ${this.escapeHtml(clientName || 'Client Name')}
            </div>
            <div style="font-size: 10.5px; color: #4b5563; white-space: pre-wrap; line-height: 1.45;">${this.escapeHtml(clientAddress || '')}</div>
          </div>

          ${(isShipToVisible && (shipToName || shipToAddress)) ? `
            <div>
              <div style="font-size: 10px; font-weight: 500; color: #6b7280; margin-bottom: 3px;">
                Ship To:
              </div>
              <div style="font-size: 12px; font-weight: 700; color: #111827; margin-bottom: 2px;">
                ${this.escapeHtml(shipToName || '')}
              </div>
              <div style="font-size: 10.5px; color: #4b5563; white-space: pre-wrap; line-height: 1.45;">${this.escapeHtml(shipToAddress || '')}</div>
            </div>
          ` : ''}
        </div>

        <!-- Right: Date, Terms, & Balance Due Bar -->
        <div style="text-align: right; min-width: 220px;">
          <table style="margin-left: auto; border-collapse: collapse; font-size: 11px; color: #4b5563; text-align: right; margin-bottom: 8px;">
            <tr>
              <td style="padding: 2px 10px 2px 0; color: #6b7280; font-weight: 400;">Date:</td>
              <td style="padding: 2px 0; font-weight: 400; color: #111827;">${this.escapeHtml(invoiceDate)}</td>
            </tr>
            ${(paymentTerms && paymentTerms !== 'Due on Receipt') ? `
              <tr>
                <td style="padding: 2px 10px 2px 0; color: #6b7280; font-weight: 400;">Terms:</td>
                <td style="padding: 2px 0; font-weight: 400; color: #111827;">${this.escapeHtml(paymentTerms)}</td>
              </tr>
            ` : ''}
            ${dueDate ? `
              <tr>
                <td style="padding: 2px 10px 2px 0; color: #6b7280; font-weight: 400;">Due Date:</td>
                <td style="padding: 2px 0; font-weight: 400; color: #111827;">${this.escapeHtml(dueDate)}</td>
              </tr>
            ` : ''}
            ${poNumber ? `
              <tr>
                <td style="padding: 2px 10px 2px 0; color: #6b7280; font-weight: 400;">PO Number:</td>
                <td style="padding: 2px 0; font-weight: 400; color: #111827;">${this.escapeHtml(poNumber)}</td>
              </tr>
            ` : ''}
          </table>

          <!-- Gray Balance Due Bar (Matches reference image) -->
          <div style="background-color: #f3f4f6; border-radius: 4px; padding: 6px 14px; display: flex; justify-content: space-between; align-items: center; min-width: 210px; min-height: 32px;">
            <span style="font-size: 11.5px; font-weight: 600; color: #1f2937;">Balance Due:</span>
            <span style="font-size: 13px; font-weight: 700; color: ${themeAccent};">${this.escapeHtml(balanceDue)}</span>
          </div>
        </div>

      </div>

      <!-- Items Table (Dark Header Bar matching reference) -->
      <div style="margin-bottom: 16px;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: ${tableHeaderBg}; color: #ffffff;">
              <th style="width: 52%; text-align: left; padding: 7px 14px; font-size: 11px; font-weight: 500; border-top-left-radius: 4px; border-bottom-left-radius: 4px;">
                Item
              </th>
              <th style="width: 16%; text-align: right; padding: 7px 14px; font-size: 11px; font-weight: 500;">
                Quantity
              </th>
              <th style="width: 16%; text-align: right; padding: 7px 14px; font-size: 11px; font-weight: 500;">
                Rate
              </th>
              <th style="width: 16%; text-align: right; padding: 7px 14px; font-size: 11px; font-weight: 500; border-top-right-radius: 4px; border-bottom-right-radius: 4px;">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
      </div>

      <!-- Bottom Layout: Notes on Left & Financial Totals on Right -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-top: 14px;">
        
        <!-- Left: Notes & Terms Section -->
        <div style="max-width: 380px;">
          ${notes ? `
            <div style="font-size: 10.5px; font-weight: 500; color: #6b7280; margin-bottom: 4px;">
              Notes:
            </div>
            <div style="font-size: 10.5px; color: #374151; white-space: pre-wrap; line-height: 1.45;">${this.escapeHtml(notes)}</div>
          ` : ''}

          <!-- Digital Signature (if active) -->
          ${(isSigVisible && signature) ? `
            <div style="margin-top: 20px;">
              <div style="font-size: 10px; font-weight: 500; color: #6b7280; margin-bottom: 4px;">
                Authorized Signature:
              </div>
              <div style="border-top: 1px solid #94a3b8; width: 180px; padding-top: 4px;">
                <div style="font-weight: 600; font-size: 11px; color: #111827;">${this.escapeHtml(signature)}</div>
                <div style="font-size: 9.5px; color: #6b7280;">Authorized Representative</div>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Right: Totals Breakdown (Right-Aligned, Perfectly Aligned with Table Amount Column) -->
        <div style="min-width: 220px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <tr>
              <td style="padding: 3px 0; color: #6b7280; text-align: right; font-weight: 400;">Subtotal:</td>
              <td style="padding: 3px 14px 3px 16px; text-align: right; font-weight: 400; color: #111827; width: 85px;">${this.escapeHtml(subtotal)}</td>
            </tr>
            ${hasDiscount ? `
              <tr>
                <td style="padding: 3px 0; color: #6b7280; text-align: right; font-weight: 400;">Discount (${this.escapeHtml(discountRate)}%):</td>
                <td style="padding: 3px 14px 3px 16px; text-align: right; font-weight: 400; color: #111827;">${this.escapeHtml(discountAmt)}</td>
              </tr>
            ` : ''}
            ${parseFloat(taxRate) > 0 ? `
              <tr>
                <td style="padding: 3px 0; color: #6b7280; text-align: right; font-weight: 400;">Tax (${this.escapeHtml(taxRate)}%):</td>
                <td style="padding: 3px 14px 3px 16px; text-align: right; font-weight: 400; color: #111827;">${this.escapeHtml(taxAmt)}</td>
              </tr>
            ` : ''}
            ${hasShipping ? `
              <tr>
                <td style="padding: 3px 0; color: #6b7280; text-align: right; font-weight: 400;">Shipping:</td>
                <td style="padding: 3px 14px 3px 16px; text-align: right; font-weight: 400; color: #111827;">${this.escapeHtml(shippingAmt)}</td>
              </tr>
            ` : ''}
            <tr>
              <td style="padding: 6px 0; font-weight: 700; font-size: 11.5px; color: #111827; text-align: right;">Total:</td>
              <td style="padding: 6px 14px 6px 16px; text-align: right; font-weight: 700; font-size: 11.5px; color: #111827;">${this.escapeHtml(grandTotal)}</td>
            </tr>
            ${hasAmountPaid ? `
              <tr>
                <td style="padding: 3px 0; color: #6b7280; text-align: right; font-weight: 400;">Amount Paid:</td>
                <td style="padding: 3px 14px 3px 16px; text-align: right; font-weight: 400; color: #111827;">${this.escapeHtml(amountPaidAmt)}</td>
              </tr>
            ` : ''}
          </table>
        </div>

      </div>
    `;

    return container;
  }

  async downloadPDF() {
    if (this.isGenerating) return;

    const downloadBtn = document.getElementById('btnDownloadPDF');
    const originalContent = downloadBtn ? downloadBtn.innerHTML : 'Download PDF';

    try {
      this.isGenerating = true;

      if (downloadBtn) {
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = `
          <svg style="width:16px;height:16px;animation:spin 1s linear infinite;margin-right:8px;vertical-align:middle;" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-opacity="0.25"></circle>
            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Generating A4 PDF...</span>
        `;
      }

      this.showToast('Assembling high-definition A4 vector PDF...', 'info');

      // Ensure library is available (local bundle)
      const isLoaded = await this.ensureLibrary();
      if (!isLoaded || typeof html2pdf === 'undefined') {
        throw new Error('PDF generation library failed to initialize.');
      }

      // Ensure web fonts are completely ready before snapshotting
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      await new Promise(r => setTimeout(r, 60));

      // Build isolated, pixel-perfect A4 printable container (clean flow styling)
      const printableElement = this.buildPrintableA4Element();

      const state = window.invoiceStore ? window.invoiceStore.getState() : {};
      const invNumber = (document.getElementById('invoiceNumber')?.value || state.number || '001').replace(/[^a-zA-Z0-9-_]/g, '_');
      const filename = `Invoice_${invNumber}.pdf`;

      // ISO A4 exact calibration (210mm x 297mm) with 18mm print margins for high-end designer proportions
      const opt = {
        margin: [18, 18, 18, 18],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2, // 2x Retina high-resolution (crystal clear)
          useCORS: true,
          logging: false,
          letterRendering: true,
          backgroundColor: '#ffffff'
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait'
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      // Generate & save directly without manual DOM pollution
      await html2pdf().set(opt).from(printableElement).save();

      this.showToast('Invoice PDF downloaded successfully!', 'success');
    } catch (err) {
      console.error('PDF Generation Error:', err);
      this.showToast('Direct PDF export encountered an issue. Opening print view...', 'warning');
      window.print();
    } finally {
      this.isGenerating = false;
      if (downloadBtn) {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = originalContent;
      }
    }
  }
}

window.pdfEngine = new PDFEngine();
