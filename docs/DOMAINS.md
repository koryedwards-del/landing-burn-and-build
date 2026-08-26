# Burn & Build — repo map

## What this repo is

Three standalone pieces:

1. **Landing page** — `index.html` + `hardkor.css` + assets (marketing only)
2. **Burn Engine** — serving math (`js/burnEngine.js`, foods data)
3. **Burn & Build Diet PDF** — program report (`server/pdf/`, printout payload)

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
| `js/programReportPrintout.js` | Full PDF payload |
| `js/answersConfirmationPrintout.js` | PDF page 12 — submitted answers |
| `js/leanBodyAnalysisPrintout.js` | PDF lean body analysis page |
| `js/programClientDataHelpers.js` | Client name + date helpers |
| `js/programReportCopyData.js` | Locked user-authored PDF copy |
| `js/printTemplateTypographyData.js` | PDF typography tokens |
| `data/foods.json`, `data/cuttingStaplesPrintout.js` | Food roster + gram weights |
| `server/pdf/` | PDFKit renderer |
| `docs/samples/` | Kristi preview PDFs |

## Verify

```bash
npm run verify:printout-calcs
npm run verify:pdf
```

## Sample PDF

`docs/samples/burn-and-build-diet-kristi-latest.pdf`

## Site

**burnandbuilddiet.com** — GitHub Pages. Landing live; questionnaire/checkout to be reconnected.
