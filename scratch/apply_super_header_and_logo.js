const fs = require('fs');
const path = require('path');

// 1. Write the New 44px Standalone Layered Emerald Ledger Logo
const newSvgLogo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48" fill="none">
  <defs>
    <!-- Background Shadow Card -->
    <linearGradient id="backSheet" x1="6" y1="4" x2="34" y2="40" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0F172A" stop-opacity="0.16" />
      <stop offset="100%" stop-color="#0F172A" stop-opacity="0.28" />
    </linearGradient>

    <!-- Foreground Luminous Emerald Gradient -->
    <linearGradient id="mainSheet" x1="11" y1="3" x2="41" y2="43" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#00F59B" />
      <stop offset="45%" stop-color="#00C472" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>

    <!-- Folded Corner Gradient -->
    <linearGradient id="flapGrad" x1="29" y1="3" x2="41" y2="15" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#E6FDF3" />
      <stop offset="100%" stop-color="#34D399" />
    </linearGradient>

    <!-- Drop Shadow -->
    <filter id="cardShadow" x="5" y="2" width="41" height="45" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="2.5" stdDeviation="2" flood-color="#043825" flood-opacity="0.26" />
    </filter>
  </defs>

  <!-- Back Layer: Dimensional Secondary Sheet -->
  <path d="M7 9C7 7.34315 8.34315 6 10 6H26L34 14V36C34 37.6569 32.6569 39 31 39H10C8.34315 39 7 37.6569 7 36V9Z" fill="url(#backSheet)" />

  <!-- Front Layer: Primary Emerald Invoice Sheet -->
  <g filter="url(#cardShadow)">
    <path d="M12 5C12 3.34315 13.3431 2 15 2H30L41 13V39C41 40.6569 39.6569 42 38 42H15C13.3431 42 12 40.6569 12 39V5Z" fill="url(#mainSheet)" />
    <!-- Folded Corner Flap -->
    <path d="M30 2V11C30 12.1046 30.8954 13 32 13H41L30 2Z" fill="url(#flapGrad)" />
  </g>

  <!-- Inside Document Details -->
  <!-- Top Meta / Status Bar -->
  <rect x="17" y="14" width="7" height="3" rx="1.5" fill="#FFFFFF" />
  
  <!-- Line Item Rows -->
  <rect x="17" y="20" width="16" height="2.5" rx="1.25" fill="#FFFFFF" fill-opacity="0.95" />
  <rect x="17" y="25" width="11" height="2.5" rx="1.25" fill="#FFFFFF" fill-opacity="0.8" />

  <!-- Verified Paid Seal / Checkmark Badge -->
  <circle cx="31.5" cy="33.5" r="5.5" fill="#FFFFFF" />
  <path d="M29 33.5L30.8 35.3L34.2 31.8" stroke="#047857" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;

fs.writeFileSync('assets/icons/logo.svg', newSvgLogo);
console.log('Updated: assets/icons/logo.svg');

