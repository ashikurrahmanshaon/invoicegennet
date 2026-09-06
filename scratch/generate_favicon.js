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
  // Fill all with transparent (0, 0, 0, 0)
  buf.fill(0, xorOffset, xorOffset + xorSize);

  function setPixel(x, yFromTop, b, g, r, a) {
    if (x < 0 || x >= width || yFromTop < 0 || yFromTop >= height) return;
    const yFromBottom = height - 1 - yFromTop;
    const pxOffset = xorOffset + (yFromBottom * width + x) * 4;
    buf[pxOffset] = b;     // Blue
    buf[pxOffset + 1] = g; // Green
    buf[pxOffset + 2] = r; // Red
    buf[pxOffset + 3] = a; // Alpha
  }

  // Draw Invoice Document Emblem
  // Document bounds: x: 6..25, y: 3..28
  for (let y = 3; y <= 28; y++) {
    for (let x = 6; x <= 25; x++) {
      // Rounded corner checks
      if ((x === 6 || x === 25) && (y === 28)) continue; // bottom corners
      if (x === 6 && y === 3) continue; // top-left corner

      // Top-right folded corner cut
      if (x >= 20 && y <= 9 && (x - 20) + y <= 9) {
        // Folded flap shadow/dark green (#047857 -> R:4, G:120, B:87)
        setPixel(x, y, 87, 120, 4, 255);
      } else {
        // Emerald body (#00c875 -> R:0, G:200, B:117)
        // Slight gradient top to bottom
        const gVal = Math.floor(208 - (y - 3) * 1.5);
        setPixel(x, y, 117, gVal, 0, 255);
      }
    }
  }

  // Draw 3 white horizontal document lines (#ffffff)
  // Line 1: y: 13..14, x: 10..18
  for (let x = 10; x <= 18; x++) {
    setPixel(x, 13, 255, 255, 255, 255);
    setPixel(x, 14, 255, 255, 255, 255);
  }
  // Line 2: y: 17..18, x: 10..21
  for (let x = 10; x <= 21; x++) {
    setPixel(x, 17, 255, 255, 255, 255);
    setPixel(x, 18, 255, 255, 255, 255);
  }
  // Line 3: y: 21..22, x: 10..16
  for (let x = 10; x <= 16; x++) {
    setPixel(x, 21, 255, 255, 255, 255);
    setPixel(x, 22, 255, 255, 255, 255);
  }

  // 5. AND Mask (1 bit per pixel, 0 = opaque/alpha handles it, all 0)
  const andOffset = xorOffset + xorSize;
  buf.fill(0, andOffset, andOffset + andSize);

  fs.writeFileSync(outputPath, buf);
  console.log(`Successfully generated valid favicon.ico (${buf.length} bytes) at ${outputPath}`);
}

generateFaviconIco(path.resolve(__dirname, '../favicon.ico'));
