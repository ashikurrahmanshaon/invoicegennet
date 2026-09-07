/* ==========================================================================
   HIGH-PRECISION A4 PDF GENERATOR & PRINT EXPORT ENGINE
   Ultra-accurate ISO 210mm x 297mm A4, 300 DPI High-Resolution, 100% Client-Side
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

  // Utility to escape HTML strings safely
  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Build a pristine, pixel-perfect ISO A4 printable layout
  buildPrintableA4Element() {
    const store = window.invoiceStore ? window.invoiceStore.getState() : {};
    
    // Read live values from DOM with store fallbacks
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
    const taxRate = getVal('taxRateInput', store.taxRate || '0');

    const shippingLine = document.getElementById('shippingLineRow');
    const hasShipping = shippingLine && window.getComputedStyle(shippingLine).display !== 'none';
    const shippingAmt = getText('shippingFeeDisplay', '+$0.00');

    const grandTotal = getText('grandTotalDisplay', '$0.00');

    const amountPaidLine = document.getElementById('amountPaidRow');
    const hasAmountPaid = amountPaidLine && window.getComputedStyle(amountPaidLine).display !== 'none';
    const amountPaidAmt = getText('amountPaidDisplay', '$0.00');

    const balanceDue = getText('balanceDueDisplay', '$0.00');

    // Collect line items
    const items = [];
    const rows = document.querySelectorAll('#itemsTableBody tr');
    if (rows && rows.length > 0) {
      rows.forEach(row => {
        const desc = row.querySelector('.item-desc-input')?.value || '';
        const subtext = row.querySelector('.item-subtext-input')?.value || '';
        const qty = row.querySelector('.item-qty-input')?.value || '1';
        const rate = row.querySelector('.item-rate-input')?.value || '0';
        const amount = row.querySelector('.item-amount-val')?.textContent || '$0.00';
        if (desc || subtext || parseFloat(qty) > 0 || parseFloat(rate) > 0) {
          items.push({ desc, subtext, qty, rate, amount });
        }
      });
    }

    // Fallback if rows empty but store has items
    if (items.length === 0 && store.items && store.items.length > 0) {
      store.items.forEach(it => {
        items.push({
          desc: it.description || '',
          subtext: it.subtext || '',
          qty: it.quantity || 1,
          rate: it.rate || 0,
          amount: window.invoiceStore ? window.invoiceStore.formatMoney((it.quantity || 1) * (it.rate || 0)) : '$0.00'
        });
      });
    }

    // Determine active theme color
    const paper = document.getElementById('invoicePaper');
    let themeAccent = '#00c875';
    let tableHeaderBg = '#0f172a';
    if (paper) {
      if (paper.classList.contains('theme-navy')) {
        themeAccent = '#2563eb';
        tableHeaderBg = '#1e3a8a';
      } else if (paper.classList.contains('theme-charcoal')) {
        themeAccent = '#475569';
        tableHeaderBg = '#1e293b';
      } else if (paper.classList.contains('theme-indigo')) {
        themeAccent = '#6366f1';
        tableHeaderBg = '#312e81';
      }
    }

    // Create wrapper container with exact A4 proportions (210mm x 297mm => 794px x 1123px at 96 DPI)
    const container = document.createElement('div');
    container.id = 'printableInvoiceA4';
    container.style.cssText = `
      width: 794px;
      min-height: 1123px;
      padding: 44px 48px;
      box-sizing: border-box;
      background: #ffffff;
      color: #0f172a;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      line-height: 1.5;
      position: fixed;
      left: -9999px;
      top: 0;
      z-index: -9999;
      box-shadow: none;
    `;

    // Construct table rows HTML
    let tableRowsHtml = '';
    if (items.length === 0) {
      tableRowsHtml = `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td colspan="4" style="padding: 16px 14px; text-align: center; color: #94a3b8; font-style: italic;">
            No items listed.
          </td>
        </tr>
      `;
    } else {
      items.forEach((item, idx) => {
        const bg = idx % 2 === 1 ? '#fafbfd' : '#ffffff';
        tableRowsHtml += `
          <tr style="border-bottom: 1px solid #e2e8f0; background-color: ${bg};">
            <td style="padding: 12px 14px; vertical-align: top;">
              <div style="font-weight: 600; font-size: 13px; color: #0f172a; line-height: 1.35;">
                ${this.escapeHtml(item.desc || 'Item Description')}
              </div>
              ${item.subtext ? `<div style="font-size: 11px; color: #64748b; margin-top: 3px; line-height: 1.3;">${this.escapeHtml(item.subtext)}</div>` : ''}
            </td>
            <td style="padding: 12px 14px; text-align: right; vertical-align: top; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #334155;">
              ${this.escapeHtml(item.qty)}
            </td>
            <td style="padding: 12px 14px; text-align: right; vertical-align: top; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #334155;">
              ${window.invoiceStore ? window.invoiceStore.formatMoney(parseFloat(item.rate) || 0) : this.escapeHtml(item.rate)}
            </td>
            <td style="padding: 12px 14px; text-align: right; vertical-align: top; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 13px; color: #0f172a;">
              ${this.escapeHtml(item.amount)}
            </td>
          </tr>
        `;
      });
    }

    container.innerHTML = `
      <!-- Top Header Row (Sender Info & Document Details) -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 1px solid #e2e8f0; margin-bottom: 24px;">
        
        <!-- Left: Logo & Sender -->
        <div style="max-width: 380px;">
          ${logoSrc ? `
            <div style="margin-bottom: 14px;">
              <img src="${logoSrc}" alt="Company Logo" style="max-height: 60px; max-width: 190px; object-fit: contain; display: block;">
            </div>
          ` : ''}
          <div style="font-size: 18px; font-weight: 800; color: #0f172a; line-height: 1.25; margin-bottom: 4px; letter-spacing: -0.02em;">
            ${this.escapeHtml(senderName || 'Your Business Name')}
          </div>
          <div style="font-size: 12px; color: #475569; white-space: pre-wrap; line-height: 1.6;">
            ${this.escapeHtml(senderAddress || '')}
          </div>
        </div>

        <!-- Right: Title & Meta -->
        <div style="min-width: 250px; text-align: right;">
          <div style="font-size: 32px; font-weight: 800; color: #0f172a; letter-spacing: -0.03em; line-height: 1; margin-bottom: 12px;">
            ${this.escapeHtml(invoiceTitle)}
          </div>
          
          <table style="margin-left: auto; border-collapse: collapse; font-size: 12px; color: #475569; text-align: right;">
            <tr>
              <td style="padding: 3px 10px 3px 0; font-weight: 600; color: #64748b;">Invoice #:</td>
              <td style="padding: 3px 0; font-weight: 700; color: #0f172a; font-family: 'JetBrains Mono', monospace;">${this.escapeHtml(invoiceNumber)}</td>
            </tr>
            <tr>
              <td style="padding: 3px 10px 3px 0; font-weight: 600; color: #64748b;">Date:</td>
              <td style="padding: 3px 0; font-weight: 600; color: #0f172a;">${this.escapeHtml(invoiceDate)}</td>
            </tr>
            <tr>
              <td style="padding: 3px 10px 3px 0; font-weight: 600; color: #64748b;">Terms:</td>
              <td style="padding: 3px 0; font-weight: 600; color: #0f172a;">${this.escapeHtml(paymentTerms)}</td>
            </tr>
            ${dueDate ? `
              <tr>
                <td style="padding: 3px 10px 3px 0; font-weight: 600; color: #64748b;">Due Date:</td>
                <td style="padding: 3px 0; font-weight: 600; color: #0f172a;">${this.escapeHtml(dueDate)}</td>
              </tr>
            ` : ''}
            ${poNumber ? `
              <tr>
                <td style="padding: 3px 10px 3px 0; font-weight: 600; color: #64748b;">PO Number:</td>
                <td style="padding: 3px 0; font-weight: 600; color: #0f172a; font-family: 'JetBrains Mono', monospace;">${this.escapeHtml(poNumber)}</td>
              </tr>
            ` : ''}
          </table>

          <!-- Balance Due Ribbon -->
          <div style="margin-top: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 14px; display: inline-flex; align-items: center; gap: 10px;">
            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">Balance Due:</span>
            <span style="font-size: 15px; font-weight: 800; color: ${themeAccent}; font-family: 'JetBrains Mono', monospace;">${this.escapeHtml(balanceDue)}</span>
          </div>
        </div>
      </div>

      <!-- Billing & Shipping Section -->
      <div style="display: flex; gap: 32px; margin-bottom: 24px;">
        <!-- Bill To -->
        <div style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px;">
          <div style="font-size: 10px; font-weight: 700; color: #64748b; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 6px;">
            BILL TO (CLIENT)
          </div>
          <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 3px;">
            ${this.escapeHtml(clientName || 'Client Name / Company')}
          </div>
          <div style="font-size: 12px; color: #475569; white-space: pre-wrap; line-height: 1.5;">
            ${this.escapeHtml(clientAddress || '')}
          </div>
        </div>

        <!-- Ship To (Optional) -->
        ${(isShipToVisible && (shipToName || shipToAddress)) ? `
          <div style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px;">
            <div style="font-size: 10px; font-weight: 700; color: #64748b; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 6px;">
              SHIP TO (DESTINATION)
            </div>
            <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 3px;">
              ${this.escapeHtml(shipToName || '')}
            </div>
            <div style="font-size: 12px; color: #475569; white-space: pre-wrap; line-height: 1.5;">
              ${this.escapeHtml(shipToAddress || '')}
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Items Table -->
      <div style="margin-bottom: 24px; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: ${tableHeaderBg}; color: #ffffff;">
              <th style="width: 50%; text-align: left; padding: 11px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
                Item / Service Description
              </th>
              <th style="width: 15%; text-align: right; padding: 11px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
                Quantity
              </th>
              <th style="width: 15%; text-align: right; padding: 11px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
                Rate
              </th>
              <th style="width: 20%; text-align: right; padding: 11px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
      </div>

      <!-- Bottom Section: Notes & Totals Grid -->
      <div style="display: flex; gap: 32px; justify-content: space-between; align-items: flex-start; margin-bottom: 28px;">
        
        <!-- Left: Payment Notes & Digital Signature -->
        <div style="flex: 1; max-width: 400px;">
          ${notes ? `
            <div style="margin-bottom: 16px;">
              <div style="font-size: 10px; font-weight: 700; color: #64748b; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 6px;">
                PAYMENT DETAILS & NOTES
              </div>
              <div style="font-size: 12px; color: #334155; white-space: pre-wrap; line-height: 1.6; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 14px;">
                ${this.escapeHtml(notes)}
              </div>
            </div>
          ` : ''}

          <!-- Digital Signature Block -->
          ${(isSigVisible && signature) ? `
            <div style="margin-top: 18px;">
              <div style="font-size: 10px; font-weight: 700; color: #64748b; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 8px;">
                AUTHORIZED SIGNATURE
              </div>
              <div style="border-top: 1px solid #94a3b8; width: 220px; padding-top: 6px;">
                <div style="font-weight: 700; font-size: 13px; color: #0f172a;">${this.escapeHtml(signature)}</div>
                <div style="font-size: 10px; color: #64748b;">Authorized Representative</div>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Right: Totals Breakdown Card -->
        <div style="width: 270px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 18px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Subtotal:</td>
              <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #0f172a; font-family: 'JetBrains Mono', monospace;">${this.escapeHtml(subtotal)}</td>
            </tr>
            ${hasDiscount ? `
              <tr>
                <td style="padding: 4px 0; color: #64748b;">Discount (${this.escapeHtml(discountRate)}%):</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #e11d48; font-family: 'JetBrains Mono', monospace;">${this.escapeHtml(discountAmt)}</td>
              </tr>
            ` : ''}
            ${parseFloat(taxRate) > 0 ? `
              <tr>
                <td style="padding: 4px 0; color: #64748b;">Tax / VAT (${this.escapeHtml(taxRate)}%):</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #0f172a; font-family: 'JetBrains Mono', monospace;">${this.escapeHtml(taxAmt)}</td>
              </tr>
            ` : ''}
            ${hasShipping ? `
              <tr>
                <td style="padding: 4px 0; color: #64748b;">Shipping Fee:</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #0f172a; font-family: 'JetBrains Mono', monospace;">${this.escapeHtml(shippingAmt)}</td>
              </tr>
            ` : ''}
            <tr style="border-top: 1px solid #cbd5e1;">
              <td style="padding: 10px 0 6px; font-weight: 800; font-size: 14px; color: #0f172a;">Total:</td>
              <td style="padding: 10px 0 6px; text-align: right; font-weight: 800; font-size: 15px; color: #0f172a; font-family: 'JetBrains Mono', monospace;">${this.escapeHtml(grandTotal)}</td>
            </tr>
            ${hasAmountPaid ? `
              <tr>
                <td style="padding: 4px 0; color: #64748b;">Amount Paid:</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #059669; font-family: 'JetBrains Mono', monospace;">${this.escapeHtml(amountPaidAmt)}</td>
              </tr>
            ` : ''}
          </table>

          <!-- Balance Due Box inside totals -->
          <div style="margin-top: 10px; padding: 8px 12px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 700; font-size: 12px; color: #0f172a;">Balance Due:</span>
            <span style="font-weight: 800; font-size: 14px; color: ${themeAccent}; font-family: 'JetBrains Mono', monospace;">${this.escapeHtml(balanceDue)}</span>
          </div>
        </div>

      </div>

      <!-- Subtle Professional Footer -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 14px; text-align: center; font-size: 11px; color: #94a3b8;">
        Thank you for your business!
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

      // Build isolated, pixel-perfect A4 printable container
      const printableElement = this.buildPrintableA4Element();
      document.body.appendChild(printableElement);

      const state = window.invoiceStore ? window.invoiceStore.getState() : {};
      const invNumber = (document.getElementById('invoiceNumber')?.value || state.number || '001').replace(/[^a-zA-Z0-9-_]/g, '_');
      const filename = `Invoice_${invNumber}.pdf`;

      // ISO A4 exact calibration (210mm x 297mm)
      const opt = {
        margin: 0,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2.5, // 240-300 DPI high-resolution
          useCORS: true,
          logging: false,
          letterRendering: true,
          width: 794,
          windowWidth: 794,
          backgroundColor: '#ffffff'
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait'
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      // Generate & save
      await html2pdf().set(opt).from(printableElement).save();

      // Clean up temporary DOM element
      if (printableElement.parentNode) {
        printableElement.parentNode.removeChild(printableElement);
      }

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
