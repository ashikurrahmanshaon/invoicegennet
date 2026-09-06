const fs = require('fs');

const seoPages = [
  'free-invoice-generator.html',
  'pdf-invoice-generator.html',
  'invoice-generator-for-freelancers.html',
  'how-to-make-an-invoice.html',
  'best-invoice-generator.html',
  'gst-invoice-generator.html',
  'invoice-number-generator.html'
];

seoPages.forEach(p => {
  const content = fs.readFileSync(p, 'utf8');
  const headings = [...content.matchAll(/<div class="seo-feature-card">[\s\S]*?<h4>(.*?)<\/h4>/g)].map(m => m[1]);
  console.log(p, headings);
});
