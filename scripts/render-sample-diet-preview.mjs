#!/usr/bin/env node
/** Public sample diet is live-rendered on Render — not a committed static PDF. */
import { SAMPLE_DIET_DOWNLOAD_URL } from '../js/siteUrls.js';

console.log('The landing-page sample diet is no longer a static file in docs/samples/.');
console.log('');
console.log('After questionnaire + Stripe, point Render at that program:');
console.log('  POST /api/admin/public-sample-diet');
console.log('  Header: x-contacts-admin-key: <CONTACTS_ADMIN_KEY>');
console.log('  Body: { "email": "...", "programId": "..." }');
console.log('');
console.log('Or set env vars on Render: SAMPLE_DIET_EMAIL, SAMPLE_DIET_PROGRAM_ID');
console.log('');
console.log(`DOWNLOAD ${SAMPLE_DIET_DOWNLOAD_URL}`);
console.log(`CURL curl -L -o ~/Downloads/b\\&bsamplediet.pdf "${SAMPLE_DIET_DOWNLOAD_URL}"`);
