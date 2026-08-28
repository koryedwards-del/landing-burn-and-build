#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildSampleDietPreviewPayload } from '../js/sampleDietPrintoutData.js';
import { renderSampleDietPrintout } from '../server/pdf/renderSampleDietPrintout.js';
import { SAMPLE_DIET_DOWNLOAD_URL } from '../js/siteUrls.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const deliverable = path.join(root, 'docs/samples/b&bsamplediet.pdf');

const payload = buildSampleDietPreviewPayload();
const pdf = await renderSampleDietPrintout(payload, { title: 'B&B Sample Diet' });
fs.mkdirSync(path.dirname(deliverable), { recursive: true });
fs.writeFileSync(deliverable, pdf);

const stat = fs.statSync(deliverable);
console.log(`OK ${deliverable} (${stat.size} bytes)`);
console.log(`DOWNLOAD ${SAMPLE_DIET_DOWNLOAD_URL}`);
console.log(`CURL curl -L -o ~/Downloads/b\\&bsamplediet.pdf "${SAMPLE_DIET_DOWNLOAD_URL}"`);
