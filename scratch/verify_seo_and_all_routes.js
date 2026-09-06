const http = require('http');

const PORT = 57784;

const routesToTest = [
  '/',
  '/free-invoice-generator.html',
  '/pdf-invoice-generator.html',
  '/invoice-generator-for-freelancers.html',
  '/how-to-make-an-invoice.html',
  '/best-invoice-generator.html',
  '/gst-invoice-generator.html',
  '/invoice-number-generator.html',
  '/templates.html',
  '/pricing.html',
  '/payments.html',
  '/features.html',
  '/blog.html',
  '/invoicing-guide.html',
  '/getting-paid-faster.html',
  '/stripe-vs-paypal.html',
  '/about.html',
  '/security.html',
  '/contact.html',
  '/privacy.html',
  '/terms.html',
  '/refunds.html',
  '/login.html',
  '/signup.html',
  '/sitemap.xml',
  '/robots.txt'
];

function fetchRoute(route) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${PORT}${route}`, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body }));
    }).on('error', reject);
  });
}

// Check for common emojis
const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

async function run() {
  console.log(`Starting comprehensive verification on port ${PORT}...`);
  let errors = [];

  for (const route of routesToTest) {
    try {
      const res = await fetchRoute(route);
      if (res.statusCode !== 200) {
        errors.push(`FAIL: ${route} returned status ${res.statusCode}`);
        continue;
      }

      if (route.endsWith('.html') || route === '/') {
        // Check SEO title
        if (!res.body.includes('<title>')) {
          errors.push(`FAIL: ${route} missing <title> tag`);
        }
        // Check SEO meta description
        if (!res.body.includes('name="description"')) {
          errors.push(`FAIL: ${route} missing meta description`);
        }
        // Check canonical has invoice-gen.net
        if (!res.body.includes('https://invoice-gen.net') && route !== '/') {
          errors.push(`FAIL: ${route} missing https://invoice-gen.net canonical`);
        }

        // Check footer copyright placement
        if (!res.body.includes('footer-brand-copyright') && !route.includes('login') && !route.includes('signup')) {
          errors.push(`FAIL: ${route} missing .footer-brand-copyright in Col 1`);
        }
        if (!res.body.includes('2016-2026 Invoice-Gen.net') && !route.includes('login') && !route.includes('signup')) {
          errors.push(`FAIL: ${route} missing '2016-2026 Invoice-Gen.net' copyright`);
        }

        // Verify ZERO emojis
        const emojiMatch = res.body.match(emojiRegex);
        if (emojiMatch) {
          errors.push(`FAIL: ${route} contains emoji: ${emojiMatch[0]}`);
        }
      }

      // If it's one of the 7 SEO query pages, check Schema.org JSON-LD
      if (['/free-invoice-generator.html', '/pdf-invoice-generator.html', '/invoice-generator-for-freelancers.html', '/how-to-make-an-invoice.html', '/best-invoice-generator.html', '/gst-invoice-generator.html', '/invoice-number-generator.html'].includes(route)) {
        if (!res.body.includes('application/ld+json')) {
          errors.push(`FAIL: ${route} missing application/ld+json`);
        } else {
          // Validate JSON-LD parse
          const match = res.body.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
          if (match && match[1]) {
            try {
              JSON.parse(match[1]);
            } catch (err) {
              errors.push(`FAIL: ${route} JSON-LD parsing error: ${err.message}`);
            }
          }
        }
      }

      console.log(`PASS: ${route} (200 OK - No Emojis, Valid Footer, Correct Domain)`);
    } catch (err) {
      errors.push(`ERROR: ${route} request failed: ${err.message}`);
    }
  }

  console.log('\n--- VERIFICATION SUMMARY ---');
  if (errors.length === 0) {
    console.log(`ALL ${routesToTest.length} ROUTES VERIFIED 100% SUCCESSFULLY WITH ALL NEW REQUIREMENTS!`);
  } else {
    console.error(`Found ${errors.length} errors:`);
    errors.forEach(e => console.error('  - ' + e));
    process.exit(1);
  }
}

run();
