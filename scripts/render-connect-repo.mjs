#!/usr/bin/env node
/**
 * Point Render program-creator at this repo (landing-burn-and-build).
 *
 * Usage:
 *   RENDER_API_KEY=rnd_... node scripts/render-connect-repo.mjs
 *
 * Get an API key: Render Dashboard → Account Settings → API Keys
 * https://dashboard.render.com/u/settings#api-keys
 */

const REPO = 'https://github.com/koryedwards-del/landing-burn-and-build';
const BRANCH = 'main';
const SERVICE_NAME = 'program-creator';

async function renderFetch(path, options = {}) {
  const key = process.env.RENDER_API_KEY?.trim();
  if (!key) {
    throw new Error('Set RENDER_API_KEY (Render Dashboard → Account Settings → API Keys).');
  }

  const res = await fetch(`https://api.render.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!res.ok) {
    throw new Error(`Render API ${res.status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  }
  return body;
}

async function findServiceId() {
  const configured = process.env.RENDER_SERVICE_ID?.trim();
  if (configured) return configured;

  let cursor;
  do {
    const qs = new URLSearchParams({ limit: '100', name: SERVICE_NAME });
    if (cursor) qs.set('cursor', cursor);
    const page = await renderFetch(`/services?${qs}`);
    const match = (page || []).find((row) => row?.service?.name === SERVICE_NAME);
    if (match?.service?.id) return match.service.id;
    cursor = page?.length === 100 ? page[page.length - 1]?.cursor : null;
  } while (cursor);

  throw new Error(`Service "${SERVICE_NAME}" not found. Set RENDER_SERVICE_ID manually.`);
}

async function main() {
  const serviceId = await findServiceId();
  console.log(`Found ${SERVICE_NAME}: ${serviceId}`);

  const updated = await renderFetch(`/services/${serviceId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      repo: REPO,
      branch: BRANCH,
      autoDeploy: 'yes',
    }),
  });

  const service = updated?.service || updated;
  console.log('Connected repository:');
  console.log(`  repo:   ${service.repo}`);
  console.log(`  branch: ${service.branch}`);
  console.log(`  url:    ${service.serviceDetails?.url || service.slug}`);

  const deploy = await renderFetch(`/services/${serviceId}/deploys`, {
    method: 'POST',
    body: JSON.stringify({ clearCache: 'do_not_clear' }),
  });
  const deployId = deploy?.deploy?.id || deploy?.id;
  console.log(`Triggered deploy: ${deployId || '(see Render dashboard)'}`);
  console.log('\nSmoke test when live: curl https://program-creator-3tzd.onrender.com/health');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
