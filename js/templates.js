/* ==========================================================================
   INVOICE TEMPLATES & THEMES
   ========================================================================== */

const TEMPLATES = {
  emerald: {
    name: 'Emerald Modern',
    className: 'theme-emerald',
    primaryColor: '#059669',
    accentColor: '#ecfdf5',
    headerStyle: 'modern'
  },
  minimal: {
    name: 'Minimalist Clean',
    className: 'theme-minimal',
    primaryColor: '#0f172a',
    accentColor: '#f8fafc',
    headerStyle: 'minimal'
  },
  classic: {
    name: 'Classic Corporate',
    className: 'theme-classic',
    primaryColor: '#1e3a8a',
    accentColor: '#eff6ff',
    headerStyle: 'classic'
  }
};

function applyTemplate(templateName) {
  const sheet = document.getElementById('invoiceSheet');
  if (!sheet) return;

  // Remove existing template classes
  sheet.classList.remove('theme-emerald', 'theme-minimal', 'theme-classic');

  const selected = TEMPLATES[templateName] || TEMPLATES.emerald;
  sheet.classList.add(selected.className);

  // Update active state in template preview selector cards if on page
  document.querySelectorAll('.template-card').forEach(card => {
    if (card.dataset.template === templateName) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });

  const selectDropdown = document.getElementById('templateSelector');
  if (selectDropdown && selectDropdown.value !== templateName) {
    selectDropdown.value = templateName;
  }
}

window.applyTemplate = applyTemplate;
