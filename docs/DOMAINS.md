# Burn & Build — repo map

## What this repo is

Three standalone pieces:

1. **Landing page** — `index.html` + `hardkor.css` + assets (marketing only)
2. **Burn Engine** — serving math (`js/burnEngine.js`, foods data)
3. **Burn & Build Diet PDF** — purchased deliverable (`server/pdf/renderSampleDietPrintout.js`, 7 pages)

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
| `js/answersConfirmationPrintout.js` | Questionnaire review step — answer rows |
| `js/leanBodyAnalysisPrintout.js` | LBA helpers + fat-source labels (bar/timeline exports retained for copy archive) |
| `js/programClientDataHelpers.js` | Client name + date helpers |
| `js/sampleDietPreviewFixtures.js` | Sample Female preview fixtures |
| `js/printoutVerifyFixtures.js` | Golden verify fixtures (engine + PDF) |
| `js/printTemplateTypographyData.js` | PDF typography tokens |
| `data/foods.json`, `data/cuttingStaplesPrintout.js` | Food roster + gram weights |
| `server/pdf/renderSampleDietPrintout.js` | Burn & Build Diet PDF renderer |
| `server/pdf/` | PDFKit renderer |
| `server/publicSampleDiet.js` | Landing-page sample diet (live program on Render) |
| `docs/samples/` | Static menu-plan-worksheet PDF only |

## Verify

```bash
npm run verify:printout-calcs
npm run verify:pdf
```

## Sample / purchased PDF

Landing sample: `GET /api/samples/sample-diet` (live program — configure via `server/publicSampleDiet.js`). Purchased diet: `GET /api/programs/diet-pdf` via `server/dietFulfillment.js`. Same 7-page renderer.

## Questionnaire

| Path | Role |
|------|------|
| `questionnaire/index.html` | Program Questionnaire markup (`intake-acc`, `q-app--workroom`) |
| `questionnaire/js/questionnaire.js` | Step nav, accordion flow, Burn Engine build |
| `questionnaire/css/questionnaire.css` | Single workroom stylesheet (mobile-first) |

**Build my program** saves to `sessionStorage` (`bnb_program_draft`). Checkout/API not wired yet.

## Site

**burnandbuilddiet.com** — GitHub Pages. Landing and questionnaire live; checkout to reconnect at `/createyourfoodplan/`.
