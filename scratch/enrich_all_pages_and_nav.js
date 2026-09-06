const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));

const generatorPages = [
  'index.html',
  'free-invoice-generator.html',
  'pdf-invoice-generator.html',
  'invoice-generator-for-freelancers.html',
  'how-to-make-an-invoice.html',
  'best-invoice-generator.html',
  'gst-invoice-generator.html',
  'invoice-number-generator.html'
];

// SVG Box Icons Dictionary
const ICONS = {
  free: `<div class="box-icon-frame" style="margin-bottom: 14px;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>`,
  shield: `<div class="box-icon-frame" style="margin-bottom: 14px;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>`,
  globe: `<div class="box-icon-frame" style="margin-bottom: 14px;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></div>`,
  card: `<div class="box-icon-frame" style="margin-bottom: 14px;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></div>`,
  vector: `<div class="box-icon-frame" style="margin-bottom: 14px;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>`,
  check: `<div class="box-icon-frame" style="margin-bottom: 14px;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>`,
  download: `<div class="box-icon-frame" style="margin-bottom: 14px;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></div>`,
  briefcase: `<div class="box-icon-frame" style="margin-bottom: 14px;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg></div>`,
  calendar: `<div class="box-icon-frame" style="margin-bottom: 14px;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>`,
  hash: `<div class="box-icon-frame" style="margin-bottom: 14px;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg></div>`,
  percent: `<div class="box-icon-frame" style="margin-bottom: 14px;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg></div>`
};

