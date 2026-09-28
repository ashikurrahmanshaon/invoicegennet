const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const files = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));

console.log(`=== RUNNING DEEP AUDIT ON ALL ${files.length} HTML PAGES ===\n`);

const results = [];
let totalErrors = 0;
let totalWarnings = 0;

const appPages = ['dashboard.html', 'files.html', 'login.html', 'signup.html', 'client-details.html', 'invoice-details.html', '404.html'];

files.forEach(file => {
  const filePath = path.join(rootDir, file);
  const content = fs.readFileSync(filePath, 'utf8');

  const pageReport = {
    file,
    errors: [],
    warnings: [],
    info: {}
  };

  // 1. DOCTYPE & HTML tag
  if (!content.includes('<!DOCTYPE html>')) pageReport.errors.push('Missing <!DOCTYPE html>');
  if (!content.includes('<html lang=')) pageReport.errors.push('Missing <html lang="...">');

  // 2. Head essentials
  if (!content.includes('charset="UTF-8"') && !content.includes("charset='UTF-8'")) pageReport.errors.push('Missing charset UTF-8');
  if (!content.includes('name="viewport"')) pageReport.errors.push('Missing viewport meta');

  // 3. Title check
  const titleMatch = content.match(/<title>([^<]+)<\/title>/i);
  if (!titleMatch || !titleMatch[1].trim()) {
    pageReport.errors.push('Missing <title>');
  } else {
    pageReport.info.title = titleMatch[1].trim();
  }

  // 4. Meta Description check
  const descMatch = content.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  if (!descMatch || !descMatch[1].trim()) {
    pageReport.errors.push('Missing meta description');
  } else {
    pageReport.info.descLength = descMatch[1].length;
  }

  // 5. Canonical check
  const canonMatch = content.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  if (!canonMatch) {
    pageReport.errors.push('Missing canonical tag');
  } else if (!canonMatch[1].startsWith('https://invoice-gen.net')) {
    pageReport.errors.push(`Invalid canonical: ${canonMatch[1]}`);
  }

  // 6. OpenGraph & Twitter Cards
  if (!content.includes('property="og:title"')) pageReport.errors.push('Missing og:title');
  if (!content.includes('property="og:description"')) pageReport.errors.push('Missing og:description');
  
  const ogImageMatch = content.match(/property=["']og:image["']\s+content=["']([^"']+)["']/i);
  if (!ogImageMatch) {
    pageReport.errors.push('Missing og:image');
  } else if (ogImageMatch[1].endsWith('.svg') || ogImageMatch[1].includes('.svg?')) {
    pageReport.errors.push(`og:image uses SVG instead of PNG: ${ogImageMatch[1]}`);
  } else {
    pageReport.info.ogImage = ogImageMatch[1];
  }

  if (!content.includes('name="twitter:card"')) pageReport.errors.push('Missing twitter:card');

  // 7. External Fonts Cleanup (Should NOT contain external google font links)
  if (content.includes('fonts.googleapis.com') || content.includes('fonts.gstatic.com')) {
    pageReport.errors.push('Still contains external Google Fonts link');
  }

  // 8. Advertisement label check (Should NOT contain >Advertisement<)
  if (content.includes('>Advertisement<')) {
    pageReport.errors.push('Still contains visible >Advertisement< text');
  }

  // 9. Heading structure
  const h1Matches = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  if (h1Matches.length === 0 && !appPages.includes(file)) {
    pageReport.errors.push('Missing <h1> heading');
  } else if (h1Matches.length > 1 && !appPages.includes(file)) {
    pageReport.warnings.push(`Multiple <h1> headings found (${h1Matches.length})`);
  }

  // 10. Lorem Ipsum check
  if (/lorem\s+ipsum/i.test(content)) {
    pageReport.errors.push('Contains placeholder "Lorem Ipsum" text');
  }

  // 11. AdSense Verification (All pages should have publisher ID)
  if (!content.includes('ca-pub-2606660907793468')) {
    pageReport.errors.push('Missing Google AdSense publisher ID');
  }

  // 12. Local Font Preload
  if (!content.includes('plus-jakarta-sans-variable.woff2')) {
    pageReport.warnings.push('Does not preload local Plus Jakarta Sans font');
  }

  totalErrors += pageReport.errors.length;
  totalWarnings += pageReport.warnings.length;
  results.push(pageReport);
});

// Output Summary
const passedPages = results.filter(r => r.errors.length === 0 && r.warnings.length === 0);
const warningPages = results.filter(r => r.errors.length === 0 && r.warnings.length > 0);
const failedPages = results.filter(r => r.errors.length > 0);

console.log(`✅ Perfectly Valid Pages (0 errors, 0 warnings): ${passedPages.length} / ${files.length}`);
console.log(`⚠️ Pages with minor warnings: ${warningPages.length}`);
console.log(`❌ Failed Pages: ${failedPages.length}`);

if (failedPages.length > 0) {
  console.log('\n--- DETAILED ERRORS ---');
  failedPages.forEach(p => {
    console.log(`\n📄 ${p.file}:`);
    p.errors.forEach(e => console.log(`   ❌ ${e}`));
    p.warnings.forEach(w => console.log(`   ⚠️ ${w}`));
  });
}

if (warningPages.length > 0) {
  console.log('\n--- PAGES WITH WARNINGS ---');
  warningPages.forEach(p => {
    console.log(`\n📄 ${p.file}:`);
    p.warnings.forEach(w => console.log(`   ⚠️ ${w}`));
  });
}
