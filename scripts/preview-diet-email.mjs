#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildDietEmailPreview } from '../server/dietEmail.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const deliverable = path.join(root, 'previews/diet-email/index.html');
const siteOrigin = String(
  process.env.WEBPAGE_URL || process.env.CREATOR_BASE_URL || 'https://burnandbuilddiet.com',
).replace(/\/$/, '');
const renderOrigin = String(
  process.env.DIET_PDF_DOWNLOAD_ORIGIN || 'https://program-creator-3tzd.onrender.com',
).replace(/\/$/, '');

const preview = buildDietEmailPreview();
fs.mkdirSync(path.dirname(deliverable), { recursive: true });
fs.writeFileSync(deliverable, preview.html);

const stat = fs.statSync(deliverable);
console.log(`OK ${deliverable} (${stat.size} bytes)`);
console.log(`SUBJECT ${preview.subject}`);
console.log(`SITE ${siteOrigin}/previews/diet-email/`);
console.log(`API ${renderOrigin}/api/samples/diet-email-preview`);
