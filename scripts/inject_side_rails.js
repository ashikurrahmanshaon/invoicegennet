const fs = require('fs');
const path = require('path');

const PUB_ID = 'ca-pub-2606660907793468';

const SIDE_RAIL_HTML = `
  <!-- Desktop Left Gutter Side Rail Ad (Empty Left Margin >= 1600px) -->
  <aside class="side-rail-ad side-rail-left no-print" aria-label="Advertisement">
    <div class="side-rail-inner">
      <span class="side-rail-label">Advertisement</span>
      <ins class="adsbygoogle"
           style="display:inline-block;width:160px;height:600px"
           data-ad-client="${PUB_ID}"
           data-ad-slot="1606001001"
           data-ad-format="vertical"></ins>
      <script>
           (adsbygoogle = window.adsbygoogle || []).push({});
      </script>
    </div>
  </aside>

  <!-- Desktop Right Gutter Side Rail Ad (Empty Right Margin >= 1600px) -->
  <aside class="side-rail-ad side-rail-right no-print" aria-label="Advertisement">
    <div class="side-rail-inner">
      <span class="side-rail-label">Advertisement</span>
      <ins class="adsbygoogle"
           style="display:inline-block;width:160px;height:600px"
           data-ad-client="${PUB_ID}"
           data-ad-slot="1606001002"
           data-ad-format="vertical"></ins>
      <script>
           (adsbygoogle = window.adsbygoogle || []).push({});
      </script>
    </div>
  </aside>
`;

const rootDir = path.resolve(__dirname, '..');
const files = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));

// Exclude app internal / auth screens
const excludedPages = [
  'dashboard.html',
  'login.html',
  'signup.html',
  'client-details.html',
  'invoice-details.html',
  'files.html'
];

let updatedSideRails = 0;
let updatedAdLabels = 0;

files.forEach(file => {
  if (excludedPages.includes(file)) return;

  const filePath = path.join(rootDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Add side-rail ads if not present
  if (!content.includes('class="side-rail-ad')) {
    if (content.includes('</body>')) {
      content = content.replace('</body>', `${SIDE_RAIL_HTML}\n</body>`);
      changed = true;
      updatedSideRails++;
    }
  }

  // 2. Add ad-slot-label inside .ad-placement-slot if missing
  if (content.includes('class="ad-placement-slot') && !content.includes('class="ad-slot-label"')) {
    content = content.replace(
      /<div class="ad-placement-slot([^>]*)>\s*<ins/g,
      '<div class="ad-placement-slot$1>\n    <span class="ad-slot-label">Advertisement</span>\n    <ins'
    );
    changed = true;
    updatedAdLabels++;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ads in: ${file}`);
  }
});

console.log(`\nFinished: Injected side rails into ${updatedSideRails} pages, updated ad labels in ${updatedAdLabels} pages.`);