for (const file of htmlFiles) {
  const filePath = path.join(rootDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Navigation Active Classes
  const isGen = generatorPages.includes(file);
  const isTemplates = file === 'templates.html';
  const isFeatures = file === 'features.html';
  const isPricing = file === 'pricing.html';

  const desktopNav = `      <!-- Center SaaS Navigation Links -->
      <nav class="nav-center-links" aria-label="Main navigation">
        <a href="index.html" class="nav-link-item${isGen ? ' active' : ''}" data-i18n="nav_generator">Invoice Generator</a>
        <a href="templates.html" class="nav-link-item${isTemplates ? ' active' : ''}" data-i18n="nav_templates">Templates</a>
        <a href="features.html" class="nav-link-item${isFeatures ? ' active' : ''}" data-i18n="nav_features">Features</a>
        <a href="pricing.html" class="nav-link-item${isPricing ? ' active' : ''}" data-i18n="nav_pricing">Pricing</a>
      </nav>`;

  const mobileNav = `      <div class="mobile-nav-links">
        <a href="index.html" class="mobile-nav-item${isGen ? ' active' : ''}" data-i18n="nav_generator">Invoice Generator</a>
        <a href="templates.html" class="mobile-nav-item${isTemplates ? ' active' : ''}" data-i18n="nav_templates">Templates</a>
        <a href="features.html" class="mobile-nav-item${isFeatures ? ' active' : ''}" data-i18n="nav_features">Features</a>
        <a href="pricing.html" class="mobile-nav-item${isPricing ? ' active' : ''}" data-i18n="nav_pricing">Pricing</a>
      </div>`;

  content = content.replace(
    /<!-- Center SaaS Navigation Links -->\s*<nav class="nav-center-links"[\s\S]*?<\/nav>/,
    desktopNav
  );

  content = content.replace(
    /<div class="mobile-nav-links">[\s\S]*?<\/div>/,
    mobileNav
  );

  // SEO Page Box Icon Injections
  if (file === 'free-invoice-generator.html') {
    content = content.replace(
      `<div class="seo-feature-card">\n          <h4>100% Free Forever</h4>`,
      `<div class="seo-feature-card">\n          ${ICONS.free}\n          <h4>100% Free Forever</h4>`
    );
    content = content.replace(
      `<div class="seo-feature-card">\n          <h4>Complete Data Privacy</h4>`,
      `<div class="seo-feature-card">\n          ${ICONS.shield}\n          <h4>Complete Data Privacy</h4>`
    );
    content = content.replace(
      `<div class="seo-feature-card">\n          <h4>30+ Global Currencies</h4>`,
      `<div class="seo-feature-card">\n          ${ICONS.globe}\n          <h4>30+ Global Currencies</h4>`
    );
    content = content.replace(
      `<div class="seo-feature-card">\n          <h4>Integrated Payments</h4>`,
      `<div class="seo-feature-card">\n          ${ICONS.card}\n          <h4>Integrated Payments</h4>`
    );
  }

  if (file === 'pdf-invoice-generator.html') {
    content = content.replace(
      `<div class="seo-feature-card">\n          <h4>100% Vector Crispness</h4>`,
      `<div class="seo-feature-card">\n          ${ICONS.vector}\n          <h4>100% Vector Crispness</h4>`
    );
    content = content.replace(
      `<div class="seo-feature-card">\n          <h4>No Watermarks Ever</h4>`,
      `<div class="seo-feature-card">\n          ${ICONS.check}\n          <h4>No Watermarks Ever</h4>`
    );
    content = content.replace(
      `<div class="seo-feature-card">\n          <h4>Clickable Payment Buttons</h4>`,
      `<div class="seo-feature-card">\n          ${ICONS.card}\n          <h4>Clickable Payment Buttons</h4>`
    );
    content = content.replace(
      `<div class="seo-feature-card">\n          <h4>Instant Client-Side Export</h4>`,
      `<div class="seo-feature-card">\n          ${ICONS.download}\n          <h4>Instant Client-Side Export</h4>`
    );
  }

  if (file === 'invoice-generator-for-freelancers.html') {
    content = content.replace(
      `<div class="seo-feature-card">\n          <h4>Hourly &amp; Milestone Billing</h4>`,
      `<div class="seo-feature-card">\n          ${ICONS.briefcase}\n          <h4>Hourly &amp; Milestone Billing</h4>`
    );
    content = content.replace(
      `<div class="seo-feature-card">\n          <h4>Multi-Currency Support</h4>`,
      `<div class="seo-feature-card">\n          ${ICONS.globe}\n          <h4>Multi-Currency Support</h4>`
    );
    content = content.replace(
      `<div class="seo-feature-card">\n          <h4>Integrated Payment Links</h4>`,
      `<div class="seo-feature-card">\n          ${ICONS.card}\n          <h4>Integrated Payment Links</h4>`
    );
    content = content.replace(
      `<div class="seo-feature-card">\n          <h4>Zero Cloud Data Leakage</h4>`,
      `<div class="seo-feature-card">\n          ${ICONS.shield}\n          <h4>Zero Cloud Data Leakage</h4>`
    );
  }

  if (file === 'how-to-make-an-invoice.html') {
    content = content.replace(
      `<div class="seo-feature-card">\n          <h4>Vague Descriptions</h4>`,
      `<div class="seo-feature-card">\n          ${ICONS.vector}\n          <h4>Vague Descriptions</h4>`
    );
    content = content.replace(
      `<div class="seo-feature-card">\n          <h4>Omitting Due Dates</h4>`,
      `<div class="seo-feature-card">\n          ${ICONS.calendar}\n          <h4>Omitting Due Dates</h4>`
    );
    content = content.replace(
      `<div class="seo-feature-card">\n          <h4>Forgetting Click-to-Pay</h4>`,
      `<div class="seo-feature-card">\n          ${ICONS.card}\n          <h4>Forgetting Click-to-Pay</h4>`
    );
    content = content.replace(
      `<div class="seo-feature-card">\n          <h4>Duplicate Invoice Numbers</h4>`,
      `<div class="seo-feature-card">\n          ${ICONS.hash}\n          <h4>Duplicate Invoice Numbers</h4>`
    );
  }

  if (file === 'gst-invoice-generator.html') {
    content = content.replace(
      `<div class="tax-box">\n          <h4>Australian GST (10%)</h4>`,
      `<div class="tax-box">\n          ${ICONS.percent}\n          <h4>Australian GST (10%)</h4>`
    );
    content = content.replace(
      `<div class="tax-box">\n          <h4>UK &amp; EU Standard VAT (20%)</h4>`,
      `<div class="tax-box">\n          ${ICONS.globe}\n          <h4>UK &amp; EU Standard VAT (20%)</h4>`
    );
    content = content.replace(
      `<div class="tax-box">\n          <h4>Indian GST (18%)</h4>`,
      `<div class="tax-box">\n          ${ICONS.percent}\n          <h4>Indian GST (18%)</h4>`
    );
    content = content.replace(
      `<div class="tax-box">\n          <h4>North American Sales Taxes</h4>`,
      `<div class="tax-box">\n          ${ICONS.card}\n          <h4>North American Sales Taxes</h4>`
    );
  }

  if (file === 'invoice-number-generator.html') {
    content = content.replace(
      `<div class="format-card">\n          <span class="format-code">INV-2026-001</span>`,
      `<div class="format-card">\n          ${ICONS.hash}\n          <span class="format-code">INV-2026-001</span>`
    );
    content = content.replace(
      `<div class="format-card">\n          <span class="format-code">2026-09-001</span>`,
      `<div class="format-card">\n          ${ICONS.calendar}\n          <span class="format-code">2026-09-001</span>`
    );
    content = content.replace(
      `<div class="format-card">\n          <span class="format-code">ACME-2026-01</span>`,
      `<div class="format-card">\n          ${ICONS.briefcase}\n          <span class="format-code">ACME-2026-01</span>`
    );
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Enriched and harmonized: ${file}`);
}

console.log('All pages processed successfully!');
