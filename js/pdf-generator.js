/* ==========================================================================
   PDF GENERATOR & PRINT EXPORT ENGINE
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
    }, 3200);
  }

  printInvoice() {
    window.print();
  }

  async downloadPDF() {
    if (this.isGenerating) return;

    const downloadBtn = document.getElementById('btnDownloadPDF');
    const originalText = downloadBtn ? downloadBtn.innerHTML : 'Download PDF';

    try {
      this.isGenerating = true;
      if (downloadBtn) {
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = `
          <svg class="animate-spin" style="width:16px;height:16px;animation:spin 1s linear infinite" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-opacity="0.25"></circle>
            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Generating PDF...
        `;
      }

      const element = document.getElementById('invoicePaper') || document.getElementById('invoiceSheet');
      if (!element) throw new Error('Invoice sheet element not found.');

      const state = window.invoiceStore ? window.invoiceStore.getState() : {};
      const invNumber = (state.number || 'INV-001').replace(/[^a-zA-Z0-9-_]/g, '_');
      const filename = `Invoice_${invNumber}.pdf`;

      // Check if html2pdf is available via CDN
      if (typeof html2pdf !== 'undefined') {
        const opt = {
          margin: [10, 10, 10, 10], // mm
          filename: filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            letterRendering: true,
            windowWidth: 1024
          },
          jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait'
          },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        await html2pdf().set(opt).from(element).save();
        this.showToast('Invoice PDF downloaded successfully!');
      } else {
        // Fallback: Trigger browser native print
        this.showToast('Opening print dialog for PDF export...', 'info');
        window.print();
      }
    } catch (err) {
      console.error('PDF Generation Error:', err);
      this.showToast('Could not generate PDF via script. Opening print mode...', 'warning');
      window.print();
    } finally {
      this.isGenerating = false;
      if (downloadBtn) {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = originalText;
      }
    }
  }
}

window.pdfEngine = new PDFEngine();
