const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// All HTML files in the project
const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));

console.log(`Found ${htmlFiles.length} HTML files to update.`);

// Sleek SVG trust row to insert into all footers right before </div>\n  </footer>
const footerTrustRow = `        <!-- Sleek Trust & Gateway Row -->
        <div class="footer-bottom-trust-row" style="grid-column: 1 / -1;">
          <div class="footer-badges-wrap">
            <span class="footer-badge-pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              100% Client-Side Privacy
            </span>
            <span class="footer-badge-pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              256-Bit SSL Encrypted
            </span>
            <span class="footer-badge-pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Stripe &amp; PayPal Verified
            </span>
            <span class="footer-badge-pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
              ISO A4 Print Standard
            </span>
          </div>
          <div class="footer-security-text">
            No Cloud Tracking &bull; Zero Watermarks &bull; Unlimited Downloads
          </div>
        </div>`;

for (const file of htmlFiles) {
  const filePath = path.join(rootDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // 1. Update Domain URLs
  content = content.replace(/https:\/\/invoicegen\.net/g, 'https://invoice-gen.net');
  content = content.replace(/http:\/\/invoicegen\.net/g, 'https://invoice-gen.net');

  // 2. Update Brand Name
  content = content.replace(/InvoiceGen<span class="accent">\.net<\/span>/g, 'Invoice-Gen<span class="accent">.net</span>');
  content = content.replace(/InvoiceGen\.net/g, 'Invoice-Gen.net');

  // 3. Update footer copyright
  content = content.replace(/&copy; 2016-2026 InvoiceGen\.net/g, '&copy; 2016-2026 Invoice-Gen.net');
  content = content.replace(/© 2016-2026 InvoiceGen\.net/g, '© 2016-2026 Invoice-Gen.net');

  // 4. Clean out emojis
  // Common emojis in headings and badges
  content = content.replace(/🚀\s*/g, '');
  content = content.replace(/📄\s*/g, '');
  content = content.replace(/🚫\s*/g, '');
  content = content.replace(/💳\s*/g, '');
  content = content.replace(/⚡️?\s*/g, '');
  content = content.replace(/⏱️?\s*/g, '');
  content = content.replace(/🌍\s*/g, '');
  content = content.replace(/🛡️?\s*/g, '');
  content = content.replace(/💡\s*Pro-Tip/g, 'Pro-Tip');
  content = content.replace(/💡\s*Rule of Thumb/g, 'Rule of Thumb');
  content = content.replace(/💡\s*/g, '');
  content = content.replace(/❌\s*/g, '');
  content = content.replace(/🏆\s*/g, '');
  content = content.replace(/🏛️?\s*/g, '');
  content = content.replace(/🔢\s*/g, '');
  content = content.replace(/📅\s*/g, '');
  content = content.replace(/🏡\s*/g, '');
  content = content.replace(/🅿️\s*/g, '');
  content = content.replace(/🔒\s*/g, '');
  content = content.replace(/🇦🇺\s*/g, '');
  content = content.replace(/🇬🇧\s*/g, '');
  content = content.replace(/🇮🇳\s*/g, '');
  content = content.replace(/🇪🇺\s*/g, '');
  content = content.replace(/🇧🇩\s*/g, '');
  content = content.replace(/🇩🇪\s*/g, '');
  content = content.replace(/🇧🇷\s*/g, '');

  // 5. In blog.html replace the trending hub card emoji icons with clean SVG icons
  if (file === 'blog.html') {
    content = content.replace(
      /<div class="trending-card-icon">⚡<\/div>/g,
      `<div class="trending-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00c875" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg></div>`
    );
    content = content.replace(
      /<div class="trending-card-icon">📄<\/div>/g,
      `<div class="trending-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00c875" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg></div>`
    );
    content = content.replace(
      /<div class="trending-card-icon">💼<\/div>/g,
      `<div class="trending-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00c875" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg></div>`
    );
    content = content.replace(
      /<div class="trending-card-icon">📝<\/div>/g,
      `<div class="trending-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00c875" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg></div>`
    );
    content = content.replace(
      /<div class="trending-card-icon">🏆<\/div>/g,
      `<div class="trending-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00c875" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg></div>`
    );
    content = content.replace(
      /<div class="trending-card-icon">🏛️<\/div>/g,
      `<div class="trending-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00c875" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="21" x2="21" y2="21"></line><line x1="3" y1="10" x2="21" y2="10"></line><polyline points="5 10 12 3 19 10"></polyline><line x1="4" y1="10" x2="4" y2="21"></line><line x1="20" y1="10" x2="20" y2="21"></line></svg></div>`
    );
    content = content.replace(
      /<div class="trending-card-icon">🔢<\/div>/g,
      `<div class="trending-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00c875" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line></svg></div>`
    );
  }

  // 6. Add trust row to footers if not already present
  if (content.includes('footer-columns-grid') && !content.includes('footer-bottom-trust-row')) {
    // Replace the end of footer-columns-grid
    content = content.replace(
      /(\s*<\/div>\s*<\/div>\s*<\/footer>)/,
      `\n${footerTrustRow}\n      </div>\n    </div>\n  </footer>`
    );
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Updated ${file}`);
}

console.log('All HTML files successfully updated!');
