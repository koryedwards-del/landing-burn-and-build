# Burn & Build — repo map

## What this repo is

Three standalone pieces:

1. **Landing page** — `index.html` + `hardkor.css` + assets (marketing only)
2. **Burn Engine** — serving math (`js/burnEngine.js`, foods data)
3. **Burn & Build Diet PDF** — program report (`server/pdf/`, printout payload)

Questionnaire, checkout, and API shell were removed. Reconnect landing → questionnaire → checkout when the new shell is built.

## Core paths

| Path | Role |
|------|------|
| `/` (`index.html`) | **Landing page** — standalone marketing (CTAs point to `/questionnaire/` when rebuilt) |
| `js/burnEngine.js` | **Burn Engine** — serving math |
| `js/burnEngineServingTargets.js` | Slot targets |
| `js/onboardingEngine.js` | Profile fields used by engine + PDF |
| `js/programPackage.js` | Build program package object |
| `js/*Printout.js` | PDF payload sections |
| `data/foods.json` + `data/cuttingStaplesPrintout.js` | Food roster + gram weights |
| `server/pdf/` | **PDF** — PDFKit renderer |
| `scripts/render-program-report-preview.mjs` | Generate sample PDFs |
| `docs/samples/` | Kristi preview PDFs |

## Verify

```bash
npm run verify:printout-calcs
npm run verify:pdf
```

## Sample PDF

Latest: `docs/samples/burn-and-build-diet-kristi-latest.pdf`

Raw download:
`https://raw.githubusercontent.com/koryedwards-del/landing-burn-and-build/main/docs/samples/burn-and-build-diet-kristi-latest.pdf`

## Site

**burnandbuilddiet.com** — GitHub Pages. Landing page live; questionnaire/checkout to be reconnected.

## Support email

**support@burnandbuilddiet.com**
