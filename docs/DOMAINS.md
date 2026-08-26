# Burn & Build — domain & repo map

## Single source of truth

**Repo:** `landing-burn-and-build`  
**Site:** **https://burnandbuilddiet.com** (GitHub Pages, `CNAME`)

This repo holds the **full desktop web product** from marketing through checkout and PDF delivery, plus the **API backend** deployed to Render.

Push to `main` deploys the static site via GitHub Pages. The API deploys separately on Render (see below).

## User flow (all on burnandbuilddiet.com)

```
Landing (/) → Questionnaire (/questionnaire/) → Checkout (/createyourfoodplan/)
  → Download Burn & Build Diet PDF (program report)
```

Purchasers can restore at `/createyourfoodplan/` by email. Legacy URLs redirect there.

| Path | Purpose |
|------|---------|
| `/` | Marketing landing |
| `/questionnaire/` | Program questionnaire → Burn Engine builds program (gated; redirects to checkout portal when closed) |
| `/createyourfoodplan/` | Stripe checkout + purchaser download portal |
| `/get-your-diet/` | Redirect → `/questionnaire/#welcome` |
| `/program-report/` | Redirect → `/createyourfoodplan/` |
| `/menuplanner/` | Redirect → `/createyourfoodplan/` |
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

Handles program save/load, Stripe checkout, webhooks, diet PDF generation, and admin contacts. The static site calls this API via `js/apiConfig.js`.

Purchased diet PDFs use `GET /api/programs/diet-pdf` (always fresh render).

### Render checklist

After server changes on `main`, confirm Render auto-deploy finished (or trigger manual deploy on **program-creator**).

- [x] **program-creator** in Render project **Burn & Build**
- [x] Service deploys from **`koryedwards-del/landing-burn-and-build`**, branch **`main`**
- [x] End-to-end flow verified: questionnaire → payment → download printout
- [ ] Latest `main` deployed on Render (check `curl …/health` → `commit` matches local)
- [ ] Env vars set: `STRIPE_*`, `CONTACTS_ADMIN_KEY`, `RESEND_API_KEY`, `DIET_EMAIL_FROM`, `DATABASE_PATH`, etc.
- [ ] `npm run verify:launch` passes (local + production health)

## Deprecated

| Item | Status |
|------|--------|
| **`pwa-burn-and-build` repo** | Archived — static UI migrated here |
| **`gettheburnandbuildapp.com`** | Legacy app domain — no longer used in code |
| **`/myplan/` phone PWA** | Removed; product is desktop-only |
| **`docs/samples/kwarner-*.pdf`** | Retired naming — use `burn-and-build-diet-kristi-*.pdf` |

## Support email

**support@burnandbuilddiet.com**
