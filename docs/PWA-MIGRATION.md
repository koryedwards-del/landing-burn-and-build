# PWA repo migration notes

Comparison done 2026-07-19 between `pwa-burn-and-build` (archived) and this repo.

## What was already here (no copy needed)

The static creator flow was already migrated to this repo. These paths are functionally the same as PWA (landing has newer marketing copy and `?v=63` asset stamps):

- `questionnaire/`, `createyourfoodplan/`, `program-report/`, `menuplanner/`
- `css/`, `js/`, `data/foods.json`, `contacts/`
- `support.html`, `privacypolicy.html`, `index.html`

Application code already uses **burnandbuilddiet.com** only (`js/siteUrls.js`). No runtime dependency on `gettheburnandbuildapp.com`.

## What we copied from PWA (this PR)

| Path | Why |
|------|-----|
| `server/` | Express API — programs, Stripe, contacts |
| `package.json`, `package-lock.json` | Render build/start |
| `render.yaml` | Render Blueprint |
| `.env.example` | Local dev + env documentation |
| `scripts/delete-program.mjs` | Ops: SQLite program delete |
| `scripts/verify-printout-calcs.mjs` | Dev: calc regression check |

## What we intentionally left behind

| PWA path | Reason |
|----------|--------|
| `landing/` subfolder | Superseded by this repo's root `index.html` |
| `.github/workflows/deploy-landing.yml` | This repo deploys static files from root (no build step) |
| `scripts/build-pages.sh` | Only needed for PWA's nested `landing/` layout |
| `img/brand/bblogo.png` | Unused; landing uses `bblogo1.png` |

## What was already gone from PWA

- `/myplan/` phone PWA — removed before archive
- `gettheburnandbuildapp.com` — not referenced in PWA code

## Before deleting `pwa-burn-and-build`

- [x] **program-creator** in Render project **Burn & Build** (not Signal+)
- [ ] Reconnect Render **program-creator** service to `landing-burn-and-build`
- [ ] Verify `/health`, checkout, webhooks, program save/load
- [ ] Confirm GitHub Pages serves from **this repo** only (`burnandbuilddiet.com` CNAME)
- [ ] Disable GitHub Pages on `pwa-burn-and-build`
- [ ] Delete archived repo

## Local dev

```bash
cp .env.example .env   # fill Stripe keys for checkout testing
npm install
npm run dev            # API on :3001
```

Static site: serve repo root (e.g. `python -m http.server 3000`) and set `window.BNB_CONFIG = { apiBaseUrl: 'http://localhost:3001' }` if needed, or rely on `apiConfig.js` same-origin fallback when not on production hostname.
