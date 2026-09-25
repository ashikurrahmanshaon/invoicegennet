const fs = require('fs');
const path = require('path');
const http = require('http');

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

// Collect all links from all HTML files
const linksWithSource = [];

files.forEach(f => {
  const html = fs.readFileSync(f, 'utf8');
  const hrefMatches = [...html.matchAll(/href=["']([^"'#?]+)["']/g)];
  hrefMatches.forEach(m => {
    const link = m[1].trim();
    if (link.startsWith('/') && !link.startsWith('//')) {
      linksWithSource.push({ file: f, link });
    }
  });
});

const uniqueLinks = [...new Set(linksWithSource.map(item => item.link))];
console.log('Total unique internal links found:', uniqueLinks.length);

// Test each unique link against the running server
let completed = 0;
const results = {
  status200: [],
  status301: [],
  status302: [],
  status404: [],
  status500: []
};

uniqueLinks.forEach(link => {
  http.get('http://localhost:3000' + link, res => {
    const code = res.statusCode;
    const location = res.headers.location || '';
    if (code === 200) results.status200.push(link);
    else if (code === 301) results.status301.push({ link, location });
    else if (code === 302) results.status302.push({ link, location });
    else if (code === 404) results.status404.push(link);
    else results.status500.push({ link, code });

    completed++;
    if (completed === uniqueLinks.length) {
      printReport();
    }
  }).on('error', err => {
    results.status500.push({ link, error: err.message });
    completed++;
    if (completed === uniqueLinks.length) {
      printReport();
    }
  });
});

function printReport() {
  console.log('\n=== INTERNAL LINK AUDIT REPORT ===');
  console.log('200 OK (' + results.status200.length + ')');
  
  console.log('\n301 Redirects (' + results.status301.length + '):');
  results.status301.forEach(r => console.log('  ' + r.link + ' -> ' + r.location));

  console.log('\n302 Temporary Redirects (' + results.status302.length + '):');
  results.status302.forEach(r => console.log('  ' + r.link + ' -> ' + r.location));

  console.log('\n404 Not Found (' + results.status404.length + '):');
  results.status404.forEach(l => {
    const sources = linksWithSource.filter(s => s.link === l).map(s => s.file);
    console.log('  ' + l + ' (Found in: ' + sources.slice(0, 3).join(', ') + ')');
  });

  console.log('\n5xx Server Errors (' + results.status500.length + '):');
  results.status500.forEach(r => console.log('  ' + r.link + ' - ' + (r.code || r.error)));
}
