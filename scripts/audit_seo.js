const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
console.log('Total HTML files:', files.length);

const results = [];

files.forEach(file => {
  const html = fs.readFileSync(file, 'utf8');
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : null;
  
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i) ||
                    html.match(/<meta\s+content=["']([^"']*)["']\s+name=["']description["']/i);
  const desc = descMatch ? descMatch[1].trim() : null;
  
  const canonMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i) ||
                     html.match(/<link\s+href=["']([^"']*)["']\s+rel=["']canonical["']/i);
  const canonical = canonMatch ? canonMatch[1].trim() : null;
  
  const ogTitle = /<meta\s+property=["']og:title["']/i.test(html);
  const ogDesc = /<meta\s+property=["']og:description["']/i.test(html);
  const ogImage = /<meta\s+property=["']og:image["']/i.test(html);
  const ogUrl = /<meta\s+property=["']og:url["']/i.test(html);
  const twCard = /<meta\s+name=["']twitter:card["']/i.test(html);
  
  const jsonLdMatch = [...html.matchAll(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)];
  let jsonLdValid = true;
  let jsonLdTypes = [];
  if (jsonLdMatch.length === 0) {
    jsonLdValid = false;
  } else {
    jsonLdMatch.forEach((m) => {
      try {
        const parsed = JSON.parse(m[1]);
        const type = parsed['@type'] || (parsed['@graph'] ? parsed['@graph'].map(g => g['@type']).join(',') : 'unknown');
        jsonLdTypes.push(type);
      } catch (err) {
        jsonLdValid = false;
        jsonLdTypes.push('INVALID_JSON: ' + err.message);
      }
    });
  }

  // Check for dummy / placeholder text like "Lorem ipsum"
  const hasLorem = /lorem ipsum/i.test(html);

  results.push({
    file,
    hasTitle: !!title,
    title,
    titleLen: title ? title.length : 0,
    hasDesc: !!desc,
    desc,
    descLen: desc ? desc.length : 0,
    hasCanonical: !!canonical,
    canonical,
    hasOg: ogTitle && ogDesc && ogImage && ogUrl,
    hasTwitter: twCard,
    hasJsonLd: jsonLdMatch.length > 0 && jsonLdValid,
    jsonLdCount: jsonLdMatch.length,
    jsonLdTypes: jsonLdTypes.join('; '),
    hasLorem
  });
});

console.log('\n=== SUMMARY REPORT ===');
console.log('Total files checked:', results.length);

const missingTitle = results.filter(r => !r.hasTitle);
console.log('\nMissing Title (' + missingTitle.length + '):', missingTitle.map(r => r.file));

const missingDesc = results.filter(r => !r.hasDesc);
console.log('\nMissing Description (' + missingDesc.length + '):', missingDesc.map(r => r.file));

const missingCanonical = results.filter(r => !r.hasCanonical);
console.log('\nMissing Canonical (' + missingCanonical.length + '):', missingCanonical.map(r => r.file));

const missingOg = results.filter(r => !r.hasOg);
console.log('\nMissing OpenGraph (' + missingOg.length + '):', missingOg.map(r => r.file));

const missingTwitter = results.filter(r => !r.hasTwitter);
console.log('\nMissing Twitter Card (' + missingTwitter.length + '):', missingTwitter.map(r => r.file));

const missingJsonLd = results.filter(r => !r.hasJsonLd);
console.log('\nMissing or Invalid JSON-LD (' + missingJsonLd.length + '):', missingJsonLd.map(r => ({ file: r.file, types: r.jsonLdTypes })));

const withLorem = results.filter(r => r.hasLorem);
console.log('\nContains "Lorem Ipsum" (' + withLorem.length + '):', withLorem.map(r => r.file));

// Detailed canonical check
const canonicalIssues = results.filter(r => r.hasCanonical && !r.canonical.startsWith('https://invoice-gen.net'));
console.log('\nCanonical not starting with https://invoice-gen.net (' + canonicalIssues.length + '):', canonicalIssues.map(r => ({ file: r.file, canonical: r.canonical })));
