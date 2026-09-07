const fs = require('fs');
const path = require('path');

function generateFaviconIco(outputPath) {
  const width = 32;
  const height = 32;
  const dibHeaderSize = 40;
  const xorSize = width * height * 4; // 4096 bytes
  const andRowSize = Math.ceil(width / 32) * 4; // 4 bytes per row
  const andSize = andRowSize * height; // 128 bytes
  const imageSize = dibHeaderSize + xorSize + andSize; // 4264 bytes
  const totalFileSize = 6 + 16 + imageSize; // 4286 bytes

  const buf = Buffer.alloc(totalFileSize);

  // 1. ICONDIR (6 bytes)
  buf.writeUInt16LE(0, 0); // Reserved
  buf.writeUInt16LE(1, 2); // Type 1 = Icon
  buf.writeUInt16LE(1, 4); // Count = 1 image

  // 2. ICONDIRENTRY (16 bytes)
  buf.writeUInt8(width, 6);        // Width (32)
  buf.writeUInt8(height, 7);       // Height (32)
  buf.writeUInt8(0, 8);            // Colors in palette (0 = >=256)
  buf.writeUInt8(0, 9);            // Reserved
  buf.writeUInt16LE(1, 10);        // Color planes (1)
  buf.writeUInt16LE(32, 12);       // Bits per pixel (32)
  buf.writeUInt32LE(imageSize, 14); // Image size in bytes
  buf.writeUInt32LE(22, 18);       // Offset of image data (22)

  // 3. BITMAPINFOHEADER (40 bytes at offset 22)
  const dibOffset = 22;
  buf.writeUInt32LE(dibHeaderSize, dibOffset);      // biSize (40)
  buf.writeInt32LE(width, dibOffset + 4);           // biWidth (32)
  buf.writeInt32LE(height * 2, dibOffset + 8);      // biHeight (64, XOR + AND)
  buf.writeUInt16LE(1, dibOffset + 12);             // biPlanes (1)
  buf.writeUInt16LE(32, dibOffset + 14);            // biBitCount (32)
  buf.writeUInt32LE(0, dibOffset + 16);             // biCompression (BI_RGB = 0)
  buf.writeUInt32LE(xorSize, dibOffset + 20);       // biSizeImage
  buf.writeInt32LE(0, dibOffset + 24);              // biXPelsPerMeter
  buf.writeInt32LE(0, dibOffset + 28);              // biYPelsPerMeter
  buf.writeUInt32LE(0, dibOffset + 32);             // biClrUsed
  buf.writeUInt32LE(0, dibOffset + 36);             // biClrImportant

  // 4. XOR Mask (32-bit BGRA, bottom-up: row 0 is bottom, row 31 is top)
  const xorOffset = dibOffset + dibHeaderSize; // 62
  buf.fill(0, xorOffset, xorOffset + xorSize);

  function setPixel(x, yFromTop, b, g, r, a = 255) {
    if (x < 0 || x >= width || yFromTop < 0 || yFromTop >= height) return;
    const yFromBottom = height - 1 - yFromTop;
    const pxOffset = xorOffset + (yFromBottom * width + x) * 4;
    buf[pxOffset] = b;     // Blue
    buf[pxOffset + 1] = g; // Green
    buf[pxOffset + 2] = r; // Red
    buf[pxOffset + 3] = a; // Alpha
  }

  // 1. Draw Emerald Squircle Token (x: 1..30, y: 1..30, corner radius ~6px)
  for (let y = 1; y <= 30; y++) {
    for (let x = 1; x <= 30; x++) {
      // Corner cuts for rounded squircle (r = 6)
      const inTopLeft = (x <= 5 && y <= 5 && (5 - x) * (5 - x) + (5 - y) * (5 - y) > 25);
      const inTopRight = (x >= 26 && y <= 5 && (x - 26) * (x - 26) + (5 - y) * (5 - y) > 25);
      const inBottomLeft = (x <= 5 && y >= 26 && (5 - x) * (5 - x) + (y - 26) * (y - 26) > 25);
      const inBottomRight = (x >= 26 && y >= 26 && (x - 26) * (x - 26) + (y - 26) * (y - 26) > 25);

      if (inTopLeft || inTopRight || inBottomLeft || inBottomRight) continue;

      // Diagonal gradient: #047857 (top-left) to #00C875 (middle) to #00F59B (bottom-right)
      const diag = (x + y) / 60;
      const r = Math.round(4 + diag * (0 - 4));
      const g = Math.round(120 + diag * (245 - 120));
      const b = Math.round(87 + diag * (155 - 87));
      setPixel(x, y, b, g, r, 255);
    }
  }

  // 2. Draw Crisp White Invoice Paper (x: 8..23, y: 6..26)
  for (let y = 6; y <= 26; y++) {
    for (let x = 8; x <= 23; x++) {
      // Rounded bottom corners & top-left
      if ((x === 8 || x === 23) && y === 26) continue;
      if (x === 8 && y === 6) continue;

      // Top-right folded corner (x >= 18, y <= 11)
      if (x >= 18 && y <= 11 && (x - 17) + (y - 6) <= 5) {
        // Folded flap color (Mint Green #34D399 -> B:153, G:211, R:52)
        setPixel(x, y, 153, 211, 52, 255);
      } else {
        // Pure crisp white document body
        setPixel(x, y, 255, 255, 255, 255);
      }
    }
  }

  // 3. Document Ledger Lines
  // Line 1 (Dark Header line): y: 13..14, x: 11..19 (#0F172A -> B:42, G:23, R:15)
  for (let x = 11; x <= 19; x++) {
    setPixel(x, 13, 42, 23, 15, 255);
    setPixel(x, 14, 42, 23, 15, 255);
  }
  // Line 2 (Slate body line): y: 17..18, x: 11..17 (#94A3B8 -> B:184, G:163, R:148)
  for (let x = 11; x <= 17; x++) {
    setPixel(x, 17, 184, 163, 148, 255);
    setPixel(x, 18, 184, 163, 148, 255);
  }
  // Line 3 (Emerald total line): y: 21..22, x: 11..15 (#00C875 -> B:117, G:200, R:0)
  for (let x = 11; x <= 15; x++) {
    setPixel(x, 21, 117, 200, 0, 255);
    setPixel(x, 22, 117, 200, 0, 255);
  }

  // 4. Golden Sparkle / Badge at bottom right of document
  // Dark emerald badge ring at (22, 23)
  const sparkPoints = [
    [22, 21], [22, 25], [20, 23], [24, 23],
    [21, 22], [23, 22], [21, 24], [23, 24],
    [22, 23]
  ];
  // Gold color (#FDE047 -> B:71, G:224, R:253)
  sparkPoints.forEach(([sx, sy]) => {
    setPixel(sx, sy, 71, 224, 253, 255);
  });
  // Center brightest gold
  setPixel(22, 23, 255, 255, 255, 255);

  // 5. AND Mask (1 bit per pixel, 0 = opaque/alpha handles it, all 0)
  const andOffset = xorOffset + xorSize;
  buf.fill(0, andOffset, andOffset + andSize);

  fs.writeFileSync(outputPath, buf);
  console.log(`Successfully generated favicon.ico (${buf.length} bytes) at ${outputPath}`);
}

generateFaviconIco(path.resolve(__dirname, '../favicon.ico'));
generateFaviconIco(path.resolve(__dirname, '../assets/icons/favicon.ico'));
