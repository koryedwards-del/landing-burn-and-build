# HARDKOR Diet — repo map

## What this repo is

Three standalone pieces:

1. **Landing page** — `index.html` + `hardkor.css` + assets (marketing only)
2. **Burn Engine** — serving math (`js/burnEngine.js`, foods data)
3. **HARDKOR Diet PDF** — purchased deliverable (`server/pdf/renderSampleDietPrintout.js`, **7 pages**)

## File naming

`js/` files end with a role suffix: **Engine**, **Data**, **Helpers**, **Printout**, or **Fixtures**.

## Core paths

| Path | Role |
|------|------|
| `/` (`index.html`) | **Landing page** |
| `js/burnEngine.js` | **Burn Engine** — serving math |
| `js/burnEngineServingTargetsData.js` | Engine slot targets (derived constants) |
| `js/profileDataEngine.js` | Customer answers → profile |
| `js/programPackageData.js` | Program package object |
| `js/bodyCompositionData.js` | Body composition calculations |
| `js/sampleDietPrintoutData.js` | HARDKOR Diet PDF payload (sample + purchased) |
| `js/intakeQuestionCopyData.js` | Shared questionnaire question text + field numbering |
| `js/sampleDietPrintoutCopyData.js` | Locked PDF page copy (live path for printout text) |
| `js/programReportCopyData.js` | Legacy copy archive (not wired to renderer) |
| `js/answersConfirmationPrintout.js` | PDF page 7 — submitted answers |
| `js/leanBodyAnalysisPrintout.js` | LBA helpers + fat-source labels |
| `js/programClientDataHelpers.js` | Client name + date helpers |
| `js/sampleDietPreviewFixtures.js` | Sample Female preview fixtures |
| `js/printoutVerifyFixtures.js` | Golden verify fixtures (engine + PDF) |
| `js/printTemplateTypographyData.js` | PDF typography tokens |
| `data/foods.json`, `data/cuttingStaplesPrintout.js` | Food roster + gram weights |
| `server/pdf/renderSampleDietPrintout.js` | HARDKOR Diet PDF renderer |
| `server/pdf/` | PDFKit renderer |
| `server/publicSampleDiet.js` | Live sample fallback when static PDF missing |
| `docs/samples/` | `hardkor-sample-diet.pdf`, `hardkor-menu-plan-worksheet.pdf`, `hardkor-diet-faq.pdf`, `hardkor-purchase-email.html` |
| `purchase-email-preview/` | Purchase autosend email HTML preview (`index.html`) |

## Verify

```bash
npm run verify:printout-calcs
npm run verify:pdf
```

## Sample / purchased PDF

Landing sample: `GET /api/samples/hardkor-sample-diet` → `docs/samples/hardkor-sample-diet.pdf` when committed (**download:** `https://program-creator-3tzd.onrender.com/api/samples/hardkor-sample-diet`). Purchased diet: `GET /api/programs/diet-pdf` (live-rendered). Purchase email preview download: `https://program-creator-3tzd.onrender.com/api/samples/hardkor-purchase-email`. Legacy domain redirect: `docs/domain-redirect-external.md`.

## Customer flow (wired)

```
Landing (/) → /questionnaire/?create=1
  → Build my program (Burn Engine) → save draft + POST /api/programs (SQLite on Render)
  → /createyourfoodplan/ → Stripe Checkout (POST /api/checkout)
  → success → GET /api/checkout/verify → diet PDF + Resend email
  → purchaser portal + GET /api/programs/diet-pdf
```

Stripe webhooks: `POST /api/webhooks/stripe` (payment mark-paid, PDF prep, email retries). Static site: **GitHub Pages** (`CNAME` → `thehardkordiet.com`). API: **Render** (`program-creator-3tzd.onrender.com`).

## Questionnaire

| Path | Role |
|------|------|
| `questionnaire/index.html` | Program Questionnaire markup (`intake-acc`, `q-app--workroom`) |
| `questionnaire/js/questionnaire.js` | Step nav, accordion flow, Burn Engine build, server save on build |
| `questionnaire/css/questionnaire.css` | Single workroom stylesheet (mobile-first) |

**Build my program** runs the engine, saves `bnb_program_draft` in `sessionStorage`, and **POSTs the package to `/api/programs`** before redirecting to checkout.

## Site

**thehardkordiet.com** — GitHub Pages (landing + questionnaire + purchaser portal at `/createyourfoodplan/`). Legacy **burnandbuilddiet.com** remains in CORS and email infrastructure; public links canonicalize to thehardkordiet.com where applicable (see project store domain migration notes).
