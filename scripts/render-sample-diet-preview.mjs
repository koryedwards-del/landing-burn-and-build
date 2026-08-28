#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SAMPLE_DIET_DOWNLOAD_URL } from '../js/siteUrls.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const deliverable = path.join(root, 'docs/samples/b&bsamplediet.pdf');

if (!fs.existsSync(deliverable)) {
  console.error(`Missing ${deliverable}`);
  console.error('Add the approved sample PDF, then commit and push to main.');
  process.exit(1);
}

const stat = fs.statSync(deliverable);
console.log(`OK ${deliverable} (${stat.size} bytes)`);
console.log(`DOWNLOAD ${SAMPLE_DIET_DOWNLOAD_URL}`);
console.log(`CURL curl -L -o ~/Downloads/b\\&bsamplediet.pdf "${SAMPLE_DIET_DOWNLOAD_URL}"`);
