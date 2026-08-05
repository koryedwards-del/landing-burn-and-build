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

## API (Render)

**Project:** The Burn & Build  
**Service:** `program-creator`  
**URL:** https://program-creator-3tzd.onrender.com  
**Code:** `server/` in this repo  
**Config:** `render.yaml`, `.env.example`

Handles program save/load, Stripe checkout, webhooks, and admin contacts. The static site calls this API via `js/apiConfig.js`.

### Render reconnect (required before deleting `pwa-burn-and-build`)

The Render service currently deploys from the archived **`pwa-burn-and-build`** repo. Before deleting that repo:

1. Render Dashboard → project **The Burn & Build** → **program-creator** → Settings → connect **this repo** (`landing-burn-and-build`) instead.
2. Confirm build command `npm install` and start command match `render.yaml`.
3. Verify env vars are still set (`STRIPE_*`, `CONTACTS_ADMIN_KEY`, `DATABASE_PATH`, etc.).
4. Smoke test: `/health`, questionnaire save, checkout, program-report load.
5. Disable GitHub Pages on `pwa-burn-and-build` if still enabled (both repos had the same `CNAME`).

## Deprecated

| Item | Status |
|------|--------|
| **`pwa-burn-and-build` repo** | Archived — static UI already migrated here. Safe to delete **after** Render points at this repo. |
| **`gettheburnandbuildapp.com`** | Legacy app domain — no longer used in code. Do not rely on it. |
| **`/myplan/` phone PWA** | Removed from PWA repo; product is desktop-only. |

## Support email

**support@burnandbuilddiet.com**
