#!/usr/bin/env node
/**
 * Regenerate root PWA / favicon PNGs + favicon.ico from img/brand/hardkor-logo-2026.png.
 * Opaque #0A0A0A square canvas, logo scaled to max size with squircle safe inset (~5%).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import toIco from 'to-ico';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(root, 'img/brand/hardkor-logo-2026.png');
const BG = { r: 10, g: 10, b: 10, alpha: 1 };
const ALPHA_THRESHOLD = 10;
/** Fraction of canvas edge reserved so macOS squircle mask does not clip tagline/rocks */
const SAFE_INSET = 0.05;

function boundsFromAlpha(data, width, height, channels) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const a = channels === 4 ? data[i + 3] : 255;
      if (a > ALPHA_THRESHOLD) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

async function renderSquare(size) {
  const meta = await sharp(SOURCE).metadata();
  const { data, info } = await sharp(SOURCE)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const b = boundsFromAlpha(data, info.width, info.height, info.channels);
  if (!b) throw new Error('No opaque artwork found in source PNG');

  const cropped = await sharp(SOURCE)
    .ensureAlpha()
    .extract({ left: b.x, top: b.y, width: b.w, height: b.h })
    .png()
    .toBuffer();

  const insetPx = Math.round(size * SAFE_INSET);
  const inner = size - insetPx * 2;
  const scale = Math.min(inner / b.w, inner / b.h);
  const targetW = Math.round(b.w * scale);
  const targetH = Math.round(b.h * scale);
  const left = Math.round((size - targetW) / 2);
  const top = Math.round((size - targetH) / 2);

  const logoLayer = await sharp(cropped)
    .resize(targetW, targetH, { fit: 'fill' })
    .png()
    .toBuffer();

  const canvas = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BG,
    },
  })
    .composite([{ input: logoLayer, left, top }])
    .png()
    .toBuffer();

  return { buffer: canvas, artBounds: { x: left, y: top, w: targetW, h: targetH }, sourceBounds: b };
}

async function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error(`Missing source: ${SOURCE}`);
    process.exit(1);
  }

  const outputs = [
    { file: 'android-chrome-512x512.png', size: 512 },
    { file: 'android-chrome-192x192.png', size: 192 },
    { file: 'apple-touch-icon.png', size: 180 },
    { file: 'favicon-32x32.png', size: 32 },
    { file: 'favicon-16x16.png', size: 16 },
  ];

  let stats512;
  for (const { file, size } of outputs) {
    const { buffer, artBounds, sourceBounds } = await renderSquare(size);
    const outPath = path.join(root, file);
    fs.writeFileSync(outPath, buffer);
    if (size === 512) stats512 = { artBounds, sourceBounds };
    console.log(`Wrote ${file} (${size}×${size})`);
  }

  const buf16 = fs.readFileSync(path.join(root, 'favicon-16x16.png'));
  const buf32 = fs.readFileSync(path.join(root, 'favicon-32x32.png'));
  fs.writeFileSync(path.join(root, 'favicon.ico'), await toIco([buf16, buf32]));
  console.log('Wrote favicon.ico');

  const { artBounds } = stats512;
  const fillPctW = ((artBounds.w / 512) * 100).toFixed(1);
  const fillPctH = ((artBounds.h / 512) * 100).toFixed(1);
  console.log(
    `512 artwork bounds (on canvas): x=${artBounds.x} y=${artBounds.y} w=${artBounds.w} h=${artBounds.h}`,
  );
  console.log(`512 content fill: ${fillPctW}% × ${fillPctH}% of canvas`);
  console.log(`Source alpha bounds: x=${stats512.sourceBounds.x} y=${stats512.sourceBounds.y} w=${stats512.sourceBounds.w} h=${stats512.sourceBounds.h}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
