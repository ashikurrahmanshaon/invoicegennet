const fs = require('fs');
const path = require('path');

// 1. Premium Vector SVG (assets/icons/logo.svg)
const newSvgLogo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48" fill="none">
  <defs>
    <!-- Vibrant FinTech Emerald Gradient -->
    <linearGradient id="emSquircle" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#00E887" />
      <stop offset="45%" stop-color="#00C06F" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>

    <!-- Subtle Top Rim Highlight -->
    <linearGradient id="rimGrad" x1="4" y1="4" x2="44" y2="24" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.45" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.08" />
    </linearGradient>

    <!-- Floating Document Depth Gradient -->
    <linearGradient id="docGrad" x1="13" y1="8" x2="35" y2="40" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#F8FAFC" />
    </linearGradient>

    <!-- Folded Corner Depth -->
    <linearGradient id="foldGrad" x1="26" y1="8" x2="35" y2="17" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#E2E8F0" />
      <stop offset="100%" stop-color="#CBD5E1" />
    </linearGradient>

    <!-- Crisp Soft Drop Shadow on Document -->
    <filter id="docShadow" x="9" y="6" width="30" height="36" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#022C1B" flood-opacity="0.28" />
    </filter>
  </defs>

  <!-- Base Rounded Squircle (rx=11) -->
  <rect x="3" y="3" width="42" height="42" rx="11" fill="url(#emSquircle)" />
  <rect x="3.5" y="3.5" width="41" height="41" rx="10.5" stroke="url(#rimGrad)" stroke-width="1" />

  <!-- Floating Pristine Invoice Sheet -->
  <g filter="url(#docShadow)">
    <path d="M13 11C13 9.34315 14.3431 8 16 8H26L35 17V37C35 38.6569 33.6569 40 32 40H16C14.3431 40 13 38.6569 13 37V11Z" fill="url(#docGrad)" />
    <!-- Folded Corner Flap -->
    <path d="M26 8V14.5C26 15.8807 27.1193 17 28.5 17H35L26 8Z" fill="url(#foldGrad)" />
  </g>

  <!-- Modern Financial Ledger Elements (High-contrast, razor-sharp) -->
  <!-- Header Accent Pill (Emerald) -->
  <rect x="17.5" y="13.5" width="6" height="2.5" rx="1.25" fill="#00B86B" />

  <!-- Ledger Rows (Slate 700 & Slate 400) -->
  <rect x="17.5" y="19.5" width="13" height="2.2" rx="1.1" fill="#334155" />
  <rect x="17.5" y="24" width="8.5" height="2.2" rx="1.1" fill="#64748B" />
  <rect x="17.5" y="28.5" width="11" height="2.2" rx="1.1" fill="#94A3B8" />

  <!-- Verified Total Badge / Summary Row (Bold Obsidian Slate) -->
  <rect x="17.5" y="33.5" width="13" height="2.5" rx="1.25" fill="#0F172A" />
