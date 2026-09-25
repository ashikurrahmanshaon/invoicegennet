const fs = require('fs');
const http = require('http');

const sitemap = fs.readFileSync('sitemap.xml', 'utf8');
const locMatches = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);

console.log(`Checking ${locMatches.length} URLs in sitemap.xml against local server...`);

async function checkUrl(urlStr) {
  return new Promise((resolve) => {
    const parsed = new URL(urlStr);
    const options = {
      hostname: '127.0.0.1',
      port: 3000,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'Host': 'invoice-gen.net' // simulate apex host
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        // extract canonical
        const canMatch = body.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
        const canonical = canMatch ? canMatch[1] : null;
        resolve({
          url: urlStr,
          status: res.statusCode,
          location: res.headers.location,
          canonical: canonical,
          canonicalMatches: canonical === urlStr
        });
      });
    });

    req.on('error', (err) => {
      resolve({ url: urlStr, error: err.message });
    });

    req.end();
  });
}

(async () => {
  let failed = 0;
  for (const url of locMatches) {
    const res = await checkUrl(url);
    if (res.status !== 200 || !res.canonicalMatches) {
      console.error(`❌ Mismatch/Issue: ${res.url} -> Status: ${res.status}, Canonical: ${res.canonical}`);
      failed++;
    } else {
      console.log(`✅ OK: ${res.url} -> Status: ${res.status}`);
    }
  }

  console.log(`\nSitemap verification complete: ${locMatches.length - failed}/${locMatches.length} valid 200 OK with matching canonicals.`);
  if (failed > 0) process.exit(1);
})();
