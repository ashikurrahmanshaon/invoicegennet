const fs = require('fs');
const path = require('path');

const PUB_ID = 'ca-pub-2606660907793468';
const ADSENSE_SNIPPET = `  <!-- Google AdSense Account Verification & Auto Ads -->
  <meta name="google-adsense-account" content="${PUB_ID}">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUB_ID}" crossorigin="anonymous"></script>`;

const AD_SLOT_HTML = `
  <!-- Google AdSense Responsive Unit Placement -->
  <div class="ad-placement-slot no-print" aria-label="Advertisement">
    <ins class="adsbygoogle"
         style="display:block"
         data-ad-client="${PUB_ID}"
         data-ad-slot="auto"
         data-ad-format="auto"
         data-full-width-responsive="true"></ins>
    <script>
         (adsbygoogle = window.adsbygoogle || []).push({});
    </script>
  </div>
`;

const rootDir = path.resolve(__dirname, '..');
const files = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));

let modifiedCount = 0;

files.forEach(file => {
  const filePath = path.join(rootDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  let changed = false;

  // 1. Inject AdSense script & meta into <head>
  if (!content.includes(PUB_ID)) {
    if (content.includes('</head>')) {
      content = content.replace('</head>', `${ADSENSE_SNIPPET}\n</head>`);
      changed = true;
    }
  }

  // 2. Add ad placement slot on main invoice generator pages if not present
  const generatorPages = ['index.html', 'free-invoice-generator.html', 'pdf-invoice-generator.html'];
  if (generatorPages.includes(file) && !content.includes('class="ad-placement-slot')) {
    // Add ad slot between workspace and popular tools section
    if (content.includes('</main>')) {
      content = content.replace('</main>', `</main>\n${AD_SLOT_HTML}`);
      changed = true;
    }
  }

  // 3. Add ad placement slot on tools hub
  if (file === 'tools.html' && !content.includes('class="ad-placement-slot')) {
    if (content.includes('<div class="tools-grid"')) {
      content = content.replace('<div class="tools-grid"', `${AD_SLOT_HTML}\n      <div class="tools-grid"`);
      changed = true;
    }
  }

  // 4. Add ad placement slot on templates and features
  if (['templates.html', 'features.html', 'pricing.html', 'blog.html'].includes(file) && !content.includes('class="ad-placement-slot')) {
    if (content.includes('</header>')) {
      content = content.replace('</header>', `</header>\n${AD_SLOT_HTML}`);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedCount++;
    console.log(`Updated AdSense in: ${file}`);
  }
});

console.log(`Finished. Updated ${modifiedCount} HTML files.`);
