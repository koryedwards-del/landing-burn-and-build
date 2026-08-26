#!/usr/bin/env node
/** Launch readiness smoke — gate status, local checks, production health. */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { DIET_CREATION_COMING_SOON } from '../js/siteUrls.js';

const API_HEALTH = process.env.BNB_API_HEALTH_URL
  || 'https://program-creator-3tzd.onrender.com/health';

function localCommit() {
  return readFileSync('.git/HEAD', 'utf8').includes('ref:')
    ? execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
    : readFileSync('.git/HEAD', 'utf8').trim();
}

console.log(`Gate: DIET_CREATION_COMING_SOON = ${DIET_CREATION_COMING_SOON}`);
if (DIET_CREATION_COMING_SOON) {
  console.log('  Public questionnaire blocked — purchasers use /createyourfoodplan/');
} else {
  console.log('  Public questionnaire open — landing CTAs route to /questionnaire/');
}

execSync('npm run verify:server', { stdio: 'inherit' });
execSync('npm run verify:pdf', { stdio: 'inherit' });

let health;
try {
  const res = await fetch(API_HEALTH, { signal: AbortSignal.timeout(15000) });
  health = await res.json();
  if (!res.ok || !health.ok) {
    throw new Error(health.message || `HTTP ${res.status}`);
  }
} catch (err) {
  console.error(`Production health check failed (${API_HEALTH}):`, err.message);
  process.exit(1);
}

const local = localCommit().slice(0, 7);
const remote = String(health.commit || '').slice(0, 7);
console.log(`Production: stripe=${health.stripe} dietEmail=${health.dietEmail} pdf=${health.pdf}`);
console.log(`Commit: local ${local} · production ${remote || 'unknown'}`);

if (remote && local !== remote) {
  console.warn('  Note: local HEAD differs from Render deploy — push to main or wait for deploy.');
}

console.log('\nLaunch readiness checks passed.');
