/**
 * Fundly icon generator.
 *
 * Writes the PWA icon set with zero dependencies: the PNGs are rasterised
 * here from signed-distance functions and encoded straight to bytes with
 * `node:zlib`. Run with `npm run generate:icons`.
 *
 * The mark is a Naira sign (₦) drawn from stroked capsules — a left stem, a
 * right stem, the diagonal between them, and the two crossbars — on the
 * brand forest gradient.
 */

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/* -------------------------------------------------------------------------- */
/*  PNG encoding                                                              */
/* -------------------------------------------------------------------------- */

const crcTable = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let crc = -1;
  for (let i = 0; i < buffer.length; i += 1) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buffer[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

/** Encodes RGBA pixels (length = size * size * 4) as an 8-bit RGBA PNG. */
function encodePNG(pixels, size) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // colour type: RGBA
  header[10] = 0; // deflate
  header[11] = 0; // adaptive filtering
  header[12] = 0; // no interlace

  // One filter byte (0 = none) per scanline.
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0;
    pixels.copy(raw, rowStart + 1, y * size * 4, (y + 1) * size * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* -------------------------------------------------------------------------- */
/*  Rasteriser                                                                */
/* -------------------------------------------------------------------------- */

/** Signed distance to a rounded box centred on the origin. */
function sdRoundedBox(px, py, halfW, halfH, radius) {
  const qx = Math.abs(px) - halfW + radius;
  const qy = Math.abs(py) - halfH + radius;
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
  return outside + Math.min(Math.max(qx, qy), 0) - radius;
}

/** Signed distance to a capsule (thick line segment with round caps). */
function sdCapsule(px, py, ax, ay, bx, by, radius) {
  const pax = px - ax;
  const pay = py - ay;
  const bax = bx - ax;
  const bay = by - ay;
  const h = Math.min(
    1,
    Math.max(0, (pax * bax + pay * bay) / (bax * bax + bay * bay)),
  );
  return Math.hypot(pax - bax * h, pay - bay * h) - radius;
}

const FOREST_TOP = [0x27, 0x65, 0x4f]; // forest-600
const FOREST_BOTTOM = [0x12, 0x33, 0x29]; // forest-900
const CREAM = [0xfd, 0xfa, 0xf4]; // cream-100

/** Coverage from a signed distance, in pixels, with a 1px soft edge. */
function coverage(distance) {
  return Math.min(1, Math.max(0, 0.5 - distance));
}

function mix(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

/* The ₦ mark, in a unit square centred on the origin. */
const STROKE = 0.155;
const SEGMENTS = [
  [-0.42, -0.74, -0.42, 0.74], // left stem
  [0.42, -0.74, 0.42, 0.74], // right stem
  [-0.42, 0.74, 0.42, -0.74], // diagonal
  [-0.72, 0.3, 0.72, 0.3], // upper crossbar
  [-0.72, -0.3, 0.72, -0.3], // lower crossbar
];

/**
 * Renders one icon.
 *
 * @param {number} size          edge length in pixels
 * @param {number} cornerRadius  background radius as a fraction of size
 * @param {number} markScale     mark size as a fraction of size
 * @param {boolean} opaque       fill the full square (no transparent corners)
 */
function renderIcon(size, cornerRadius, markScale, opaque) {
  const pixels = Buffer.alloc(size * size * 4);
  const half = size / 2;
  const boxHalf = opaque ? half + cornerRadius : half;
  const radius = cornerRadius * size;
  const markHalf = (markScale * size) / 2;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      // Pixel centre, in icon space.
      const px = x + 0.5 - half;
      const py = y + 0.5 - half;

      const bgDistance = sdRoundedBox(px, py, boxHalf, boxHalf, radius);
      const bgAlpha = coverage(bgDistance);

      // Vertical brand gradient inside the rounded square.
      const t = Math.min(1, Math.max(0, (y + 0.5) / size));
      let [r, g, b] = mix(FOREST_TOP, FOREST_BOTTOM, t);

      // Punch the ₦ mark out of the gradient.
      let markDistance = Infinity;
      for (const [ax, ay, bx, by] of SEGMENTS) {
        markDistance = Math.min(
          markDistance,
          sdCapsule(px / markHalf, py / markHalf, ax, ay, bx, by, STROKE) *
            markHalf,
        );
      }
      const markAlpha = coverage(markDistance);
      if (markAlpha > 0) {
        [r, g, b] = mix([r, g, b], CREAM, markAlpha);
      }

      const offset = (y * size + x) * 4;
      pixels[offset] = r;
      pixels[offset + 1] = g;
      pixels[offset + 2] = b;
      pixels[offset + 3] = Math.round(bgAlpha * 255);
    }
  }

  return encodePNG(pixels, size);
}

/* -------------------------------------------------------------------------- */
/*  Output                                                                    */
/* -------------------------------------------------------------------------- */

const ROUNDED = { radius: 0.22, mark: 0.56, opaque: false };
const SQUARE = { radius: 0.5, mark: 0.5, opaque: true };

const targets = [
  // PWA icons — rounded corners so they read as an app on the home screen.
  { file: "public/icons/icon-192.png", size: 192, ...ROUNDED },
  { file: "public/icons/icon-512.png", size: 512, ...ROUNDED },
  // Maskable — full bleed, mark inside the 80% safe zone.
  { file: "public/icons/maskable-512.png", size: 512, radius: 0.5, mark: 0.42, opaque: true },
  // Apple ignores alpha, so these must be solid squares.
  { file: "public/icons/apple-touch-icon.png", size: 180, ...SQUARE },
  { file: "app/icon.png", size: 512, ...ROUNDED },
  { file: "app/apple-icon.png", size: 180, ...SQUARE },
];

for (const target of targets) {
  const destination = join(root, target.file);
  mkdirSync(dirname(destination), { recursive: true });
  const png = renderIcon(target.size, target.radius, target.mark, target.opaque);
  writeFileSync(destination, png);
  console.log(
    `ok  ${target.file}  ${target.size}x${target.size}  ${(png.length / 1024).toFixed(1)} kB`,
  );
}

console.log(`\nGenerated ${targets.length} icons.`);