</svg>`;

// 2. Synthesize High-Precision 32x32 RGBA Favicon ICO
function generateFaviconIco(outputPath) {
  const width = 32;
  const height = 32;
  const dibHeaderSize = 40;
  const xorSize = width * height * 4; // 4096 bytes
  const andRowSize = Math.ceil(width / 32) * 4; // 4 bytes
  const andSize = andRowSize * height; // 128 bytes
  const imageSize = dibHeaderSize + xorSize + andSize; // 4264 bytes
  const totalFileSize = 6 + 16 + imageSize; // 4286 bytes

  const buf = Buffer.alloc(totalFileSize);

  // 1. ICONDIR
  buf.writeUInt16LE(0, 0); // Reserved
  buf.writeUInt16LE(1, 2); // Type 1 = Icon
  buf.writeUInt16LE(1, 4); // Count = 1

  // 2. ICONDIRENTRY
  buf.writeUInt8(width, 6);
  buf.writeUInt8(height, 7);
  buf.writeUInt8(0, 8);
  buf.writeUInt8(0, 9);
  buf.writeUInt16LE(1, 10);
  buf.writeUInt16LE(32, 12);
  buf.writeUInt32LE(imageSize, 14);
  buf.writeUInt32LE(22, 18);

  // 3. BITMAPINFOHEADER
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

  // 4. XOR Mask
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

  // Draw Vibrant Emerald Squircle (bounds x: 1..30, y: 1..30, radius: 7px)
  for (let y = 1; y <= 30; y++) {
    for (let x = 1; x <= 30; x++) {
      // Rounded corner distance calculation (center at 8,8 or 23,8 etc)
      const cx = x < 8 ? 8 : (x > 23 ? 23 : x);
      const cy = y < 8 ? 8 : (y > 23 ? 23 : y);
      const distSq = (x - cx) * (x - cx) + (y - cy) * (y - cy);
      if (distSq > 49) continue; // outside 7px radius

      // Rich emerald gradient: top-left #00E887 to bottom-right #047857
      const progress = (x + y - 2) / 58;
      const rVal = Math.round(0 * (1 - progress) + 4 * progress);
      const gVal = Math.round(232 * (1 - progress) + 120 * progress);
      const bVal = Math.round(135 * (1 - progress) + 87 * progress);

      // Top rim highlight for x=1..30 and y=1..3
      if (y === 1 || (y <= 3 && (x <= 4 || x >= 27))) {
        setPixel(x, y, Math.min(255, bVal + 50), Math.min(255, gVal + 25), Math.min(255, rVal + 60), 255);
      } else {
        setPixel(x, y, bVal, gVal, rVal, 255);
      }
    }
  }

  // Draw Crisp White Invoice Sheet inside (bounds x: 8..23, y: 5..26, radius: 3)
  for (let y = 5; y <= 26; y++) {
    for (let x = 8; x <= 23; x++) {
      // Bottom rounded corners
      if (y >= 25 && ((x === 8 && y === 26) || (x === 23 && y === 26))) continue;
      // Top left rounded corner
      if (x === 8 && y === 5) continue;

      // Folded corner cut (top right: x >= 18, y <= 10, (x - 18) + (y - 5) <= 5)
      if (x >= 18 && y <= 10 && (x - 17) + (y - 5) <= 5) {
        // Folded flap (soft slate gray #CBD5E1)
        setPixel(x, y, 225, 213, 203, 255);
      } else {
        // Crisp White Document Body (#FFFFFF)
        setPixel(x, y, 255, 255, 255, 255);
      }
    }
  }

  // Draw Ledger Lines (Ultra-crisp, high-contrast)
  // Top Accent Dot (Emerald #00C875)
  setPixel(11, 8, 117, 200, 0, 255);
  setPixel(12, 8, 117, 200, 0, 255);
  setPixel(13, 8, 117, 200, 0, 255);

  // Line 1: Main item (Dark Slate #334155) - y: 12..13, x: 11..20
  for (let x = 11; x <= 20; x++) {
    setPixel(x, 12, 85, 65, 51, 255);
    setPixel(x, 13, 85, 65, 51, 255);
  }

  // Line 2: Sub-item (Medium Slate #64748B) - y: 16..17, x: 11..16
  for (let x = 11; x <= 16; x++) {
    setPixel(x, 16, 139, 116, 100, 255);
    setPixel(x, 17, 139, 116, 100, 255);
  }

  // Line 3: Total Row (Bold Obsidian #0F172A) - y: 20..21, x: 11..20
  for (let x = 11; x <= 20; x++) {
    setPixel(x, 21, 42, 23, 15, 255);
    setPixel(x, 22, 42, 23, 15, 255);
  }

  // 5. AND Mask
  const andOffset = xorOffset + xorSize;
  buf.fill(0, andOffset, andOffset + andSize);

  fs.writeFileSync(outputPath, buf);
  console.log(`Generated: ${outputPath} (${buf.length} bytes)`);
}

// Write Files
fs.writeFileSync('assets/icons/logo.svg', newSvgLogo);
console.log('Updated: assets/icons/logo.svg');

generateFaviconIco('favicon.ico');
generateFaviconIco('assets/icons/favicon.ico');

console.log('Brand asset generation complete!');
