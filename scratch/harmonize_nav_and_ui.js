const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));

console.log(`Auditing ${htmlFiles.length} HTML files for navigation & UI consistency...`);

for (const file of htmlFiles) {
  const filePath = path.join(rootDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Determine active states
  const isIndex = file === 'index.html';
  const isTemplates = file === 'templates.html';
  const isFeatures = file === 'features.html';
  const isPricing = file === 'pricing.html';

  const desktopNav = `      <!-- Center SaaS Navigation Links -->
      <nav class="nav-center-links" aria-label="Main navigation">
        <a href="index.html" class="nav-link-item${isIndex ? ' active' : ''}" data-i18n="nav_generator">Invoice Generator</a>
        <a href="templates.html" class="nav-link-item${isTemplates ? ' active' : ''}" data-i18n="nav_templates">Templates</a>
        <a href="features.html" class="nav-link-item${isFeatures ? ' active' : ''}" data-i18n="nav_features">Features</a>
        <a href="pricing.html" class="nav-link-item${isPricing ? ' active' : ''}" data-i18n="nav_pricing">Pricing</a>
      </nav>`;

  const mobileNav = `      <div class="mobile-nav-links">
        <a href="index.html" class="mobile-nav-item${isIndex ? ' active' : ''}" data-i18n="nav_generator">Invoice Generator</a>
        <a href="templates.html" class="mobile-nav-item${isTemplates ? ' active' : ''}" data-i18n="nav_templates">Templates</a>
        <a href="features.html" class="mobile-nav-item${isFeatures ? ' active' : ''}" data-i18n="nav_features">Features</a>
        <a href="pricing.html" class="mobile-nav-item${isPricing ? ' active' : ''}" data-i18n="nav_pricing">Pricing</a>
      </div>`;

  // Replace desktop nav
  content = content.replace(
    /<!-- Center SaaS Navigation Links -->\s*<nav class="nav-center-links"[\s\S]*?<\/nav>/,
    desktopNav
  );

  // Replace mobile nav
  content = content.replace(
    /<div class="mobile-nav-links">[\s\S]*?<\/div>/,
    mobileNav
  );

  // Ensure title brand format is Invoice-Gen.net
  content = content.replace(/InvoiceGen\.net/g, 'Invoice-Gen.net');

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Harmonized nav on ${file}`);
}

console.log('All files navigation harmonized successfully.');
