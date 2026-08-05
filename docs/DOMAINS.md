# Burn & Build — domain & repo map

## Single source of truth

**Repo:** `landing-burn-and-build`  
**Site:** **https://burnandbuilddiet.com** (GitHub Pages, `CNAME`)

This repo holds the **full desktop web product** from marketing through menu planner, plus the **API backend** deployed to Render.

Push to `main` deploys the static site via GitHub Pages. The API deploys separately on Render (see below).

## User flow (all on burnandbuilddiet.com)

```
Landing (/) → Questionnaire (/questionnaire/) → Checkout (/createyourfoodplan/)
  → Program report (/program-report/) → Menu planner (page 4)
```

Return visits: `/menuplanner/` or `/program-report/?page=menuplanner` + email.

| Path | Purpose |
|------|---------|
| `/` | Marketing landing |
| `/questionnaire/` | Intake wizard → Burn Engine builds program |
| `/createyourfoodplan/` | Stripe checkout paywall |
| `/program-report/` | Welcome, projections, servings, menu planner |
| `/menuplanner/` | Redirect → program-report page 4 |
| `/support`, `/privacypolicy` | Support & legal |
| `/contacts/` | Admin contact list (key auth) |

## Hosting

| Layer | Platform | Notes |
|-------|----------|-------|
| **Static site** | GitHub Pages | `burnandbuilddiet.com` — push to `main` deploys |
| **API** | Render | Project **Burn & Build** — not Signal+ |

## API (Render)

**Project:** Burn & Build  
**Environment:** Production  
**Service:** `program-creator`  
**URL:** https://program-creator-3tzd.onrender.com  
**Database:** SQLite on persistent disk (`bnb-data`, 1 GB) — not Postgres  
**Code:** `server/` in this repo  
**Config:** `render.yaml`, `.env.example`

Handles program save/load, Stripe checkout, webhooks, PDF generation, and admin contacts. The static site calls this API via `js/apiConfig.js`.

### Render checklist

- [x] **program-creator** in Render project **Burn & Build** (separate from Signal+ billing)
- [ ] Service deploys from **`landing-burn-and-build`** (not archived `pwa-burn-and-build`)
- [ ] Env vars set: `STRIPE_*`, `CONTACTS_ADMIN_KEY`, `DATABASE_PATH`, etc.
- [ ] Smoke test: `/health`, questionnaire save, checkout, program-report load

### Before deleting `pwa-burn-and-build`

1. Render Dashboard → project **Burn & Build** → **program-creator** → Settings → connect **this repo** (`landing-burn-and-build`).
2. Confirm build command `npm install` and start command match `render.yaml`.
3. Disable GitHub Pages on `pwa-burn-and-build` if still enabled (both repos had the same `CNAME`).

## Deprecated

| Item | Status |
|------|--------|
| **`pwa-burn-and-build` repo** | Archived — static UI already migrated here. Safe to delete **after** Render points at this repo. |
| **`gettheburnandbuildapp.com`** | Legacy app domain — no longer used in code. Do not rely on it. |
| **`/myplan/` phone PWA** | Removed from PWA repo; product is desktop-only. |

## Support email

**support@burnandbuilddiet.com**