// 2. Synthesize High-Resolution 32x32 Favicon matching the new design
function generateFaviconIco(outputPath) {
  const width = 32;
  const height = 32;
  const dibHeaderSize = 40;
  const xorSize = width * height * 4;
  const andRowSize = Math.ceil(width / 32) * 4;
  const andSize = andRowSize * height;
  const imageSize = dibHeaderSize + xorSize + andSize;
  const totalFileSize = 6 + 16 + imageSize;

  const buf = Buffer.alloc(totalFileSize);

  buf.writeUInt16LE(0, 0);
  buf.writeUInt16LE(1, 2);
  buf.writeUInt16LE(1, 4);

  buf.writeUInt8(width, 6);
  buf.writeUInt8(height, 7);
  buf.writeUInt8(0, 8);
  buf.writeUInt8(0, 9);
  buf.writeUInt16LE(1, 10);
  buf.writeUInt16LE(32, 12);
  buf.writeUInt32LE(imageSize, 14);
  buf.writeUInt32LE(22, 18);

  const dibOffset = 22;
  buf.writeUInt32LE(dibHeaderSize, dibOffset);
  buf.writeInt32LE(width, dibOffset + 4);
  buf.writeInt32LE(height * 2, dibOffset + 8);
  buf.writeUInt16LE(1, dibOffset + 12);
  buf.writeUInt16LE(32, dibOffset + 14);
  buf.writeUInt32LE(0, dibOffset + 16);
  buf.writeUInt32LE(xorSize, dibOffset + 20);
  buf.writeInt32LE(0, dibOffset + 24);
  buf.writeInt32LE(0, dibOffset + 28);
  buf.writeUInt32LE(0, dibOffset + 32);
  buf.writeUInt32LE(0, dibOffset + 36);

  const xorOffset = dibOffset + dibHeaderSize;
  buf.fill(0, xorOffset, xorOffset + xorSize);

  function setPixel(x, yFromTop, b, g, r, a) {
    if (x < 0 || x >= width || yFromTop < 0 || yFromTop >= height) return;
    const yFromBottom = height - 1 - yFromTop;
    const pxOffset = xorOffset + (yFromBottom * width + x) * 4;
    buf[pxOffset] = b;
    buf[pxOffset + 1] = g;
    buf[pxOffset + 2] = r;
    buf[pxOffset + 3] = a;
  }

  // Draw Back Slate Sheet (bounds: x: 4..21, y: 5..27)
  for (let y = 6; y <= 27; y++) {
    for (let x = 4; x <= 21; x++) {
      if (y === 27 && (x === 4 || x === 21)) continue;
      if (x === 4 && y === 6) continue;
      if (x >= 16 && y <= 11 && (x - 16) + (y - 6) <= 5) continue;
      setPixel(x, y, 70, 45, 30, 160); // subtle dark slate
    }
  }

  // Draw Front Emerald Sheet (bounds: x: 7..27, y: 3..28)
  for (let y = 3; y <= 28; y++) {
    for (let x = 7; x <= 27; x++) {
      // Rounded corners
      if (y === 28 && (x === 7 || x === 27)) continue;
      if (x === 7 && y === 3) continue;

      // Folded flap cut (top-right: x >= 20, y <= 10)
      if (x >= 20 && y <= 10 && (x - 19) + (y - 3) <= 7) {
        // Mint flap
        setPixel(x, y, 153, 211, 52, 255);
      } else {
        // Vibrant emerald gradient
        const progress = (y - 3) / 25;
        const rVal = Math.round(0 * (1 - progress) + 4 * progress);
        const gVal = Math.round(245 * (1 - progress) + 120 * progress);
        const bVal = Math.round(155 * (1 - progress) + 87 * progress);
        setPixel(x, y, bVal, gVal, rVal, 255);
      }
    }
  }

  // Draw Ledger Lines in Crisp White (#FFFFFF)
  // Top bar: y: 10..11, x: 11..16
  for (let x = 11; x <= 16; x++) {
    setPixel(x, 10, 255, 255, 255, 255);
    setPixel(x, 11, 255, 255, 255, 255);
  }

  // Line 1: y: 14..15, x: 11..22
  for (let x = 11; x <= 22; x++) {
    setPixel(x, 14, 255, 255, 255, 255);
    setPixel(x, 15, 255, 255, 255, 255);
  }

  // Line 2: y: 18..19, x: 11..18
  for (let x = 11; x <= 18; x++) {
    setPixel(x, 18, 255, 255, 255, 255);
    setPixel(x, 19, 255, 255, 255, 255);
  }

  // Draw Circular Verified Seal in bottom right (center at 21, 23, radius 4.5)
  for (let y = 19; y <= 27; y++) {
    for (let x = 17; x <= 25; x++) {
      const distSq = (x - 21) * (x - 21) + (y - 23) * (y - 23);
      if (distSq <= 18) {
        setPixel(x, y, 255, 255, 255, 255); // White circle badge
      }
    }
  }

  // Checkmark inside the seal (emerald #047857)
  setPixel(19, 23, 87, 120, 4, 255);
  setPixel(20, 24, 87, 120, 4, 255);
  setPixel(21, 25, 87, 120, 4, 255);
  setPixel(22, 24, 87, 120, 4, 255);
  setPixel(23, 23, 87, 120, 4, 255);
  setPixel(24, 22, 87, 120, 4, 255);

  const andOffset = xorOffset + xorSize;
  buf.fill(0, andOffset, andOffset + andSize);

  fs.writeFileSync(outputPath, buf);
  console.log(`Generated: ${outputPath} (${buf.length} bytes)`);
}

generateFaviconIco('favicon.ico');
generateFaviconIco('assets/icons/favicon.ico');

// 3. Update width="38" height="38" to width="44" height="44" across all 25 HTML files
const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html'));
htmlFiles.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes('width="38" height="38"')) {
    content = content.replaceAll('width="38" height="38"', 'width="44" height="44"');
    fs.writeFileSync(f, content, 'utf8');
    console.log(`Updated 44px logo in: ${f}`);
  }
});

console.log('Logo update and HTML batch complete!');
