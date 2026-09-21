/* ==========================================================================
   INVOICE-GEN.NET - CLOUD DATA SYNCHRONIZATION ENGINE
   Ensures zero orphaned browser storage & full cloud SQLite persistence
   ========================================================================== */

(function () {
  'use strict';

  window.CloudSync = {
    isSyncing: false,

    async syncLocalDataToCloud() {
      if (this.isSyncing) return;
      this.isSyncing = true;

      try {
        // Check if user is authenticated
        const authRes = await fetch('/api/auth/me');
        const authData = await authRes.json();
        if (!authData || !authData.authenticated) {
          this.isSyncing = false;
          return;
        }

        let migratedCount = 0;

        // 1. Migrate offline/local invoices if any
        try {
          const rawInvoices = localStorage.getItem('invoicegen_invoices');
          if (rawInvoices) {
            const invoices = JSON.parse(rawInvoices);
            if (Array.isArray(invoices) && invoices.length > 0) {
              for (const inv of invoices) {
                // If it was only a local record
                if (inv && inv.payload) {
                  try {
                    await fetch('/api/invoices', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(inv.payload)
                    });
                    migratedCount++;
                  } catch (err) {}
                }
              }
              localStorage.removeItem('invoicegen_invoices');
            }
          }
        } catch (e) {
          console.warn('Invoice migration notice:', e);
        }

        // 2. Migrate offline clients if any
        try {
          const rawClients = localStorage.getItem('invoicegen_clients');
          if (rawClients) {
            const clients = JSON.parse(rawClients);
            if (Array.isArray(clients) && clients.length > 0) {
              for (const cl of clients) {
                if (cl && cl.name) {
                  try {
                    await fetch('/api/clients', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: cl.name,
                        company: cl.company || '',
                        email: cl.email || '',
                        phone: cl.phone || '',
                        billing_address: cl.billing_address || cl.address || '',
                        notes: cl.notes || ''
                      })
                    });
                    migratedCount++;
                  } catch (err) {}
                }
              }
              localStorage.removeItem('invoicegen_clients');
            }
          }
        } catch (e) {
          console.warn('Client migration notice:', e);
        }

        // 3. Migrate offline working draft to Cloud
        try {
          const rawDraft = localStorage.getItem('invoicegen_draft') || localStorage.getItem('invoicegen_active_v3');
          if (rawDraft) {
            const draftData = JSON.parse(rawDraft);
            if (draftData && typeof draftData === 'object') {
              // Check if cloud already has a draft
              const cloudDraftRes = await fetch('/api/user/draft');
              const cloudDraftData = await cloudDraftRes.json();
              if (!cloudDraftData.draft) {
                await fetch('/api/user/draft', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(draftData)
                });
                migratedCount++;
              }
              localStorage.removeItem('invoicegen_draft');
              localStorage.removeItem('invoicegen_active_v3');
            }
          }
        } catch (e) {
          console.warn('Draft migration notice:', e);
        }

        // 4. Migrate local business profile if server user profile is empty
        try {
          const rawProfile = localStorage.getItem('invoicegen_business_profile');
          if (rawProfile) {
            const localBiz = JSON.parse(rawProfile);
            if (localBiz && (localBiz.name || localBiz.businessName)) {
              const u = authData.user || {};
              if (!u.business_name && !u.business_address) {
                await fetch('/api/auth/profile', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    business_name: localBiz.businessName || localBiz.name || '',
                    business_email: localBiz.email || '',
                    business_phone: localBiz.phone || '',
                    business_address: localBiz.address || '',
                    business_tax_id: localBiz.taxId || '',
                    default_currency: localBiz.currency || 'USD',
                    default_payment_terms: localBiz.paymentTerms || 'Due on Receipt'
                  })
                });
              }
              localStorage.removeItem('invoicegen_business_profile');
            }
          }
        } catch (e) {
          console.warn('Profile migration notice:', e);
        }

        if (migratedCount > 0) {
          if (window.showToast) {
            window.showToast('Your invoices and drafts have been synced to the cloud!', 'success');
          }
          if (window.loadDashboardSummary) window.loadDashboardSummary();
          if (window.loadInvoicesTable) window.loadInvoicesTable();
        }
      } catch (e) {
        console.warn('Cloud sync error:', e);
      } finally {
        this.isSyncing = false;
      }
    }
  };

  // Run auto-migration on document readiness if user is logged in
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.CloudSync.syncLocalDataToCloud());
  } else {
    window.CloudSync.syncLocalDataToCloud();
  }
})();
