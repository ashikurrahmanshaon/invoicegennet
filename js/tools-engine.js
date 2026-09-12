/**
 * Invoice-Gen.net - Shared Tools Interactive Engine
 * Powers Invoice Number Generator, GST/Tax Calculator, Freelance Billing, Payment Estimator & TOC Spy
 */

(function () {
  'use strict';

  // --- Toast Notification Helper ---
  function showToast(message, type = 'success') {
    let container = document.getElementById('toolToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toolToastContainer';
      container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none;';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `tool-toast toast-${type}`;
    const bg = type === 'success' ? '#059669' : type === 'info' ? '#0f172a' : '#e11d48';
    toast.style.cssText = `background:${bg};color:#ffffff;padding:10px 18px;border-radius:8px;font-size:0.875rem;font-weight:600;box-shadow:0 4px 14px rgba(15,23,42,0.18);pointer-events:auto;display:flex;align-items:center;gap:8px;transition:opacity 0.2s ease, transform 0.2s ease;`;
    toast.innerHTML = `<span>${message}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      setTimeout(() => toast.remove(), 200);
    }, 2600);
  }
  window.showToolToast = showToast;

  // --- Copy to Clipboard Helper ---
  async function copyText(text, successMsg = 'Copied to clipboard!') {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      showToast(successMsg, 'success');
    } catch (err) {
      showToast('Could not copy to clipboard', 'error');
    }
  }
  window.copyToolText = copyText;

  // ==========================================================================
  // 1. INVOICE NUMBER GENERATOR ENGINE
  // ==========================================================================
  function initInvoiceNumberGenerator() {
    const presetSelect = document.getElementById('numFormatPreset');
    const customPatternGroup = document.getElementById('customPatternGroup');
    const customPatternInput = document.getElementById('customPatternInput');
    const prefixInput = document.getElementById('numPrefix');
    const patternSelect = document.getElementById('numPattern') || document.getElementById('numDateFormat');
    const startNumInput = document.getElementById('numStart');
    const paddingInput = document.getElementById('numPadding');
    const sepSelect = document.getElementById('numSeparator');
    const countSelect = document.getElementById('numCount') || document.getElementById('numBatchCount');
    const listEl = document.getElementById('numSeriesList');
    const tableBody = document.getElementById('sequenceListBody');
    const activeNumberDisplay = document.getElementById('activeGeneratedNumber');
    const uniquenessBadge = document.getElementById('uniquenessBadge');
    
    const copySingleBtn = document.getElementById('btnCopyNumber');
    const copyAllBtn = document.getElementById('btnCopyAllNumbers');
    const downloadCsvBtn = document.getElementById('btnDownloadCsv');
    const regenerateBtn = document.getElementById('btnRegenerateNumbers');
    const sendToEditorBtn = document.getElementById('btnSendNumToEditor') || document.getElementById('btnUseInInvoice');

    if (!prefixInput) return;

    if (presetSelect) {
      presetSelect.addEventListener('change', () => {
        if (customPatternGroup) {
          customPatternGroup.style.display = presetSelect.value === 'custom' ? 'flex' : 'none';
        }
        generateNumbers();
      });
    }

    let checkDebounceTimer = null;
    async function checkServerUniqueness(number) {
      if (!uniquenessBadge) return;
      try {
        const res = await fetch(`/api/invoices/check-number?number=${encodeURIComponent(number)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.available) {
          uniquenessBadge.style.background = '#ecfdf5';
          uniquenessBadge.style.color = '#059669';
          uniquenessBadge.style.borderColor = '#a7f3d0';
          uniquenessBadge.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>Server-Verified Unique</span>
          `;
        } else {
          uniquenessBadge.style.background = '#fef2f2';
          uniquenessBadge.style.color = '#dc2626';
          uniquenessBadge.style.borderColor = '#fecaca';
          uniquenessBadge.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span>In Use in Your Account</span>
          `;
        }
      } catch (e) {
        // network or unauthenticated
      }
    }

    function generateNumbers() {
      const preset = presetSelect ? presetSelect.value : 'prefix_num';
      const customPat = customPatternInput ? customPatternInput.value.trim() : '';
      const prefix = (prefixInput.value || '').trim();
      const start = parseInt(startNumInput.value, 10) || 1;
      const padding = parseInt(paddingInput.value, 10) || 3;
      const sep = sepSelect ? sepSelect.value : '-';
      const count = parseInt(countSelect ? countSelect.value : 5, 10) || 5;

      const now = new Date();
      const yyyy = String(now.getFullYear());
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');

      const results = [];
      for (let i = 0; i < count; i++) {
        const curNum = start + i;
        const padded = String(curNum).padStart(padding, '0');

        let formatted = '';
        if (preset === 'prefix_num') {
          formatted = `${prefix}${sep}${padded}`;
        } else if (preset === 'year_prefix_num') {
          formatted = `${yyyy}${sep}${prefix}${sep}${padded}`;
        } else if (preset === 'prefix_year_num') {
          formatted = `${prefix}/${yyyy}/${padded}`;
        } else if (preset === 'custom' && customPat) {
          formatted = customPat
            .replace(/\{PREFIX\}/g, prefix)
            .replace(/\{YEAR\}/g, yyyy)
            .replace(/\{MONTH\}/g, mm)
            .replace(/\{DAY\}/g, dd)
            .replace(/\{NUMBER\}/g, padded);
        } else {
          formatted = `${prefix}${sep}${padded}`;
        }
        results.push(formatted);
      }

      // Update primary large display
      if (activeNumberDisplay && results.length > 0) {
        activeNumberDisplay.textContent = results[0];
        clearTimeout(checkDebounceTimer);
        checkDebounceTimer = setTimeout(() => checkServerUniqueness(results[0]), 300);
      }

      // Update Table Body (if present)
      if (tableBody) {
        tableBody.innerHTML = '';
        results.forEach((numStr, idx) => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td style="color: #64748b; font-weight: 600;">#${idx + 1}</td>
            <td style="font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #0f172a;">${numStr}</td>
            <td style="color: #64748b; font-size: 0.8125rem;">Format: ${preset} (${padding}-digit pad)</td>
            <td style="text-align: right;">
              <button type="button" class="btn-copy-row" style="border: 1px solid #cbd5e1; background: #f8fafc; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; cursor: pointer; color: #334155;">Copy</button>
            </td>
          `;
          const btn = tr.querySelector('.btn-copy-row');
          btn.onclick = () => copyText(numStr, `Copied ${numStr}`);
          tableBody.appendChild(tr);
        });
      }

      return results;
    }

    // Event listeners
    [presetSelect, customPatternInput, prefixInput, patternSelect, startNumInput, paddingInput, sepSelect, countSelect].forEach(el => {
      if (el) {
        el.addEventListener('input', generateNumbers);
        el.addEventListener('change', generateNumbers);
      }
    });

    if (copySingleBtn) {
      copySingleBtn.onclick = () => {
        const nums = generateNumbers();
        if (nums && nums.length) copyText(nums[0], `Copied ${nums[0]}`);
      };
    }

    if (copyAllBtn) {
      copyAllBtn.onclick = () => {
        const nums = generateNumbers();
        if (nums && nums.length) copyText(nums.join('\n'), `Copied ${nums.length} invoice numbers!`);
      };
    }

    if (downloadCsvBtn) {
      downloadCsvBtn.onclick = () => {
        const nums = generateNumbers();
        if (!nums || !nums.length) return;
        const nowIso = new Date().toISOString();
        let csvContent = 'Index,Invoice Number,Created Date,Status\n';
        nums.forEach((n, i) => {
          csvContent += `"${i + 1}","${n}","${nowIso}","Available"\n`;
        });
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-numbers-${nums[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Downloaded CSV sequence!', 'success');
      };
    }

    if (regenerateBtn) regenerateBtn.onclick = generateNumbers;

    if (sendToEditorBtn) {
      sendToEditorBtn.onclick = (e) => {
        e.preventDefault();
        const nums = generateNumbers();
        if (nums && nums.length) {
          localStorage.setItem('pending_invoice_number', nums[0]);
          window.location.href = 'index.html';
        }
      };
    }

    // Initial run
    generateNumbers();
  }

  // ==========================================================================
  // 2. GST & TAX INVOICE CALCULATOR ENGINE
  // ==========================================================================
  function initGSTCalculator() {
    const subtotalInput = document.getElementById('gstSubtotal');
    const currencySelect = document.getElementById('gstCurrency');
    const regimeSelect = document.getElementById('gstRegime');
    const customRateGroup = document.getElementById('gstCustomRateGroup');
    const customRateInput = document.getElementById('gstCustomRate');
    const taxTypeSelect = document.getElementById('gstTaxType');
    const discountInput = document.getElementById('gstDiscountPercent') || document.getElementById('gstDiscount');
    const hsnInput = document.getElementById('gstHsn');

    const displaySubtotal = document.getElementById('gstDisplaySubtotal') || document.getElementById('outGstSubtotal');
    const discountRow = document.getElementById('gstDiscountRow') || document.getElementById('outGstDiscountRow');
    const displayDiscount = document.getElementById('gstDisplayDiscount') || document.getElementById('outGstDiscount');
    const displayBase = document.getElementById('gstDisplayBase');
    const taxBreakdownContainer = document.getElementById('gstTaxBreakdownContainer') || document.getElementById('outGstTaxBreakdown');
    const displayTotal = document.getElementById('gstDisplayTotal') || document.getElementById('outGstTotal');

    const copyBtn = document.getElementById('btnCopyGstBreakdown') || document.getElementById('btnCopyGstSummary');
    const printBtn = document.getElementById('btnPrintGstSummary') || document.getElementById('btnPrintGst');
    const useInInvoiceBtn = document.getElementById('btnUseGstInInvoice') || document.getElementById('btnCreateFullGstInvoice');

    if (!subtotalInput || !regimeSelect) return;

    function calculate() {
      const sym = currencySelect ? currencySelect.value : '$';
      const subtotal = parseFloat(subtotalInput.value) || 0;
      const discountPct = parseFloat(discountInput ? discountInput.value : 0) || 0;
      const regime = regimeSelect.value;
      const isInclusive = taxTypeSelect ? taxTypeSelect.value === 'inclusive' : false;

      let taxRate = 18;
      let isIndiaIntra = false;
      let isIndiaInter = false;
      let label = 'Tax';

      if (regime === 'in_intra' || regime === 'in_intra_18') {
        taxRate = 18;
        isIndiaIntra = true;
      } else if (regime === 'in_inter' || regime === 'in_inter_18') {
        taxRate = 18;
        isIndiaInter = true;
      } else if (regime === 'au_gst' || regime === 'au_gst_10') {
        taxRate = 10;
        label = 'Australia GST (10%)';
      } else if (regime === 'uk_vat' || regime === 'uk_vat_20') {
        taxRate = 20;
        label = 'UK VAT (20%)';
      } else if (regime === 'uk_vat_reduced' || regime === 'in_intra_5') {
        taxRate = 5;
        label = 'Reduced VAT / GST (5%)';
      } else if (regime === 'ca_gst') {
        taxRate = 5;
        label = 'Canada GST (5%)';
      } else if (regime === 'custom') {
        if (customRateGroup) customRateGroup.style.display = 'block';
        taxRate = parseFloat(customRateInput ? customRateInput.value : 0) || 0;
        label = `Custom Tax (${taxRate}%)`;
      }

      if (regime !== 'custom' && customRateGroup) {
        customRateGroup.style.display = 'none';
      }

      // Math: Discount
      const discountAmount = subtotal * (discountPct / 100);
      const netAfterDiscount = Math.max(0, subtotal - discountAmount);

      let taxableBase = netAfterDiscount;
      let taxAmount = 0;
      let grandTotal = 0;

      if (isInclusive) {
        // Price includes tax: base = total / (1 + rate)
        taxableBase = netAfterDiscount / (1 + (taxRate / 100));
        taxAmount = netAfterDiscount - taxableBase;
        grandTotal = netAfterDiscount;
      } else {
        // Price excludes tax: tax = base * rate
        taxableBase = netAfterDiscount;
        taxAmount = taxableBase * (taxRate / 100);
        grandTotal = taxableBase + taxAmount;
      }

      // Update DOM
      if (displaySubtotal) displaySubtotal.textContent = `${sym}${subtotal.toFixed(2)}`;
      
      if (discountRow && displayDiscount) {
        if (discountPct > 0) {
          discountRow.style.display = 'flex';
          displayDiscount.textContent = `-${sym}${discountAmount.toFixed(2)} (${discountPct}%)`;
        } else {
          discountRow.style.display = 'none';
        }
      }

      if (displayBase) displayBase.textContent = `${sym}${taxableBase.toFixed(2)}`;

      if (taxBreakdownContainer) {
        if (isIndiaIntra) {
          const halfRate = taxRate / 2;
          const cgst = taxAmount / 2;
          const sgst = taxAmount / 2;
          taxBreakdownContainer.innerHTML = `
            <div style="display:flex;justify-content:space-between;padding:3px 0;color:#059669;">
              <span>CGST (${halfRate}%):</span>
              <strong style="font-family:'JetBrains Mono',monospace;">+${sym}${cgst.toFixed(2)}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;padding:3px 0;color:#059669;">
              <span>SGST (${halfRate}%):</span>
              <strong style="font-family:'JetBrains Mono',monospace;">+${sym}${sgst.toFixed(2)}</strong>
            </div>
          `;
        } else if (isIndiaInter) {
          taxBreakdownContainer.innerHTML = `
            <div style="display:flex;justify-content:space-between;padding:3px 0;color:#059669;">
              <span>IGST (${taxRate}%):</span>
              <strong style="font-family:'JetBrains Mono',monospace;">+${sym}${taxAmount.toFixed(2)}</strong>
            </div>
          `;
        } else {
          taxBreakdownContainer.innerHTML = `
            <div style="display:flex;justify-content:space-between;padding:3px 0;color:#059669;">
              <span>${label}:</span>
              <strong style="font-family:'JetBrains Mono',monospace;">+${sym}${taxAmount.toFixed(2)}</strong>
            </div>
          `;
        }
      }

      if (displayTotal) displayTotal.textContent = `${sym}${grandTotal.toFixed(2)}`;

      return {
        sym,
        subtotal,
        discountPct,
        discountAmount,
        taxableBase,
        taxRate,
        taxAmount,
        grandTotal,
        hsn: hsnInput ? hsnInput.value : ''
      };
    }

    // Attach listeners
    [subtotalInput, currencySelect, regimeSelect, customRateInput, taxTypeSelect, discountInput, hsnInput].forEach(el => {
      if (el) {
        el.addEventListener('input', calculate);
        el.addEventListener('change', calculate);
      }
    });

    if (copyBtn) {
      copyBtn.onclick = () => {
        const d = calculate();
        const text = `Tax Invoice Breakdown\nGross Subtotal: ${d.sym}${d.subtotal.toFixed(2)}\nDiscount: -${d.sym}${d.discountAmount.toFixed(2)}\nTaxable Base: ${d.sym}${d.taxableBase.toFixed(2)}\nTax (${d.taxRate}%): +${d.sym}${d.taxAmount.toFixed(2)}\nTotal Balance Due: ${d.sym}${d.grandTotal.toFixed(2)}`;
        copyText(text, 'Tax breakdown copied to clipboard!');
      };
    }

    if (printBtn) {
      printBtn.onclick = () => window.print();
    }

    if (useInInvoiceBtn) {
      useInInvoiceBtn.onclick = (e) => {
        e.preventDefault();
        const d = calculate();
        const pending = {
          items: [{ description: `Taxable Goods / Services (HSN: ${d.hsn || '9983'})`, quantity: 1, rate: d.taxableBase }],
          taxPercent: d.taxRate,
          discountPercent: d.discountPct
        };
        sessionStorage.setItem('pending_invoice_preset', JSON.stringify(pending));
        window.location.href = 'index.html';
      };
    }

    // Initial run
    calculate();
  }

  // ==========================================================================
  // 3. FREELANCE INVOICE CALCULATOR ENGINE
  // ==========================================================================
  function initFreelanceCalculator() {
    const currencySelect = document.getElementById('flCurrency');
    const rateInput = document.getElementById('flRate') || document.getElementById('freeHourlyRate');
    const hoursInput = document.getElementById('flHours') || document.getElementById('freeHours');
    const fixedFeeInput = document.getElementById('flFixedFee') || document.getElementById('freeFixedFee');
    const expensesInput = document.getElementById('flExpenses') || document.getElementById('freeExpenses');
    const taxInput = document.getElementById('flTaxRate') || document.getElementById('freeTax');

    const displayLabor = document.getElementById('flDisplayLabor') || document.getElementById('outFreeLabor');
    const displayMilestone = document.getElementById('flDisplayMilestone');
    const displayExpenses = document.getElementById('flDisplayExpenses') || document.getElementById('outFreeExpenses');
    const displaySubtotal = document.getElementById('flDisplaySubtotal');
    const taxRow = document.getElementById('flTaxRow');
    const displayTax = document.getElementById('flDisplayTax') || document.getElementById('outFreeTax');
    const displayTotal = document.getElementById('flDisplayTotal') || document.getElementById('outFreeTotal');
    const laborSummary = document.getElementById('flLaborSummary');

    const copyBtn = document.getElementById('btnCopyFreelanceSummary');
    const printBtn = document.getElementById('btnPrintFreelanceSummary') || document.getElementById('btnPrintFreelance');
    const useInInvoiceBtn = document.getElementById('btnUseFreelanceInInvoice') || document.getElementById('btnCreateFreelanceInvoice');

    if (!rateInput && !fixedFeeInput) return;

    function calculate() {
      const sym = currencySelect ? currencySelect.value : '$';
      const rate = parseFloat(rateInput ? rateInput.value : 0) || 0;
      const hours = parseFloat(hoursInput ? hoursInput.value : 0) || 0;
      const fixedFee = parseFloat(fixedFeeInput ? fixedFeeInput.value : 0) || 0;
      const expenses = parseFloat(expensesInput ? expensesInput.value : 0) || 0;
      const taxRate = parseFloat(taxInput ? taxInput.value : 0) || 0;

      const laborTotal = rate * hours;
      const subtotal = laborTotal + fixedFee + expenses;
      const taxAmount = subtotal * (taxRate / 100);
      const grandTotal = subtotal + taxAmount;

      if (displayLabor) displayLabor.textContent = `${sym}${laborTotal.toFixed(2)}`;
      if (laborSummary) laborSummary.textContent = `${hours} hrs @ ${sym}${rate}/hr`;
      if (displayMilestone) displayMilestone.textContent = `${sym}${fixedFee.toFixed(2)}`;
      if (displayExpenses) displayExpenses.textContent = `${sym}${expenses.toFixed(2)}`;
      if (displaySubtotal) displaySubtotal.textContent = `${sym}${subtotal.toFixed(2)}`;

      if (taxRow && displayTax) {
        if (taxRate > 0) {
          taxRow.style.display = 'flex';
          displayTax.textContent = `+${sym}${taxAmount.toFixed(2)} (${taxRate}%)`;
        } else {
          taxRow.style.display = 'none';
        }
      }

      if (displayTotal) displayTotal.textContent = `${sym}${grandTotal.toFixed(2)}`;

      return { sym, rate, hours, laborTotal, fixedFee, expenses, subtotal, taxRate, taxAmount, grandTotal };
    }

    [currencySelect, rateInput, hoursInput, fixedFeeInput, expensesInput, taxInput].forEach(el => {
      if (el) {
        el.addEventListener('input', calculate);
        el.addEventListener('change', calculate);
      }
    });

    if (copyBtn) {
      copyBtn.onclick = () => {
        const d = calculate();
        const text = `Freelance Billing Statement\nHourly Labor (${d.hours} hrs @ ${d.sym}${d.rate}/hr): ${d.sym}${d.laborTotal.toFixed(2)}\nMilestone Deliverable: ${d.sym}${d.fixedFee.toFixed(2)}\nReimbursable Expenses: ${d.sym}${d.expenses.toFixed(2)}\nSubtotal: ${d.sym}${d.subtotal.toFixed(2)}\nTax: +${d.sym}${d.taxAmount.toFixed(2)}\nTotal Balance Due: ${d.sym}${d.grandTotal.toFixed(2)}`;
        copyText(text, 'Freelance billing summary copied!');
      };
    }

    if (printBtn) printBtn.onclick = () => window.print();

    if (useInInvoiceBtn) {
      useInInvoiceBtn.onclick = (e) => {
        e.preventDefault();
        const d = calculate();
        const items = [];
        if (d.hours > 0) {
          items.push({ description: 'Freelance Design & Development Services', quantity: d.hours, rate: d.rate });
        }
        if (d.fixedFee > 0) {
          items.push({ description: 'Fixed Project Milestone Deliverable', quantity: 1, rate: d.fixedFee });
        }
        if (d.expenses > 0) {
          items.push({ description: 'Approved Project Expenses & Licensing', quantity: 1, rate: d.expenses });
        }
        const pending = { items, taxPercent: d.taxRate };
        sessionStorage.setItem('pending_invoice_preset', JSON.stringify(pending));
        window.location.href = 'index.html';
      };
    }

    // Initial run
    calculate();
  }

  // ==========================================================================
  // 4. PAYMENTS & GATEWAY FEE ESTIMATOR ENGINE
  // ==========================================================================
  function initPaymentCalculator() {
    const amountInput = document.getElementById('payInvoiceAmount');
    const gatewaySelect = document.getElementById('payGateway');
    const currencySelect = document.getElementById('payCurrency');
    const grossUpCheckbox = document.getElementById('payGrossUp');

    const outFee = document.getElementById('outPayFee');
    const outNet = document.getElementById('outPayNet');
    const outGrossUpRow = document.getElementById('outPayGrossUpRow');
    const outGrossUpAmount = document.getElementById('outPayGrossUpAmount');
    const copyBtn = document.getElementById('btnCopyPaySummary');
    const useInInvoiceBtn = document.getElementById('btnUsePayInInvoice');

    if (!amountInput) return;

    function calculate() {
      const sym = currencySelect ? currencySelect.value : '$';
      const amount = parseFloat(amountInput.value) || 0;
      const gateway = gatewaySelect ? gatewaySelect.value : 'stripe';
      const isGrossUp = grossUpCheckbox ? grossUpCheckbox.checked : false;

      let pct = 0.029;
      let fixed = 0.30;
      let name = 'Stripe Credit Card';

      if (gateway === 'stripe') {
        pct = 0.029;
        fixed = 0.30;
        name = 'Stripe Card (2.9% + $0.30)';
      } else if (gateway === 'paypal') {
        pct = 0.0349;
        fixed = 0.49;
        name = 'PayPal Express (3.49% + $0.49)';
      } else if (gateway === 'ach') {
        pct = 0.008;
        fixed = 0.00;
        name = 'ACH / Direct Debit (0.8% capped at $5)';
      } else if (gateway === 'wise') {
        pct = 0.0045;
        fixed = 0.00;
        name = 'Wise Bank Transfer (0.45%)';
      }

      let fee = (amount * pct) + fixed;
      if (gateway === 'ach' && fee > 5.00) fee = 5.00;
      if (amount <= 0) fee = 0;

      const net = Math.max(0, amount - fee);

      // Gross-Up: target * (1 - pct) - fixed = amount  =>  target = (amount + fixed) / (1 - pct)
      let grossUpTarget = amount;
      if (pct < 1 && amount > 0) {
        grossUpTarget = (amount + fixed) / (1 - pct);
      }

      if (outFee) outFee.textContent = `${sym}${fee.toFixed(2)}`;
      if (outNet) outNet.textContent = `${sym}${net.toFixed(2)}`;

      if (outGrossUpRow && outGrossUpAmount) {
        if (isGrossUp && amount > 0) {
          outGrossUpRow.style.display = 'flex';
          outGrossUpAmount.textContent = `${sym}${grossUpTarget.toFixed(2)}`;
        } else {
          outGrossUpRow.style.display = 'none';
        }
      }

      return { sym, amount, fee, net, grossUpTarget, name };
    }

    [amountInput, gatewaySelect, currencySelect, grossUpCheckbox].forEach(el => {
      if (el) {
        el.addEventListener('input', calculate);
        el.addEventListener('change', calculate);
      }
    });

    if (copyBtn) {
      copyBtn.onclick = () => {
        const d = calculate();
        const text = `Payment Fee Estimation (${d.name})\nInvoice Total: ${d.sym}${d.amount.toFixed(2)}\nEstimated Fee: -${d.sym}${d.fee.toFixed(2)}\nNet Payout: ${d.sym}${d.net.toFixed(2)}\nTarget Billed for 100% Net: ${d.sym}${d.grossUpTarget.toFixed(2)}`;
        copyText(text, 'Payment calculation copied!');
      };
    }

    if (useInInvoiceBtn) {
      useInInvoiceBtn.onclick = (e) => {
        e.preventDefault();
        const d = calculate();
        const pending = {
          items: [{ description: 'Professional Invoice Settlement', quantity: 1, rate: d.grossUpTarget || d.amount }]
        };
        sessionStorage.setItem('pending_invoice_preset', JSON.stringify(pending));
        window.location.href = 'index.html';
      };
    }

    // Initial run
    calculate();
  }

  // ==========================================================================
  // 5. TABLE OF CONTENTS SCROLL SPY (FOR BLOG DETAIL ARTICLES)
  // ==========================================================================
  function initTableOfContentsSpy() {
    const tocLinks = document.querySelectorAll('.toc-link');
    if (!tocLinks || !tocLinks.length) return;

    const headingIds = Array.from(tocLinks).map(a => a.getAttribute('href').replace('#', ''));
    const headings = headingIds.map(id => document.getElementById(id)).filter(Boolean);

    function onScroll() {
      const scrollPos = window.scrollY + 140;
      let currentId = '';

      for (let i = 0; i < headings.length; i++) {
        const h = headings[i];
        if (h.offsetTop <= scrollPos) {
          currentId = h.id;
        }
      }

      tocLinks.forEach(link => {
        const targetId = link.getAttribute('href').replace('#', '');
        if (targetId === currentId) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ==========================================================================
  // 6. UNIFIED CLOUD FILE SAVER HELPER
  // ==========================================================================
  async function saveToCloud(fileBlob, fileName, fileType = 'document', sourceTool = 'Invoicing Tools', metadata = {}, btnElement = null) {
    if (!fileBlob) {
      showToast('No file data to save.', 'error');
      return false;
    }

    let originalBtnContent = '';
    if (btnElement) {
      originalBtnContent = btnElement.innerHTML;
      btnElement.disabled = true;
      btnElement.innerHTML = `
        <svg class="animate-spin" style="width:16px;height:16px;margin-right:6px;animation:spin 1s linear infinite;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
        Saving to Cloud...
      `;
    }

    try {
      // Convert blob to Base64
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(fileBlob);
      });

      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName,
          fileType,
          mimeType: fileBlob.type || 'application/octet-stream',
          base64Data,
          sourceTool,
          metadata
        })
      });

      const result = await response.json();

      if (response.status === 401) {
        showToast('Please log in to save files to your Cloud Account.', 'error');
        if (btnElement) {
          btnElement.disabled = false;
          btnElement.innerHTML = originalBtnContent;
        }
        // Save redirect and open login prompt
        setTimeout(() => {
          if (confirm('You need an account to save files to Cloud. Would you like to log in now?')) {
            window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
          }
        }, 300);
        return false;
      }

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      showToast('Saved to Cloud ✓', 'success');

      if (btnElement) {
        btnElement.innerHTML = `
          <svg style="width:16px;height:16px;margin-right:6px;" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          <span style="color:#059669;font-weight:700;">Saved to Cloud ✓</span>
        `;
        setTimeout(() => {
          btnElement.disabled = false;
          btnElement.innerHTML = originalBtnContent;
        }, 4000);
      }

      // Log tool usage in background
      fetch('/api/tools/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: sourceTool.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          toolName: sourceTool,
          action: 'saved',
          metadata: { fileName, size: fileBlob.size }
        })
      }).catch(() => {});

      return result.file;
    } catch (err) {
      console.error('Save to Cloud failed:', err);
      showToast('Couldn’t save file. Try again.', 'error');
      if (btnElement) {
        btnElement.disabled = false;
        btnElement.innerHTML = originalBtnContent;
      }
      return false;
    }
  }
  window.saveFileToCloud = saveToCloud;

  // Utility to download blob
  function triggerBlobDownload(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1500);
  }
  window.triggerBlobDownload = triggerBlobDownload;

  // Format bytes helper
  function formatBytes(bytes, decimals = 1) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
  window.formatBytes = formatBytes;

  // ==========================================================================
  // 7. PDF TO JPG ENGINE
  // ==========================================================================
  function initPDFtoJPG() {
    const dropZone = document.getElementById('pdfDropZone');
    const fileInput = document.getElementById('pdfFileInput');
    const fileInfoCard = document.getElementById('pdfFileInfoCard');
    const fileNameEl = document.getElementById('pdfFileName');
    const fileSizeEl = document.getElementById('pdfFileSize');
    const pageCountEl = document.getElementById('pdfPageCount');
    const pageRangeSelect = document.getElementById('pdfPageRangeSelect');
    const customPagesInput = document.getElementById('pdfCustomPages');
    const qualitySelect = document.getElementById('pdfQualitySelect');
    const convertBtn = document.getElementById('btnConvertPdfToJpg');
    const progressContainer = document.getElementById('pdfProgressContainer');
    const progressBar = document.getElementById('pdfProgressBar');
    const progressText = document.getElementById('pdfProgressText');
    const resultsArea = document.getElementById('pdfResultsArea');
    const imageGrid = document.getElementById('pdfJpgGrid');
    const downloadZipBtn = document.getElementById('btnDownloadAllJpgZip');
    const saveCloudZipBtn = document.getElementById('btnSaveJpgZipToCloud');
    const clearBtn = document.getElementById('btnClearPdfToJpg');

    if (!dropZone || !fileInput) return;

    // Configure PDF.js worker
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'js/vendor/pdf.worker.min.js';
    }

    let currentFile = null;
    let currentPdfDoc = null;
    let convertedImages = []; // { pageNum, blob, dataUrl }

    function handleFile(file) {
      if (!file) return;
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        showToast('Unsupported file type. Please upload a valid PDF document.', 'error');
        return;
      }
      if (file.size > 30 * 1024 * 1024) {
        showToast('File is too large. Maximum PDF size is 30 MB.', 'error');
        return;
      }

      currentFile = file;
      fileNameEl.textContent = file.name;
      fileSizeEl.textContent = formatBytes(file.size);
      fileInfoCard.style.display = 'block';
      resultsArea.style.display = 'none';
      imageGrid.innerHTML = '';
      convertedImages = [];

      // Load PDF metadata
      const fileReader = new FileReader();
      fileReader.onload = async function () {
        try {
          const typedarray = new Uint8Array(this.result);
          currentPdfDoc = await window.pdfjsLib.getDocument({ data: typedarray }).promise;
          pageCountEl.textContent = `${currentPdfDoc.numPages} ${currentPdfDoc.numPages === 1 ? 'Page' : 'Pages'}`;
          convertBtn.disabled = false;
        } catch (err) {
          console.error(err);
          showToast('This PDF appears to be corrupted or password-protected.', 'error');
          currentFile = null;
          currentPdfDoc = null;
          fileInfoCard.style.display = 'none';
        }
      };
      fileReader.readAsArrayBuffer(file);
    }

    // Drag & Drop
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('border-emerald-500', 'bg-emerald-50');
    });
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('border-emerald-500', 'bg-emerald-50');
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-emerald-500', 'bg-emerald-50');
      if (e.dataTransfer.files && e.dataTransfer.files.length) {
        handleFile(e.dataTransfer.files[0]);
      }
    });
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length) {
        handleFile(e.target.files[0]);
      }
    });

    if (pageRangeSelect && customPagesInput) {
      pageRangeSelect.addEventListener('change', () => {
        customPagesInput.style.display = pageRangeSelect.value === 'custom' ? 'block' : 'none';
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        currentFile = null;
        currentPdfDoc = null;
        convertedImages = [];
        fileInput.value = '';
        fileInfoCard.style.display = 'none';
        resultsArea.style.display = 'none';
        progressContainer.style.display = 'none';
      });
    }

    if (convertBtn) {
      convertBtn.addEventListener('click', async () => {
        if (!currentPdfDoc) return;

        convertBtn.disabled = true;
        progressContainer.style.display = 'block';
        progressBar.style.width = '0%';
        progressText.textContent = 'Preparing conversion...';
        imageGrid.innerHTML = '';
        convertedImages = [];

        // Quality scale
        const quality = qualitySelect ? qualitySelect.value : 'high';
        let scale = 2.0; // High
        let jpegQuality = 0.92;
        if (quality === 'standard') {
          scale = 1.5;
          jpegQuality = 0.85;
        } else if (quality === 'maximum') {
          scale = 3.0;
          jpegQuality = 0.98;
        }

        // Determine pages to convert
        const totalPages = currentPdfDoc.numPages;
        let pagesToConvert = [];
        if (pageRangeSelect && pageRangeSelect.value === 'custom' && customPagesInput.value.trim()) {
          const rawParts = customPagesInput.value.split(',');
          rawParts.forEach(p => {
            p = p.trim();
            if (p.includes('-')) {
              const [s, e] = p.split('-').map(n => parseInt(n, 10));
              if (!isNaN(s) && !isNaN(e)) {
                for (let i = Math.max(1, s); i <= Math.min(totalPages, e); i++) pagesToConvert.push(i);
              }
            } else {
              const n = parseInt(p, 10);
              if (!isNaN(n) && n >= 1 && n <= totalPages) pagesToConvert.push(n);
            }
          });
          pagesToConvert = Array.from(new Set(pagesToConvert)).sort((a, b) => a - b);
        } else {
          for (let i = 1; i <= totalPages; i++) pagesToConvert.push(i);
        }

        if (!pagesToConvert.length) {
          showToast('No valid pages specified for conversion.', 'error');
          convertBtn.disabled = false;
          progressContainer.style.display = 'none';
          return;
        }

        try {
          for (let idx = 0; idx < pagesToConvert.length; idx++) {
            const pageNum = pagesToConvert[idx];
            progressText.textContent = `Rendering page ${pageNum} of ${totalPages}...`;
            const pct = Math.round(((idx + 1) / pagesToConvert.length) * 100);
            progressBar.style.width = `${pct}%`;

            const page = await currentPdfDoc.getPage(pageNum);
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({ canvasContext: ctx, viewport }).promise;

            const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', jpegQuality));
            const dataUrl = canvas.toDataURL('image/jpeg', jpegQuality);

            convertedImages.push({ pageNum, blob, dataUrl });

            // Create preview card in grid
            const card = document.createElement('div');
            card.style.cssText = 'background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(15,23,42,0.04);display:flex;flex-direction:column;';
            card.innerHTML = `
              <div style="aspect-ratio:3/4;background:#f8fafc;display:flex;align-items:center;justify-content:center;overflow:hidden;border-bottom:1px solid #f1f5f9;">
                <img src="${dataUrl}" alt="Page ${pageNum}" style="max-width:100%;max-height:100%;object-fit:contain;" />
              </div>
              <div style="padding:12px;display:flex;align-items:center;justify-content:space-between;">
                <div>
                  <div style="font-weight:700;font-size:0.875rem;color:#0f172a;">Page ${pageNum}</div>
                  <div style="font-size:0.75rem;color:#64748b;">${formatBytes(blob.size)}</div>
                </div>
                <button type="button" class="btn-dl-page" style="padding:6px 12px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:6px;font-size:0.75rem;font-weight:700;color:#0f172a;cursor:pointer;">Download JPG</button>
              </div>
            `;
            card.querySelector('.btn-dl-page').onclick = () => {
              const baseName = currentFile.name.replace(/\.[^/.]+$/, '');
              triggerBlobDownload(blob, `${baseName}-page-${pageNum}.jpg`);
            };
            imageGrid.appendChild(card);
          }

          progressText.textContent = `Completed! Converted ${convertedImages.length} pages.`;
          resultsArea.style.display = 'block';
          showToast(`Successfully converted ${convertedImages.length} pages!`, 'success');

          // Log tool event
          fetch('/api/tools/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              toolId: 'pdf-to-jpg',
              toolName: 'PDF to JPG',
              action: 'converted',
              metadata: { pages: convertedImages.length, originalName: currentFile.name }
            })
          }).catch(() => {});

        } catch (err) {
          console.error(err);
          showToast('Conversion failed. Please try again.', 'error');
        } finally {
          convertBtn.disabled = false;
        }
      });
    }

    // Download All as ZIP
    if (downloadZipBtn) {
      downloadZipBtn.addEventListener('click', async () => {
        if (!convertedImages.length || !window.JSZip) return;
        downloadZipBtn.disabled = true;
        downloadZipBtn.textContent = 'Bundling ZIP...';

        try {
          const zip = new window.JSZip();
          const baseName = currentFile ? currentFile.name.replace(/\.[^/.]+$/, '') : 'document';

          convertedImages.forEach(img => {
            zip.file(`${baseName}-page-${img.pageNum}.jpg`, img.blob);
          });

          const zipBlob = await zip.generateAsync({ type: 'blob' });
          triggerBlobDownload(zipBlob, `${baseName}-images.zip`);
          showToast('ZIP archive downloaded!', 'success');
        } catch (err) {
          console.error(err);
          showToast('Failed to create ZIP package.', 'error');
        } finally {
          downloadZipBtn.disabled = false;
          downloadZipBtn.textContent = 'Download All as ZIP';
        }
      });
    }

    // Save ZIP to Cloud
    if (saveCloudZipBtn) {
      saveCloudZipBtn.addEventListener('click', async () => {
        if (!convertedImages.length || !window.JSZip) return;
        const zip = new window.JSZip();
        const baseName = currentFile ? currentFile.name.replace(/\.[^/.]+$/, '') : 'document';
        convertedImages.forEach(img => {
          zip.file(`${baseName}-page-${img.pageNum}.jpg`, img.blob);
        });
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        await saveToCloud(zipBlob, `${baseName}-images.zip`, 'export', 'PDF to JPG', { pages: convertedImages.length }, saveCloudZipBtn);
      });
    }
  }

  // ==========================================================================
  // 8. JPG TO PDF ENGINE
  // ==========================================================================
  function initJPGtoPDF() {
    const dropZone = document.getElementById('jpgDropZone');
    const fileInput = document.getElementById('jpgFileInput');
    const imageList = document.getElementById('jpgImageList');
    const emptyState = document.getElementById('jpgEmptyState');
    const pageSizeSelect = document.getElementById('jpgPageSize');
    const orientationSelect = document.getElementById('jpgOrientation');
    const marginSelect = document.getElementById('jpgMargin');
    const createPdfBtn = document.getElementById('btnCreateJpgToPdf');
    const downloadPdfBtn = document.getElementById('btnDownloadJpgPdf');
    const saveCloudPdfBtn = document.getElementById('btnSaveJpgPdfToCloud');
    const previewContainer = document.getElementById('jpgPdfPreviewContainer');
    const pdfObjectPreview = document.getElementById('jpgPdfObjectPreview');
    const clearAllBtn = document.getElementById('btnClearJpgList');

    if (!dropZone || !fileInput) return;

    let images = []; // { id, name, size, type, dataUrl, rotation }
    let generatedPdfBlob = null;

    function renderImageList() {
      if (!images.length) {
        if (emptyState) emptyState.style.display = 'block';
        if (createPdfBtn) createPdfBtn.disabled = true;
        if (imageList) imageList.innerHTML = '';
        return;
      }

      if (emptyState) emptyState.style.display = 'none';
      if (createPdfBtn) createPdfBtn.disabled = false;
      if (!imageList) return;

      imageList.innerHTML = '';
      images.forEach((img, idx) => {
        const item = document.createElement('div');
        item.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:8px;gap:12px;box-shadow:0 1px 3px rgba(15,23,42,0.03);';
        item.innerHTML = `
          <div style="display:flex;align-items:center;gap:12px;min-width:0;">
            <span style="font-weight:700;font-size:0.75rem;color:#94a3b8;width:20px;">#${idx + 1}</span>
            <div style="width:48px;height:48px;border-radius:6px;overflow:hidden;background:#f8fafc;border:1px solid #e2e8f0;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <img src="${img.dataUrl}" style="max-width:100%;max-height:100%;object-fit:cover;transform:rotate(${img.rotation}deg);" />
            </div>
            <div style="min-width:0;">
              <div style="font-weight:700;font-size:0.875rem;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${img.name}</div>
              <div style="font-size:0.75rem;color:#64748b;">${formatBytes(img.size)} • ${img.rotation}°</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
            <button type="button" class="btn-rotate" title="Rotate 90°" style="padding:6px 8px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;cursor:pointer;font-size:0.75rem;font-weight:600;">↻ 90°</button>
            <button type="button" class="btn-up" title="Move Up" ${idx === 0 ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : 'style="cursor:pointer;"'} style="padding:6px 8px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;font-size:0.75rem;">↑</button>
            <button type="button" class="btn-down" title="Move Down" ${idx === images.length - 1 ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : 'style="cursor:pointer;"'} style="padding:6px 8px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;font-size:0.75rem;">↓</button>
            <button type="button" class="btn-remove" title="Remove" style="padding:6px 10px;background:#fee2e2;border:1px solid #fca5a5;border-radius:6px;cursor:pointer;font-size:0.75rem;font-weight:700;color:#991b1b;">✕</button>
          </div>
        `;

        item.querySelector('.btn-rotate').onclick = () => {
          img.rotation = (img.rotation + 90) % 360;
          renderImageList();
        };
        const btnUp = item.querySelector('.btn-up');
        if (btnUp && idx > 0) {
          btnUp.onclick = () => {
            const temp = images[idx];
            images[idx] = images[idx - 1];
            images[idx - 1] = temp;
            renderImageList();
          };
        }
        const btnDown = item.querySelector('.btn-down');
        if (btnDown && idx < images.length - 1) {
          btnDown.onclick = () => {
            const temp = images[idx];
            images[idx] = images[idx + 1];
            images[idx + 1] = temp;
            renderImageList();
          };
        }
        item.querySelector('.btn-remove').onclick = () => {
          images.splice(idx, 1);
          renderImageList();
        };

        imageList.appendChild(item);
      });
    }

    function addFiles(files) {
      Array.from(files).forEach(file => {
        const ext = file.name.toLowerCase();
        if (!ext.match(/\.(jpg|jpeg|png|webp)$/)) {
          showToast(`File "${file.name}" is not a supported image format.`, 'error');
          return;
        }
        if (file.size > 20 * 1024 * 1024) {
          showToast(`"${file.name}" exceeds 20MB limit.`, 'error');
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          images.push({
            id: 'img_' + Math.random().toString(36).substr(2, 9),
            name: file.name,
            size: file.size,
            type: file.type,
            dataUrl: e.target.result,
            rotation: 0
          });
          renderImageList();
        };
        reader.readAsDataURL(file);
      });
    }

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('border-emerald-500', 'bg-emerald-50');
    });
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('border-emerald-500', 'bg-emerald-50');
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-emerald-500', 'bg-emerald-50');
      if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
    });
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      if (e.target.files) addFiles(e.target.files);
    });

    if (clearAllBtn) {
      clearAllBtn.onclick = () => {
        images = [];
        generatedPdfBlob = null;
        if (previewContainer) previewContainer.style.display = 'none';
        renderImageList();
      };
    }

    if (createPdfBtn) {
      createPdfBtn.addEventListener('click', async () => {
        if (!images.length || !window.PDFLib) return;
        createPdfBtn.disabled = true;
        createPdfBtn.textContent = 'Generating PDF...';

        try {
          const { PDFDocument, degrees } = window.PDFLib;
          const pdfDoc = await PDFDocument.create();

          const pageSize = pageSizeSelect ? pageSizeSelect.value : 'a4';
          const orientation = orientationSelect ? orientationSelect.value : 'portrait';
          const marginOpt = marginSelect ? marginSelect.value : 'none';
          const margin = marginOpt === 'small' ? 20 : marginOpt === 'large' ? 40 : 0;

          // Standard dimensions in points
          let defaultWidth = 595.28; // A4 portrait
          let defaultHeight = 841.89;
          if (pageSize === 'letter') {
            defaultWidth = 612;
            defaultHeight = 792;
          }

          for (let i = 0; i < images.length; i++) {
            const imgData = images[i];

            // Render to canvas to handle rotation & WEBP conversion
            const tempImg = new Image();
            tempImg.src = imgData.dataUrl;
            await new Promise((res, rej) => {
              tempImg.onload = res;
              tempImg.onerror = rej;
            });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const isRotated90 = imgData.rotation === 90 || imgData.rotation === 270;
            canvas.width = isRotated90 ? tempImg.naturalHeight : tempImg.naturalWidth;
            canvas.height = isRotated90 ? tempImg.naturalWidth : tempImg.naturalHeight;

            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((imgData.rotation * Math.PI) / 180);
            ctx.drawImage(tempImg, -tempImg.naturalWidth / 2, -tempImg.naturalHeight / 2);

            const renderedBlob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.95));
            const renderedBuffer = await renderedBlob.arrayBuffer();

            const embeddedImage = await pdfDoc.embedJpg(renderedBuffer);

            // Determine page dimensions
            let pWidth = defaultWidth;
            let pHeight = defaultHeight;

            if (pageSize === 'auto') {
              pWidth = canvas.width;
              pHeight = canvas.height;
            } else if (orientation === 'landscape') {
              pWidth = defaultHeight;
              pHeight = defaultWidth;
            }

            const page = pdfDoc.addPage([pWidth, pHeight]);

            // Calculate fit inside margins
            const printableWidth = pWidth - (margin * 2);
            const printableHeight = pHeight - (margin * 2);
            const scale = Math.min(printableWidth / canvas.width, printableHeight / canvas.height);
            const drawWidth = canvas.width * scale;
            const drawHeight = canvas.height * scale;
            const x = margin + (printableWidth - drawWidth) / 2;
            const y = margin + (printableHeight - drawHeight) / 2;

            page.drawImage(embeddedImage, {
              x,
              y,
              width: drawWidth,
              height: drawHeight
            });
          }

          const pdfBytes = await pdfDoc.save();
          generatedPdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

          if (previewContainer && pdfObjectPreview) {
            previewContainer.style.display = 'block';
            pdfObjectPreview.src = URL.createObjectURL(generatedPdfBlob);
          }

          showToast(`Created PDF document with ${images.length} pages!`, 'success');

          // Log tool event
          fetch('/api/tools/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              toolId: 'jpg-to-pdf',
              toolName: 'JPG to PDF',
              action: 'converted',
              metadata: { imageCount: images.length, size: generatedPdfBlob.size }
            })
          }).catch(() => {});

        } catch (err) {
          console.error(err);
          showToast('Failed to create PDF. Please try again.', 'error');
        } finally {
          createPdfBtn.disabled = false;
          createPdfBtn.textContent = 'Create PDF';
        }
      });
    }

    if (downloadPdfBtn) {
      downloadPdfBtn.onclick = () => {
        if (!generatedPdfBlob) return;
        triggerBlobDownload(generatedPdfBlob, 'converted-images.pdf');
      };
    }

    if (saveCloudPdfBtn) {
      saveCloudPdfBtn.onclick = async () => {
        if (!generatedPdfBlob) return;
        await saveToCloud(generatedPdfBlob, 'converted-images.pdf', 'pdf', 'JPG to PDF', { pageCount: images.length }, saveCloudPdfBtn);
      };
    }
  }

  // ==========================================================================
  // 9. IMAGE COMPRESSOR ENGINE
  // ==========================================================================
  function initImageCompressor() {
    const dropZone = document.getElementById('compressDropZone');
    const fileInput = document.getElementById('compressFileInput');
    const workspace = document.getElementById('compressWorkspace');
    const originalPreview = document.getElementById('compressOriginalPreview');
    const compressedPreview = document.getElementById('compressCompressedPreview');
    const originalSizeEl = document.getElementById('compressOriginalSize');
    const compressedSizeEl = document.getElementById('compressCompressedSize');
    const savedPctEl = document.getElementById('compressSavedPct');
    const presetSelect = document.getElementById('compressPreset');
    const qualitySlider = document.getElementById('compressSlider');
    const sliderValEl = document.getElementById('compressSliderVal');
    const downloadBtn = document.getElementById('btnDownloadCompressed');
    const saveCloudBtn = document.getElementById('btnSaveCompressedToCloud');

    if (!dropZone || !fileInput) return;

    let currentFile = null;
    let sourceImage = null;
    let compressedBlob = null;

    function handleFile(file) {
      if (!file || !file.type.startsWith('image/')) {
        showToast('Please upload a valid image (JPG, PNG, or WEBP).', 'error');
        return;
      }
      currentFile = file;
      originalSizeEl.textContent = formatBytes(file.size);

      const reader = new FileReader();
      reader.onload = (e) => {
        sourceImage = new Image();
        sourceImage.onload = () => {
          originalPreview.src = sourceImage.src;
          workspace.style.display = 'block';
          compressImage();
        };
        sourceImage.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    async function compressImage() {
      if (!sourceImage) return;

      let quality = 0.70; // Medium default
      if (presetSelect && presetSelect.value !== 'custom') {
        const p = presetSelect.value;
        quality = p === 'low' ? 0.85 : p === 'high' ? 0.45 : 0.70;
        if (qualitySlider) qualitySlider.value = Math.round(quality * 100);
        if (sliderValEl) sliderValEl.textContent = `${Math.round(quality * 100)}%`;
      } else if (qualitySlider) {
        quality = parseInt(qualitySlider.value, 10) / 100;
        if (sliderValEl) sliderValEl.textContent = `${qualitySlider.value}%`;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = sourceImage.naturalWidth;
      canvas.height = sourceImage.naturalHeight;
      ctx.drawImage(sourceImage, 0, 0);

      const mime = currentFile && currentFile.type === 'image/png' ? 'image/png' : 'image/jpeg';
      compressedBlob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', quality));

      compressedPreview.src = URL.createObjectURL(compressedBlob);
      compressedSizeEl.textContent = formatBytes(compressedBlob.size);

      const savedBytes = Math.max(0, currentFile.size - compressedBlob.size);
      const savedPct = currentFile.size > 0 ? ((savedBytes / currentFile.size) * 100).toFixed(1) : 0;
      savedPctEl.textContent = `-${savedPct}%`;

      if (downloadBtn) downloadBtn.disabled = false;
      if (saveCloudBtn) saveCloudBtn.disabled = false;
    }

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('border-emerald-500', 'bg-emerald-50');
    });
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('border-emerald-500', 'bg-emerald-50');
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-emerald-500', 'bg-emerald-50');
      if (e.dataTransfer.files && e.dataTransfer.files.length) {
        handleFile(e.dataTransfer.files[0]);
      }
    });
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length) {
        handleFile(e.target.files[0]);
      }
    });

    if (presetSelect) {
      presetSelect.addEventListener('change', () => {
        const isCustom = presetSelect.value === 'custom';
        const sliderGroup = document.getElementById('compressSliderGroup');
        if (sliderGroup) sliderGroup.style.display = isCustom ? 'block' : 'none';
        compressImage();
      });
    }

    if (qualitySlider) {
      qualitySlider.addEventListener('input', () => {
        if (sliderValEl) sliderValEl.textContent = `${qualitySlider.value}%`;
        compressImage();
      });
    }

    if (downloadBtn) {
      downloadBtn.onclick = () => {
        if (!compressedBlob || !currentFile) return;
        const nameParts = currentFile.name.split('.');
        const ext = nameParts.pop();
        triggerBlobDownload(compressedBlob, `${nameParts.join('.')}-compressed.jpg`);
      };
    }

    if (saveCloudBtn) {
      saveCloudBtn.onclick = async () => {
        if (!compressedBlob || !currentFile) return;
        const nameParts = currentFile.name.split('.');
        nameParts.pop();
        await saveToCloud(compressedBlob, `${nameParts.join('.')}-compressed.jpg`, 'image', 'Image Compressor', { originalSize: currentFile.size, compressedSize: compressedBlob.size }, saveCloudBtn);
      };
    }
  }

  // ==========================================================================
  // 10. PDF MERGER ENGINE
  // ==========================================================================
  function initPDFMerger() {
    const dropZone = document.getElementById('mergeDropZone');
    const fileInput = document.getElementById('mergeFileInput');
    const listContainer = document.getElementById('mergePdfList');
    const emptyState = document.getElementById('mergeEmptyState');
    const mergeBtn = document.getElementById('btnMergePdfs');
    const downloadBtn = document.getElementById('btnDownloadMergedPdf');
    const saveCloudBtn = document.getElementById('btnSaveMergedPdfToCloud');
    const resultArea = document.getElementById('mergeResultArea');
    const resultInfoEl = document.getElementById('mergeResultInfo');
    const clearBtn = document.getElementById('btnClearMergeList');

    if (!dropZone || !fileInput) return;

    let pdfFiles = []; // { id, file, pageCount, arrayBuffer }
    let mergedBlob = null;

    async function renderList() {
      if (!pdfFiles.length) {
        if (emptyState) emptyState.style.display = 'block';
        if (mergeBtn) mergeBtn.disabled = true;
        if (listContainer) listContainer.innerHTML = '';
        return;
      }

      if (emptyState) emptyState.style.display = 'none';
      if (mergeBtn) mergeBtn.disabled = false;
      if (!listContainer) return;

      listContainer.innerHTML = '';
      pdfFiles.forEach((item, idx) => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:8px;gap:12px;';
        row.innerHTML = `
          <div style="display:flex;align-items:center;gap:12px;min-width:0;">
            <span style="font-weight:700;font-size:0.75rem;color:#94a3b8;width:24px;">#${idx + 1}</span>
            <div style="width:36px;height:36px;border-radius:6px;background:#fee2e2;color:#dc2626;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.75rem;flex-shrink:0;">PDF</div>
            <div style="min-width:0;">
              <div style="font-weight:700;font-size:0.875rem;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.file.name}</div>
              <div style="font-size:0.75rem;color:#64748b;">${formatBytes(item.file.size)} • ${item.pageCount} ${item.pageCount === 1 ? 'page' : 'pages'}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
            <button type="button" class="btn-up" title="Move Up" ${idx === 0 ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : 'style="cursor:pointer;"'} style="padding:6px 8px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;font-size:0.75rem;">↑</button>
            <button type="button" class="btn-down" title="Move Down" ${idx === pdfFiles.length - 1 ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : 'style="cursor:pointer;"'} style="padding:6px 8px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;font-size:0.75rem;">↓</button>
            <button type="button" class="btn-remove" title="Remove" style="padding:6px 10px;background:#fee2e2;border:1px solid #fca5a5;border-radius:6px;cursor:pointer;font-size:0.75rem;font-weight:700;color:#991b1b;">✕</button>
          </div>
        `;

        const btnUp = row.querySelector('.btn-up');
        if (btnUp && idx > 0) {
          btnUp.onclick = () => {
            const temp = pdfFiles[idx];
            pdfFiles[idx] = pdfFiles[idx - 1];
            pdfFiles[idx - 1] = temp;
            renderList();
          };
        }
        const btnDown = row.querySelector('.btn-down');
        if (btnDown && idx < pdfFiles.length - 1) {
          btnDown.onclick = () => {
            const temp = pdfFiles[idx];
            pdfFiles[idx] = pdfFiles[idx + 1];
            pdfFiles[idx + 1] = temp;
            renderList();
          };
        }
        row.querySelector('.btn-remove').onclick = () => {
          pdfFiles.splice(idx, 1);
          renderList();
        };

        listContainer.appendChild(row);
      });
    }

    async function addFiles(files) {
      for (const file of Array.from(files)) {
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
          showToast(`"${file.name}" is not a PDF file.`, 'error');
          continue;
        }

        try {
          const buffer = await file.arrayBuffer();
          const { PDFDocument } = window.PDFLib;
          const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
          const pageCount = doc.getPageCount();

          pdfFiles.push({
            id: 'pdf_' + Math.random().toString(36).substr(2, 9),
            file,
            pageCount,
            arrayBuffer: buffer
          });
        } catch (err) {
          showToast(`Could not read "${file.name}". File may be corrupted.`, 'error');
        }
      }
      renderList();
    }

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('border-emerald-500', 'bg-emerald-50');
    });
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('border-emerald-500', 'bg-emerald-50');
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-emerald-500', 'bg-emerald-50');
      if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
    });
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      if (e.target.files) addFiles(e.target.files);
    });

    if (clearBtn) {
      clearBtn.onclick = () => {
        pdfFiles = [];
        mergedBlob = null;
        if (resultArea) resultArea.style.display = 'none';
        renderList();
      };
    }

    if (mergeBtn) {
      mergeBtn.addEventListener('click', async () => {
        if (pdfFiles.length < 2 || !window.PDFLib) {
          showToast('Please add at least 2 PDF files to merge.', 'info');
          return;
        }

        mergeBtn.disabled = true;
        mergeBtn.textContent = 'Merging PDFs...';

        try {
          const { PDFDocument } = window.PDFLib;
          const mergedPdf = await PDFDocument.create();

          let totalMergedPages = 0;
          for (let i = 0; i < pdfFiles.length; i++) {
            const item = pdfFiles[i];
            const srcDoc = await PDFDocument.load(item.arrayBuffer, { ignoreEncryption: true });
            const pageIndices = srcDoc.getPageIndices();
            const copiedPages = await mergedPdf.copyPages(srcDoc, pageIndices);
            copiedPages.forEach(p => mergedPdf.addPage(p));
            totalMergedPages += copiedPages.length;
          }

          const mergedBytes = await mergedPdf.save();
          mergedBlob = new Blob([mergedBytes], { type: 'application/pdf' });

          if (resultArea && resultInfoEl) {
            resultArea.style.display = 'block';
            resultInfoEl.textContent = `Merged ${pdfFiles.length} files into 1 PDF document (${totalMergedPages} total pages, ${formatBytes(mergedBlob.size)}).`;
          }

          showToast('PDF files merged successfully!', 'success');

          // Log tool event
          fetch('/api/tools/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              toolId: 'pdf-merger',
              toolName: 'PDF Merger',
              action: 'merged',
              metadata: { fileCount: pdfFiles.length, totalPages: totalMergedPages, size: mergedBlob.size }
            })
          }).catch(() => {});

        } catch (err) {
          console.error(err);
          showToast('Failed to merge PDFs. Please try again.', 'error');
        } finally {
          mergeBtn.disabled = false;
          mergeBtn.textContent = 'Merge PDFs';
        }
      });
    }

    if (downloadBtn) {
      downloadBtn.onclick = () => {
        if (!mergedBlob) return;
        triggerBlobDownload(mergedBlob, 'merged-document.pdf');
      };
    }

    if (saveCloudBtn) {
      saveCloudBtn.onclick = async () => {
        if (!mergedBlob) return;
        await saveToCloud(mergedBlob, 'merged-document.pdf', 'pdf', 'PDF Merger', { fileCount: pdfFiles.length }, saveCloudBtn);
      };
    }
  }

  // ==========================================================================
  // 11. PDF SPLITTER ENGINE
  // ==========================================================================
  function initPDFSplitter() {
    const dropZone = document.getElementById('splitDropZone');
    const fileInput = document.getElementById('splitFileInput');
    const fileInfoCard = document.getElementById('splitFileInfoCard');
    const fileNameEl = document.getElementById('splitFileName');
    const fileSizeEl = document.getElementById('splitFileSize');
    const pageCountEl = document.getElementById('splitPageCount');
    const modeSelect = document.getElementById('splitModeSelect');
    const customRangeInput = document.getElementById('splitCustomRanges');
    const splitBtn = document.getElementById('btnSplitPdf');
    const resultArea = document.getElementById('splitResultArea');
    const resultList = document.getElementById('splitResultList');
    const downloadZipBtn = document.getElementById('btnDownloadAllSplitZip');
    const saveCloudBtn = document.getElementById('btnSaveSplitZipToCloud');

    if (!dropZone || !fileInput) return;

    let currentFile = null;
    let currentBuffer = null;
    let currentPdfDoc = null;
    let splitResults = []; // { name, blob, pages }

    async function handleFile(file) {
      if (!file || (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf'))) {
        showToast('Please upload a valid PDF document.', 'error');
        return;
      }

      currentFile = file;
      fileNameEl.textContent = file.name;
      fileSizeEl.textContent = formatBytes(file.size);
      fileInfoCard.style.display = 'block';
      if (resultArea) resultArea.style.display = 'none';
      splitResults = [];

      try {
        currentBuffer = await file.arrayBuffer();
        const { PDFDocument } = window.PDFLib;
        currentPdfDoc = await PDFDocument.load(currentBuffer, { ignoreEncryption: true });
        const numPages = currentPdfDoc.getPageCount();
        pageCountEl.textContent = `${numPages} ${numPages === 1 ? 'Page' : 'Pages'}`;
        if (splitBtn) splitBtn.disabled = false;
      } catch (err) {
        showToast('Could not load PDF document. It may be corrupted.', 'error');
        fileInfoCard.style.display = 'none';
      }
    }

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('border-emerald-500', 'bg-emerald-50');
    });
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('border-emerald-500', 'bg-emerald-50');
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-emerald-500', 'bg-emerald-50');
      if (e.dataTransfer.files && e.dataTransfer.files.length) {
        handleFile(e.dataTransfer.files[0]);
      }
    });
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length) {
        handleFile(e.target.files[0]);
      }
    });

    if (modeSelect && customRangeInput) {
      modeSelect.addEventListener('change', () => {
        customRangeInput.style.display = modeSelect.value === 'ranges' ? 'block' : 'none';
      });
    }

    if (splitBtn) {
      splitBtn.addEventListener('click', async () => {
        if (!currentPdfDoc || !window.PDFLib) return;

        splitBtn.disabled = true;
        splitBtn.textContent = 'Splitting PDF...';
        splitResults = [];
        if (resultList) resultList.innerHTML = '';

        try {
          const { PDFDocument } = window.PDFLib;
          const totalPages = currentPdfDoc.getPageCount();
          const baseName = currentFile.name.replace(/\.[^/.]+$/, '');
          const mode = modeSelect ? modeSelect.value : 'all';

          let rangeGroups = [];

          if (mode === 'all') {
            // Split every page into its own 1-page PDF
            for (let i = 1; i <= totalPages; i++) {
              rangeGroups.push({ label: `Page ${i}`, pages: [i] });
            }
          } else {
            // Custom ranges: e.g. "1-3, 4-7, 8-10"
            const raw = customRangeInput ? customRangeInput.value.trim() : '';
            const parts = raw ? raw.split(',') : [`1-${totalPages}`];
            parts.forEach((p, idx) => {
              p = p.trim();
              if (p.includes('-')) {
                const [s, e] = p.split('-').map(n => parseInt(n, 10));
                if (!isNaN(s) && !isNaN(e)) {
                  const list = [];
                  for (let n = Math.max(1, s); n <= Math.min(totalPages, e); n++) list.push(n);
                  if (list.length) rangeGroups.push({ label: `Pages ${s}-${e}`, pages: list });
                }
              } else {
                const n = parseInt(p, 10);
                if (!isNaN(n) && n >= 1 && n <= totalPages) {
                  rangeGroups.push({ label: `Page ${n}`, pages: [n] });
                }
              }
            });
          }

          if (!rangeGroups.length) {
            showToast('Please specify valid page ranges.', 'error');
            splitBtn.disabled = false;
            splitBtn.textContent = 'Split PDF';
            return;
          }

          for (let i = 0; i < rangeGroups.length; i++) {
            const group = rangeGroups[i];
            const newDoc = await PDFDocument.create();
            const zeroIndices = group.pages.map(p => p - 1);
            const copiedPages = await newDoc.copyPages(currentPdfDoc, zeroIndices);
            copiedPages.forEach(p => newDoc.addPage(p));

            const bytes = await newDoc.save();
            const blob = new Blob([bytes], { type: 'application/pdf' });
            const docName = `${baseName}-${group.label.toLowerCase().replace(/\s+/g, '-')}.pdf`;

            splitResults.push({ name: docName, blob, pages: group.pages.length });

            // Display row in results
            if (resultList) {
              const row = document.createElement('div');
              row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:6px;';
              row.innerHTML = `
                <div>
                  <div style="font-weight:700;font-size:0.875rem;color:#0f172a;">${docName}</div>
                  <div style="font-size:0.75rem;color:#64748b;">${group.pages.length} ${group.pages.length === 1 ? 'page' : 'pages'} • ${formatBytes(blob.size)}</div>
                </div>
                <button type="button" class="btn-dl-split" style="padding:6px 12px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:6px;font-size:0.75rem;font-weight:700;color:#0f172a;cursor:pointer;">Download</button>
              `;
              row.querySelector('.btn-dl-split').onclick = () => triggerBlobDownload(blob, docName);
              resultList.appendChild(row);
            }
          }

          if (resultArea) resultArea.style.display = 'block';
          showToast(`PDF split into ${splitResults.length} files!`, 'success');

          // Log tool event
          fetch('/api/tools/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              toolId: 'pdf-splitter',
              toolName: 'PDF Splitter',
              action: 'split',
              metadata: { originalName: currentFile.name, splitCount: splitResults.length }
            })
          }).catch(() => {});

        } catch (err) {
          console.error(err);
          showToast('Failed to split PDF. Please try again.', 'error');
        } finally {
          splitBtn.disabled = false;
          splitBtn.textContent = 'Split PDF';
        }
      });
    }

    if (downloadZipBtn) {
      downloadZipBtn.onclick = async () => {
        if (!splitResults.length || !window.JSZip) return;
        downloadZipBtn.disabled = true;
        downloadZipBtn.textContent = 'Bundling ZIP...';

        try {
          const zip = new window.JSZip();
          splitResults.forEach(item => {
            zip.file(item.name, item.blob);
          });
          const zipBlob = await zip.generateAsync({ type: 'blob' });
          const baseName = currentFile ? currentFile.name.replace(/\.[^/.]+$/, '') : 'split-document';
          triggerBlobDownload(zipBlob, `${baseName}-split.zip`);
          showToast('ZIP archive downloaded!', 'success');
        } catch (err) {
          showToast('Could not generate ZIP archive.', 'error');
        } finally {
          downloadZipBtn.disabled = false;
          downloadZipBtn.textContent = 'Download All as ZIP';
        }
      };
    }

    if (saveCloudBtn) {
      saveCloudBtn.onclick = async () => {
        if (!splitResults.length || !window.JSZip) return;
        const zip = new window.JSZip();
        splitResults.forEach(item => zip.file(item.name, item.blob));
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const baseName = currentFile ? currentFile.name.replace(/\.[^/.]+$/, '') : 'split-document';
        await saveToCloud(zipBlob, `${baseName}-split.zip`, 'export', 'PDF Splitter', { splitCount: splitResults.length }, saveCloudBtn);
      };
    }
  }

  // ==========================================================================
  // 12. LIVE CURRENCY CONVERTER ENGINE
  // ==========================================================================
  function initCurrencyConverter() {
    const amountInput = document.getElementById('curAmount');
    const fromSelect = document.getElementById('curFrom');
    const toSelect = document.getElementById('curTo');
    const swapBtn = document.getElementById('btnCurSwap');
    const resultDisplay = document.getElementById('curResultDisplay');
    const rateDisplay = document.getElementById('curRateDisplay');
    const inverseDisplay = document.getElementById('curInverseDisplay');
    const lastUpdatedDisplay = document.getElementById('curLastUpdated');
    const quickTableBody = document.getElementById('curQuickTableBody');

    if (!amountInput || !fromSelect || !toSelect) return;

    let exchangeRates = null;

    async function loadRates() {
      try {
        const res = await fetch('/api/rates/latest');
        const data = await res.json();
        if (data.success && data.rates) {
          exchangeRates = data.rates;
          if (lastUpdatedDisplay) {
            lastUpdatedDisplay.textContent = `Exchange rates updated: ${data.lastUpdated} (${data.cached ? 'Cached' : 'Live'})`;
          }
          calculate();
        } else {
          if (lastUpdatedDisplay) lastUpdatedDisplay.textContent = 'Exchange rates service currently unavailable.';
        }
      } catch (err) {
        if (lastUpdatedDisplay) lastUpdatedDisplay.textContent = 'Could not load real-time exchange rates.';
      }
    }

    function calculate() {
      if (!exchangeRates) return;
      const amount = parseFloat(amountInput.value) || 0;
      const from = fromSelect.value;
      const to = toSelect.value;

      const rateFrom = exchangeRates[from] || 1;
      const rateTo = exchangeRates[to] || 1;

      // Conversion: 1 unit of from in USD = (1 / rateFrom), then * rateTo
      const rate = rateTo / rateFrom;
      const inverse = rateFrom / rateTo;
      const converted = amount * rate;

      if (resultDisplay) {
        resultDisplay.textContent = `${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${to}`;
      }

      if (rateDisplay) {
        rateDisplay.textContent = `1 ${from} = ${rate.toFixed(4)} ${to}`;
      }

      if (inverseDisplay) {
        inverseDisplay.textContent = `1 ${to} = ${inverse.toFixed(4)} ${from}`;
      }

      // Populate quick conversion table
      if (quickTableBody) {
        quickTableBody.innerHTML = '';
        const tiers = [1, 5, 10, 25, 50, 100, 500, 1000];
        tiers.forEach(val => {
          const resVal = (val * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td style="font-weight:700;color:#0f172a;padding:8px 12px;border-bottom:1px solid #f1f5f9;">${val} ${from}</td>
            <td style="font-family:'JetBrains Mono',monospace;color:#059669;font-weight:700;padding:8px 12px;border-bottom:1px solid #f1f5f9;">${resVal} ${to}</td>
          `;
          quickTableBody.appendChild(tr);
        });
      }
    }

    [amountInput, fromSelect, toSelect].forEach(el => {
      el.addEventListener('input', calculate);
      el.addEventListener('change', calculate);
    });

    if (swapBtn) {
      swapBtn.addEventListener('click', () => {
        const temp = fromSelect.value;
        fromSelect.value = toSelect.value;
        toSelect.value = temp;
        calculate();
      });
    }

    loadRates();
  }

  // ==========================================================================
  // 13. INVOICE DUE DATE CALCULATOR ENGINE
  // ==========================================================================
  function initDueDateCalculator() {
    const issueDateInput = document.getElementById('dueIssueDate');
    const termsSelect = document.getElementById('dueTermsSelect');
    const customDaysGroup = document.getElementById('dueCustomDaysGroup');
    const customDaysInput = document.getElementById('dueCustomDays');
    const calcModeSelect = document.getElementById('dueCalcMode');

    const outDueDate = document.getElementById('outDueDateDisplay');
    const outCountdown = document.getElementById('outDueCountdown');
    const outDayName = document.getElementById('outDueDayName');
    const outClause = document.getElementById('outDueClause');
    const copyBtn = document.getElementById('btnCopyDueDate');
    const useInInvoiceBtn = document.getElementById('btnUseDueDateInInvoice');

    if (!issueDateInput || !termsSelect) return;

    // Default to today
    const todayStr = new Date().toISOString().split('T')[0];
    if (!issueDateInput.value) issueDateInput.value = todayStr;

    function calculate() {
      const issueDate = new Date(issueDateInput.value || todayStr);
      const terms = termsSelect.value;
      const isBusinessDays = calcModeSelect ? calcModeSelect.value === 'business' : false;

      let daysToAdd = 0;
      if (terms === 'receipt') daysToAdd = 0;
      else if (terms === 'net7') daysToAdd = 7;
      else if (terms === 'net15') daysToAdd = 15;
      else if (terms === 'net30') daysToAdd = 30;
      else if (terms === 'net45') daysToAdd = 45;
      else if (terms === 'net60') daysToAdd = 60;
      else if (terms === 'net90') daysToAdd = 90;
      else if (terms === 'custom') {
        if (customDaysGroup) customDaysGroup.style.display = 'block';
        daysToAdd = parseInt(customDaysInput ? customDaysInput.value : 0, 10) || 0;
      }

      if (terms !== 'custom' && customDaysGroup) {
        customDaysGroup.style.display = 'none';
      }

      const computedDate = new Date(issueDate.getTime());

      if (isBusinessDays && daysToAdd > 0) {
        let added = 0;
        while (added < daysToAdd) {
          computedDate.setDate(computedDate.getDate() + 1);
          const day = computedDate.getDay();
          if (day !== 0 && day !== 6) added++; // Skip Sunday (0) and Saturday (6)
        }
      } else {
        computedDate.setDate(computedDate.getDate() + daysToAdd);
      }

      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      const formattedDateStr = computedDate.toLocaleDateString('en-US', options);
      const isoFormatted = computedDate.toISOString().split('T')[0];

      // Countdown relative to today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(computedDate.getTime());
      target.setHours(0, 0, 0, 0);
      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      let countdownText = 'Due today';
      if (diffDays > 0) countdownText = `Due in ${diffDays} days`;
      else if (diffDays < 0) countdownText = `Overdue by ${Math.abs(diffDays)} days`;

      if (outDueDate) outDueDate.textContent = formattedDateStr;
      if (outCountdown) outCountdown.textContent = countdownText;
      if (outDayName) outDayName.textContent = computedDate.toLocaleDateString('en-US', { weekday: 'long' });

      let clauseText = `Payment is due upon receipt of this invoice.`;
      if (daysToAdd > 0) {
        clauseText = `Payment terms: Net ${daysToAdd} ${isBusinessDays ? 'business ' : ''}days. Payment is strictly due by ${formattedDateStr}.`;
      }
      if (outClause) outClause.textContent = clauseText;

      return { formattedDateStr, isoFormatted, clauseText, daysToAdd };
    }

    [issueDateInput, termsSelect, customDaysInput, calcModeSelect].forEach(el => {
      if (el) {
        el.addEventListener('input', calculate);
        el.addEventListener('change', calculate);
      }
    });

    if (copyBtn) {
      copyBtn.onclick = () => {
        const d = calculate();
        copyText(`Invoice Due Date: ${d.formattedDateStr}\n${d.clauseText}`, 'Due date & clause copied!');
      };
    }

    if (useInInvoiceBtn) {
      useInInvoiceBtn.onclick = (e) => {
        e.preventDefault();
        const d = calculate();
        sessionStorage.setItem('pending_invoice_due_date', d.isoFormatted);
        window.location.href = 'index.html';
      };
    }

    calculate();
  }

  // ==========================================================================
  // 14. PAYMENT INSTALLMENT & SCHEDULE CALCULATOR
  // ==========================================================================
  function initPaymentInstallmentCalculator() {
    const totalAmountInput = document.getElementById('schedTotalAmount');
    const depositInput = document.getElementById('schedDeposit');
    const installmentsSelect = document.getElementById('schedInstallments');
    const frequencySelect = document.getElementById('schedFrequency');
    const startDateInput = document.getElementById('schedStartDate');
    const currencySelect = document.getElementById('schedCurrency');

    const outRemainingBalance = document.getElementById('outSchedRemaining');
    const outInstallmentAmount = document.getElementById('outSchedAmount');
    const outTableBody = document.getElementById('outSchedTableBody');
    const copyScheduleBtn = document.getElementById('btnCopySchedule');
    const downloadCsvBtn = document.getElementById('btnDownloadScheduleCsv');

    if (!totalAmountInput || !installmentsSelect) return;

    const todayStr = new Date().toISOString().split('T')[0];
    if (startDateInput && !startDateInput.value) startDateInput.value = todayStr;

    function calculate() {
      const sym = currencySelect ? currencySelect.value : '$';
      const total = parseFloat(totalAmountInput.value) || 0;
      const deposit = parseFloat(depositInput ? depositInput.value : 0) || 0;
      const count = parseInt(installmentsSelect.value, 10) || 1;
      const freq = frequencySelect ? frequencySelect.value : 'monthly';
      const startDate = new Date((startDateInput && startDateInput.value) || todayStr);

      const balance = Math.max(0, total - deposit);
      const perInstallment = count > 0 ? (balance / count) : 0;

      if (outRemainingBalance) outRemainingBalance.textContent = `${sym}${balance.toFixed(2)}`;
      if (outInstallmentAmount) outInstallmentAmount.textContent = `${sym}${perInstallment.toFixed(2)}`;

      const scheduleRows = [];
      let runningPaid = deposit;

      for (let i = 1; i <= count; i++) {
        const dueDate = new Date(startDate.getTime());
        if (freq === 'weekly') dueDate.setDate(dueDate.getDate() + ((i - 1) * 7));
        else if (freq === 'biweekly') dueDate.setDate(dueDate.getDate() + ((i - 1) * 14));
        else dueDate.setMonth(dueDate.getMonth() + (i - 1));

        runningPaid += perInstallment;
        const remaining = Math.max(0, balance - (perInstallment * i));

        scheduleRows.push({
          num: i,
          dateStr: dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
          amount: perInstallment,
          remaining
        });
      }

      if (outTableBody) {
        outTableBody.innerHTML = '';
        if (deposit > 0) {
          const depTr = document.createElement('tr');
          depTr.innerHTML = `
            <td style="padding:8px 12px;font-weight:700;color:#059669;">Deposit / Initial</td>
            <td style="padding:8px 12px;color:#64748b;">Upon Contract</td>
            <td style="padding:8px 12px;font-family:'JetBrains Mono',monospace;font-weight:700;color:#059669;">${sym}${deposit.toFixed(2)}</td>
            <td style="padding:8px 12px;font-family:'JetBrains Mono',monospace;color:#64748b;">${sym}${balance.toFixed(2)}</td>
          `;
          outTableBody.appendChild(depTr);
        }

        scheduleRows.forEach(row => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td style="padding:8px 12px;font-weight:600;color:#0f172a;">Payment #${row.num}</td>
            <td style="padding:8px 12px;color:#64748b;">${row.dateStr}</td>
            <td style="padding:8px 12px;font-family:'JetBrains Mono',monospace;font-weight:700;color:#0f172a;">${sym}${row.amount.toFixed(2)}</td>
            <td style="padding:8px 12px;font-family:'JetBrains Mono',monospace;color:#64748b;">${sym}${row.remaining.toFixed(2)}</td>
          `;
          outTableBody.appendChild(tr);
        });
      }

      return { sym, total, deposit, balance, perInstallment, count, scheduleRows };
    }

    [totalAmountInput, depositInput, installmentsSelect, frequencySelect, startDateInput, currencySelect].forEach(el => {
      if (el) {
        el.addEventListener('input', calculate);
        el.addEventListener('change', calculate);
      }
    });

    if (copyScheduleBtn) {
      copyScheduleBtn.onclick = () => {
        const d = calculate();
        let txt = `Payment Schedule (${d.count} installments)\nTotal: ${d.sym}${d.total.toFixed(2)}\nDeposit: ${d.sym}${d.deposit.toFixed(2)}\nBalance: ${d.sym}${d.balance.toFixed(2)}\nInstallment: ${d.sym}${d.perInstallment.toFixed(2)}\n\n`;
        d.scheduleRows.forEach(r => {
          txt += `Payment #${r.num} - Due: ${r.dateStr} - Amount: ${d.sym}${r.amount.toFixed(2)} (Remaining: ${d.sym}${r.remaining.toFixed(2)})\n`;
        });
        copyText(txt, 'Payment schedule copied!');
      };
    }

    if (downloadCsvBtn) {
      downloadCsvBtn.onclick = () => {
        const d = calculate();
        let csv = 'Payment Number,Due Date,Amount,Remaining Balance\n';
        if (d.deposit > 0) csv += `Deposit,Upon Contract,${d.deposit.toFixed(2)},${d.balance.toFixed(2)}\n`;
        d.scheduleRows.forEach(r => {
          csv += `Payment #${r.num},"${r.dateStr}",${r.amount.toFixed(2)},${r.remaining.toFixed(2)}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        triggerBlobDownload(blob, 'payment-schedule.csv');
      };
    }

    calculate();
  }

  // ==========================================================================
  // 15. PAYMENT LINK GENERATOR ENGINE
  // ==========================================================================
  function initPaymentLinkCreator() {
    const titleInput = document.getElementById('plkTitle');
    const amountInput = document.getElementById('plkAmount');
    const currencySelect = document.getElementById('plkCurrency');
    const descInput = document.getElementById('plkDesc');
    const invoiceSelect = document.getElementById('plkInvoiceSelect');
    const createBtn = document.getElementById('btnCreatePaymentLink');
    const resultCard = document.getElementById('plkResultCard');
    const linkDisplay = document.getElementById('plkGeneratedUrl');
    const copyLinkBtn = document.getElementById('btnCopyPaymentLink');
    const historyTableBody = document.getElementById('plkHistoryTableBody');

    if (!titleInput || !amountInput) return;

    async function loadInvoices() {
      try {
        const res = await fetch('/api/invoices');
        const data = await res.json();
        if (data.success && data.invoices && invoiceSelect) {
          data.invoices.forEach(inv => {
            const opt = document.createElement('option');
            opt.value = inv.id;
            opt.textContent = `${inv.invoice_number} - ${inv.client_name || 'Client'} (${inv.currency} ${inv.total})`;
            opt.dataset.amount = inv.total;
            opt.dataset.currency = inv.currency;
            opt.dataset.client = inv.client_name;
            invoiceSelect.appendChild(opt);
          });
        }
      } catch (e) {}
    }

    async function loadLinks() {
      if (!historyTableBody) return;
      try {
        const res = await fetch('/api/payment-links');
        const data = await res.json();
        if (data.success && data.links) {
          historyTableBody.innerHTML = '';
          if (!data.links.length) {
            historyTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:24px;">No payment links created yet.</td></tr>';
            return;
          }
          data.links.forEach(l => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td style="font-weight:700;color:#0f172a;padding:10px 12px;border-bottom:1px solid #f1f5f9;">${l.title}</td>
              <td style="font-family:'JetBrains Mono',monospace;font-weight:700;color:#059669;padding:10px 12px;border-bottom:1px solid #f1f5f9;">${l.currency} ${l.amount.toFixed(2)}</td>
              <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;"><span style="background:#ecfdf5;color:#059669;padding:3px 8px;border-radius:9999px;font-size:0.75rem;font-weight:700;">Active</span></td>
              <td style="color:#64748b;font-size:0.8125rem;padding:10px 12px;border-bottom:1px solid #f1f5f9;">${new Date(l.created_at).toLocaleDateString()}</td>
              <td style="text-align:right;padding:10px 12px;border-bottom:1px solid #f1f5f9;">
                <button type="button" class="btn-copy-plk" style="padding:4px 10px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;font-size:0.75rem;font-weight:700;cursor:pointer;">Copy</button>
              </td>
            `;
            const fullUrl = `${window.location.origin}/tools/online-payments?link=${l.id}`;
            tr.querySelector('.btn-copy-plk').onclick = () => copyText(fullUrl, 'Payment link copied!');
            historyTableBody.appendChild(tr);
          });
        }
      } catch (e) {}
    }

    if (invoiceSelect) {
      invoiceSelect.addEventListener('change', () => {
        const opt = invoiceSelect.selectedOptions[0];
        if (opt && opt.value) {
          titleInput.value = `Payment for Invoice #${opt.textContent.split(' - ')[0]}`;
          amountInput.value = opt.dataset.amount || '';
          if (currencySelect && opt.dataset.currency) currencySelect.value = opt.dataset.currency;
        }
      });
    }

    if (createBtn) {
      createBtn.addEventListener('click', async () => {
        const title = titleInput.value.trim();
        const amount = parseFloat(amountInput.value) || 0;
        const currency = currencySelect ? currencySelect.value : 'USD';
        const description = descInput ? descInput.value.trim() : '';
        const invoiceId = invoiceSelect ? invoiceSelect.value : '';

        if (!title) {
          showToast('Please enter a payment title or description.', 'error');
          return;
        }
        if (amount <= 0) {
          showToast('Payment amount must be greater than zero.', 'error');
          return;
        }

        createBtn.disabled = true;
        createBtn.textContent = 'Generating Link...';

        try {
          const res = await fetch('/api/payment-links', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, amount, currency, description, invoiceId })
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.error || 'Failed to create payment link');

          const fullUrl = `${window.location.origin}/tools/online-payments?link=${data.link.id}`;
          if (linkDisplay) linkDisplay.value = fullUrl;
          if (resultCard) resultCard.style.display = 'block';

          showToast('Payment link generated!', 'success');
          loadLinks();
        } catch (err) {
          showToast(err.message, 'error');
        } finally {
          createBtn.disabled = false;
          createBtn.textContent = 'Generate Payment Link';
        }
      });
    }

    if (copyLinkBtn) {
      copyLinkBtn.onclick = () => {
        if (linkDisplay && linkDisplay.value) copyText(linkDisplay.value, 'Payment link copied!');
      };
    }

    loadInvoices();
    loadLinks();
  }

  // ==========================================================================
  // 16. CLOUD FILES MANAGEMENT WORKSPACE (/files)
  // ==========================================================================
  function initCloudFilesManager() {
    const searchInput = document.getElementById('filesSearchInput');
    const filterPills = document.querySelectorAll('.file-filter-pill');
    const sortSelect = document.getElementById('filesSortSelect');
    const tableBody = document.getElementById('filesTableBody');
    const cardsContainer = document.getElementById('filesCardsContainer');
    const emptyState = document.getElementById('filesEmptyState');
    const statsTotalFiles = document.getElementById('statsTotalFiles');
    const statsTotalSize = document.getElementById('statsTotalSize');

    if (!tableBody && !cardsContainer) return;

    let activeFilter = 'all';
    let currentFiles = [];

    async function fetchFiles() {
      const search = searchInput ? searchInput.value.trim() : '';
      const sort = sortSelect ? sortSelect.value : 'newest';

      try {
        const res = await fetch(`/api/files?search=${encodeURIComponent(search)}&fileType=${encodeURIComponent(activeFilter)}&sort=${encodeURIComponent(sort)}`);
        const data = await res.json();

        if (res.status === 401) {
          window.location.href = '/login.html?redirect=/files';
          return;
        }

        if (data.success) {
          currentFiles = data.files || [];
          renderFiles();
        }
      } catch (err) {
        showToast('Could not load cloud files.', 'error');
      }
    }

    function renderFiles() {
      let totalBytes = 0;
      currentFiles.forEach(f => totalBytes += (f.size || 0));

      if (statsTotalFiles) statsTotalFiles.textContent = `${currentFiles.length} ${currentFiles.length === 1 ? 'file' : 'files'}`;
      if (statsTotalSize) statsTotalSize.textContent = formatBytes(totalBytes);

      if (!currentFiles.length) {
        if (emptyState) emptyState.style.display = 'block';
        if (tableBody) tableBody.innerHTML = '';
        if (cardsContainer) cardsContainer.innerHTML = '';
        return;
      }

      if (emptyState) emptyState.style.display = 'none';

      // Desktop Table
      if (tableBody) {
        tableBody.innerHTML = '';
        currentFiles.forEach(f => {
          const tr = document.createElement('tr');
          const ext = f.file_name.split('.').pop().toUpperCase();
          tr.innerHTML = `
            <td style="padding:14px 16px;border-bottom:1px solid #f1f5f9;">
              <div style="display:flex;align-items:center;gap:12px;">
                <div style="width:34px;height:34px;border-radius:8px;background:${ext === 'PDF' ? '#fee2e2' : ext === 'ZIP' ? '#fef3c7' : '#e0f2fe'};color:${ext === 'PDF' ? '#dc2626' : ext === 'ZIP' ? '#d97706' : '#0284c7'};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.75rem;">${ext}</div>
                <div>
                  <div style="font-weight:700;color:#0f172a;font-size:0.875rem;">${f.file_name}</div>
                  <div style="font-size:0.75rem;color:#64748b;">Source: ${f.source_tool || 'Direct Upload'}</div>
                </div>
              </div>
            </td>
            <td style="padding:14px 16px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:0.8125rem;">${f.file_type.toUpperCase()}</td>
            <td style="padding:14px 16px;border-bottom:1px solid #f1f5f9;font-family:'JetBrains Mono',monospace;color:#0f172a;font-size:0.8125rem;">${formatBytes(f.size)}</td>
            <td style="padding:14px 16px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:0.8125rem;">${new Date(f.created_at).toLocaleDateString()}</td>
            <td style="padding:14px 16px;border-bottom:1px solid #f1f5f9;text-align:right;">
              <div style="display:flex;align-items:center;justify-content:flex-end;gap:6px;">
                <a href="/api/files/${f.id}/download" class="btn-download-file" title="Download" style="padding:6px 10px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;font-size:0.75rem;font-weight:700;color:#0f172a;text-decoration:none;">Download</a>
                <button type="button" class="btn-rename-file" title="Rename" style="padding:6px 8px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;font-size:0.75rem;cursor:pointer;color:#475569;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                <button type="button" class="btn-delete-file" title="Delete" style="padding:6px 8px;background:#fee2e2;border:1px solid #fca5a5;border-radius:6px;font-size:0.75rem;cursor:pointer;color:#991b1b;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
              </div>
            </td>
          `;

          tr.querySelector('.btn-rename-file').onclick = () => handleRename(f);
          tr.querySelector('.btn-delete-file').onclick = () => handleDelete(f);
          tableBody.appendChild(tr);
        });
      }

      // Mobile Cards
      if (cardsContainer) {
        cardsContainer.innerHTML = '';
        currentFiles.forEach(f => {
          const card = document.createElement('div');
          card.style.cssText = 'background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px;margin-bottom:10px;display:flex;flex-direction:column;gap:10px;';
          card.innerHTML = `
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">
              <div>
                <div style="font-weight:700;font-size:0.875rem;color:#0f172a;">${f.file_name}</div>
                <div style="font-size:0.75rem;color:#64748b;">${formatBytes(f.size)} • ${new Date(f.created_at).toLocaleDateString()}</div>
              </div>
              <span style="font-size:0.7rem;font-weight:700;background:#f1f5f9;color:#475569;padding:2px 6px;border-radius:4px;">${f.file_type}</span>
            </div>
            <div style="display:flex;align-items:center;justify-content:flex-end;gap:8px;border-top:1px solid #f8fafc;padding-top:8px;">
              <a href="/api/files/${f.id}/download" style="padding:5px 10px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:6px;font-size:0.75rem;font-weight:700;color:#0f172a;text-decoration:none;">Download</a>
              <button type="button" class="btn-mobile-rename" style="padding:5px 8px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;font-size:0.75rem;cursor:pointer;">Rename</button>
              <button type="button" class="btn-mobile-delete" style="padding:5px 8px;background:#fee2e2;border:1px solid #fca5a5;border-radius:6px;font-size:0.75rem;color:#991b1b;cursor:pointer;">Delete</button>
            </div>
          `;
          card.querySelector('.btn-mobile-rename').onclick = () => handleRename(f);
          card.querySelector('.btn-mobile-delete').onclick = () => handleDelete(f);
          cardsContainer.appendChild(card);
        });
      }
    }

    async function handleRename(file) {
      const newName = prompt('Enter new file name:', file.file_name);
      if (!newName || !newName.trim() || newName.trim() === file.file_name) return;

      try {
        const res = await fetch(`/api/files/${file.id}/rename`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: newName.trim() })
        });
        const data = await res.json();
        if (data.success) {
          showToast('File renamed successfully!', 'success');
          fetchFiles();
        } else {
          showToast(data.error || 'Failed to rename file.', 'error');
        }
      } catch (err) {
        showToast('Error renaming file.', 'error');
      }
    }

    async function handleDelete(file) {
      if (!confirm(`Are you sure you want to delete "${file.file_name}" from Cloud Storage? This cannot be undone.`)) return;

      try {
        const res = await fetch(`/api/files/${file.id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          showToast('File deleted from Cloud Storage.', 'success');
          fetchFiles();
        } else {
          showToast(data.error || 'Failed to delete file.', 'error');
        }
      } catch (err) {
        showToast('Error deleting file.', 'error');
      }
    }

    if (filterPills && filterPills.length) {
      filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
          filterPills.forEach(p => p.classList.remove('active', 'bg-emerald-600', 'text-white'));
          pill.classList.add('active', 'bg-emerald-600', 'text-white');
          activeFilter = pill.dataset.filter || 'all';
          fetchFiles();
        });
      });
    }

    if (searchInput) {
      let debounceTimer = null;
      searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(fetchFiles, 300);
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', fetchFiles);
    }

    fetchFiles();
  }

  // ==========================================================================
  // 17. TOOLS HUB CATEGORY TABS & LIVE SEARCH (/tools)
  // ==========================================================================
  function initToolsHub() {
    const searchInput = document.getElementById('hubSearchInput');
    const categoryTabs = document.querySelectorAll('.tool-hub-tab');
    const toolCards = document.querySelectorAll('.tool-card-item');
    const recentActivityContainer = document.getElementById('hubRecentActivity');

    if (!toolCards || !toolCards.length) return;

    let activeCategory = 'all';

    function filterTools() {
      const q = searchInput ? searchInput.value.toLowerCase().trim() : '';

      toolCards.forEach(card => {
        const category = card.dataset.category || '';
        const name = (card.querySelector('.tool-card-title')?.textContent || '').toLowerCase();
        const desc = (card.querySelector('.tool-card-desc')?.textContent || '').toLowerCase();

        const matchCategory = activeCategory === 'all' || category === activeCategory;
        const matchSearch = !q || name.includes(q) || desc.includes(q);

        card.style.display = matchCategory && matchSearch ? 'flex' : 'none';
      });
    }

    if (categoryTabs && categoryTabs.length) {
      categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          categoryTabs.forEach(t => t.classList.remove('active', 'border-emerald-600', 'text-emerald-700'));
          tab.classList.add('active', 'border-emerald-600', 'text-emerald-700');
          activeCategory = tab.dataset.category || 'all';
          filterTools();
        });
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', filterTools);
    }

    // Load recent tool activity
    if (recentActivityContainer) {
      fetch('/api/tools/recent')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.activities && data.activities.length) {
            recentActivityContainer.innerHTML = '';
            data.activities.forEach(act => {
              const item = document.createElement('div');
              item.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:8px;';
              item.innerHTML = `
                <div>
                  <div style="font-weight:700;font-size:0.875rem;color:#0f172a;">${act.tool_name}</div>
                  <div style="font-size:0.75rem;color:#059669;font-weight:600;text-transform:capitalize;">${act.action}</div>
                </div>
                <div style="font-size:0.75rem;color:#64748b;">${new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              `;
              recentActivityContainer.appendChild(item);
            });
          } else {
            recentActivityContainer.innerHTML = '<div style="color:#94a3b8;font-size:0.8125rem;padding:8px 0;">No recent activity yet. Open any tool to get started!</div>';
          }
        })
        .catch(() => {});
    }
  }

  // ==========================================================================
  // INITIALIZATION ON DOM CONTENT LOADED
  // ==========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    initInvoiceNumberGenerator();
    initGSTCalculator();
    initFreelanceCalculator();
    initPaymentCalculator();
    initTableOfContentsSpy();
    // Document & Finance Tools
    initPDFtoJPG();
    initJPGtoPDF();
    initImageCompressor();
    initPDFMerger();
    initPDFSplitter();
    initCurrencyConverter();
    initDueDateCalculator();
    initPaymentInstallmentCalculator();
    initPaymentLinkCreator();
    initCloudFilesManager();
    initToolsHub();
  });

  // Global API export
  window.ToolsEngine = {
    saveToCloud,
    triggerBlobDownload,
    formatBytes,
    showToast,
    copyText
  };

})();
