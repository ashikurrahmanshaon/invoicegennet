const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
console.log('Total HTML files:', files.length);

const results = files.map(f => {
  const content = fs.readFileSync(f, 'utf8');
  const hasGoogleFonts = content.includes('fonts.googleapis.com');
  const cssLinks = (content.match(/href=["']css\/[^"']+["']/g) || []).map(m => m.replace(/href=["']/, '').replace(/["']$/, ''));
  const headerMatch = content.match(/<header class="navbar-saas"[\s\S]*?<\/header>/);
  const brandNameMatch = headerMatch ? headerMatch[0].match(/class="brand-name">([\s\S]*?)<\/div>/) : null;
  const hasNavCenter = headerMatch ? headerMatch[0].includes('nav-center-links') : false;
  const footerMatch = content.match(/<footer[\s\S]*?<\/footer>/);
  const footerClass = footerMatch ? (footerMatch[0].match(/class="([^"]+)"/) || [])[1] : 'NONE';
  const hasOldTagline = content.includes('The modern, private, and effortless online invoice generator');

  return {
    file: f,
    hasGoogleFonts,
    cssLinks,
    brandName: brandNameMatch ? brandNameMatch[1].trim() : 'NONE',
    hasNavCenter,
    footerClass,
    hasOldTagline
  };
});

console.log(JSON.stringify(results, null, 2));
