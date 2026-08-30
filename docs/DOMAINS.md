# Burn & Build — repo map

## What this repo is

Three standalone pieces:

1. **Landing page** — `index.html` + `hardkor.css` + assets (marketing only)
2. **Burn Engine** — serving math (`js/burnEngine.js`, foods data)
3. **Burn & Build Diet PDF** — purchased deliverable (`server/pdf/renderSampleDietPrintout.js`, 8 pages)

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
| `js/sampleDietPrintoutData.js` | Burn & Build Diet PDF payload (sample + purchased) |
| `js/intakeQuestionCopyData.js` | Shared questionnaire question text + field numbering |
| `js/sampleDietPrintoutCopyData.js` | Locked PDF page copy |
| `js/programReportCopyData.js` | Burn & Build Diet copy archive (pending wiring) |
| `js/answersConfirmationPrintout.js` | PDF page 8 — submitted answers |
| `js/leanBodyAnalysisPrintout.js` | LBA helpers + fat-source labels (bar/timeline exports retained for copy archive) |
| `js/programClientDataHelpers.js` | Client name + date helpers |
| `js/sampleDietPreviewFixtures.js` | Sample Female preview fixtures |
| `js/printoutVerifyFixtures.js` | Golden verify fixtures (engine + PDF) |
| `js/printTemplateTypographyData.js` | PDF typography tokens |
| `data/foods.json`, `data/cuttingStaplesPrintout.js` | Food roster + gram weights |
| `server/pdf/renderSampleDietPrintout.js` | Burn & Build Diet PDF renderer |
| `server/pdf/` | PDFKit renderer |
| `server/publicSampleDiet.js` | Live sample fallback when static PDF missing |
| `docs/samples/` | `b&bsamplediet.pdf` (landing preview), `menu-plan-worksheet.pdf`, `burn-and-build-faq.pdf`, `burn-and-build-purchase-email.html` |
| `purchase-email-preview/` | Purchase autosend email HTML preview (`index.html`) |

## Verify

```bash
npm run verify:printout-calcs
npm run verify:pdf
```

## Sample / purchased PDF

Landing sample: `GET /api/samples/sample-diet` → `docs/samples/b&bsamplediet.pdf`. Purchased diet: `GET /api/programs/diet-pdf` (live-rendered). Purchase email preview: `https://burnandbuilddiet.com/purchase-email-preview/` (GitHub Pages) · API `GET /api/samples/burn-and-build-purchase-email`.

## Questionnaire

| Path | Role |
|------|------|
| `questionnaire/index.html` | Program Questionnaire markup (`intake-acc`, `q-app--workroom`) |
| `questionnaire/js/questionnaire.js` | Step nav, accordion flow, Burn Engine build |
| `questionnaire/css/questionnaire.css` | Single workroom stylesheet (mobile-first) |

**Build my program** saves to `sessionStorage` (`bnb_program_draft`). Checkout/API not wired yet.

## Site

**burnandbuilddiet.com** — GitHub Pages. Landing and questionnaire live; checkout to reconnect at `/createyourfoodplan/`.
