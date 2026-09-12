const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Create a valid RGBA PNG from raw pixels
function createPng(width, height, getPixel) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdr = makeChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0
  const rowSize = width * 4;
  const rawData = Buffer.alloc(height * (rowSize + 1));

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(len + 12);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  // Calculate CRC32 over type + data
  const crcTarget = chunk.subarray(4, 8 + len);
  const crc = crc32(crcTarget);
  chunk.writeInt32BE(crc, 8 + len);

  return chunk;
}

// CRC32 implementation
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1);
}

// Pixel generator for BuildIQ Brand Icon (Dark Slate with Amber 'B' and border)
function getBuildIQPixel(x, y, w, h, isMaskable = false) {
  const normX = x / w;
  const normY = y / h;

  // Background: Deep Slate #0F172A
  let r = 15, g = 23, b = 42, a = 255;

  // Margin for maskable (safe zone 15%)
  const margin = isMaskable ? 0.15 : 0.08;
  const innerW = 1 - 2 * margin;
  const innerH = 1 - 2 * margin;

  if (normX >= margin && normX <= 1 - margin && normY >= margin && normY <= 1 - margin) {
    const rx = (normX - margin) / innerW;
    const ry = (normY - margin) / innerH;

    // Amber border
    const borderThickness = 0.02;
    if (rx < borderThickness || rx > 1 - borderThickness || ry < borderThickness || ry > 1 - borderThickness) {
      // Amber highlight #F59E0B
      return [245, 158, 11, 200];
    }

    // Monogram 'B':
    // Vertical stem: rx between 0.22 and 0.35, ry between 0.20 and 0.80
    if (rx >= 0.24 && rx <= 0.38 && ry >= 0.20 && ry <= 0.80) {
      return [245, 158, 11, 255]; // Amber #F59E0B
    }

    // Top loop: ry between 0.20 and 0.50, rx between 0.35 and 0.72
    const topCenterY = 0.35;
    const topCenterX = 0.38;
    const topDist = Math.hypot((rx - topCenterX) / 0.32, (ry - topCenterY) / 0.15);
    if (rx >= 0.35 && ry >= 0.20 && ry <= 0.50) {
      if (topDist <= 1.0) {
        if (topDist >= 0.45) {
          return [245, 158, 11, 255]; // Amber border
        }
      }
    }

    // Bottom loop: ry between 0.48 and 0.80, rx between 0.35 and 0.78
    const botCenterY = 0.64;
    const botCenterX = 0.38;
    const botDist = Math.hypot((rx - botCenterX) / 0.36, (ry - botCenterY) / 0.16);
    if (rx >= 0.35 && ry >= 0.48 && ry <= 0.80) {
      if (botDist <= 1.0) {
        if (botDist >= 0.45) {
          return [245, 158, 11, 255]; // Amber border
        }
      }
    }

    // Top and bottom horizontal caps
    if ((ry >= 0.20 && ry <= 0.28 && rx >= 0.30 && rx <= 0.55) ||
        (ry >= 0.46 && ry <= 0.54 && rx >= 0.30 && rx <= 0.55) ||
        (ry >= 0.72 && ry <= 0.80 && rx >= 0.30 && rx <= 0.55)) {
      return [245, 158, 11, 255];
    }
  }

  return [r, g, b, a];
}

const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate 192x192
console.log('Generating pwa-192x192.png...');
const png192 = createPng(192, 192, (x, y, w, h) => getBuildIQPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);

// Generate 512x512
console.log('Generating pwa-512x512.png...');
const png512 = createPng(512, 512, (x, y, w, h) => getBuildIQPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);

// Generate maskable 512x512
console.log('Generating pwa-maskable-512x512.png...');
const pngMaskable = createPng(512, 512, (x, y, w, h) => getBuildIQPixel(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pngMaskable);

// Generate apple-touch-icon 180x180
console.log('Generating apple-touch-icon.png...');
const pngApple = createPng(180, 180, (x, y, w, h) => getBuildIQPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngApple);

console.log('All PWA icons generated successfully!');
