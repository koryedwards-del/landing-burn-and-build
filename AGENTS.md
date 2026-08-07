# AGENTS.md

## Cursor Cloud specific instructions

### Product / services

Single product: **Burn & Build** static desktop site + Express API in `server/`.

| Service | Command | Notes |
|---|---|---|
| API + static (dev) | `npm run dev` | Serves UI and API on `PORT` (default **3001**). Uses `node --watch`. |
| API + static (prod-like) | `npm start` | Same entrypoint without watch. |

There is no separate database process — SQLite via `better-sqlite3` at `server/data/programs.db` locally.

### Env

Copy `.env.example` → `.env` for local runs. Stripe keys are optional locally: `/api/checkout/status` reports `testBypass: true` when Stripe is not configured / `NODE_ENV=development`, and `POST /api/checkout/test-complete` can mark a program paid without Stripe.

### Routing gotchas

- `GET /` redirects to `/createyourfoodplan/`. Use `/index.html` for the marketing landing while the API is serving static files.
- Same-origin API calls work when the Express server serves the site (`js/apiConfig.js`). A separate static server on `:3000` is optional.

### Lint / test / build

No dedicated lint, unit-test, or build scripts in `package.json`. Validate with `npm run dev`, `GET /health`, and the questionnaire → save program → (test-complete or Stripe) → `/program-report/` flow. See `docs/DOMAINS.md` for path map.
