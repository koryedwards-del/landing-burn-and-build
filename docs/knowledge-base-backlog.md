# Knowledge base backlog — save for later

Working notes from product exploration. Not user-facing copy yet.  
**Source of truth for foods:** 1982 PDF food list (tested portions). Trim `foods.json` to match; update gram weights from PDF (USDA 2026 only where explicitly chosen).

---

## Protein list — trim direction

- **Keep:** 1982 PDF proteins only (seminar sheet). No pork, bison, salmon, tilapia, steak cuts, generic 95% lean ground, etc. unless on PDF.
- **Add / align:** **Trimmed ground round** = seminar **Beef, round steak (ground)**. Catalog entry: `Beef, ground round`. Gram weight **24** (seminar tested, not guessed USDA).
- **Butcher (meal caveat only):** Ground Round & Potato card — ask the butcher to grind trimmed round; not grab-and-go hamburger. Case sign (ground round $$ vs hamburger $) is the proof. Not print tips / FAQ until promoted.
- **Dairy / whey:** Competitors’ biggest protein source — lives on **dairy column**, not protein sheet.
- **Contest prep vs PDF:** Core overlap (chicken, turkey breast, eggs, white fish, seafood). Modern prep pushes ground turkey and tilapia — PDF intentionally different.

---

## Draft Q&A — turkey breast vs ground turkey

**Q: Can I use ground turkey instead of turkey breast?**

**A (draft):** No. They are different foods with different fat content. Standard 93/7 ground turkey is ~7% fat by weight but roughly **40–50% of calories from fat** (dark meat, skin, grind). Turkey breast is ~**2g fat per 100g cooked** (~13–15% fat calories). Swapping them breaks your serving math and fat points. Use **turkey breast** from the food list only.

**Why it matters:** Costly competition mistake — looks like prep food, behaves like a fattier grind. Shows up weeks later, not day one.

---

## Draft Q&A — trimmed ground round vs hamburger

**Q: Why trimmed ground round and not regular ground beef / hamburger?**

**A (draft):** Trimmed ground round is round steak, trimmed, ground from the round primal only — not generic hamburger trim. You **have to ask the butcher to grind it**; it is not the same as grabbing hamburger off the shelf. A knowledgeable butcher knows the difference; the case sign is the proof (ground round $$ vs hamburger $). Hamburger can include different trim and fat. Different grind = different fat = different portions.

**1982 PDF name:** Beef, round steak (ground). **App catalog:** `Beef, ground round`.

---

## Draft Q&A — salmon

Already in `data/proteinTipsPrintout.js`: *"Stick to the lean fish on this list."* Keep.

---

## Fat label vs fat calories (reference)

| Food | Label | Fat by weight | ~Fat % of calories |
|------|-------|---------------|-------------------|
| Turkey breast, skinless cooked | — | ~2g / 100g | ~13–15% |
| 93/7 ground turkey | 7% | ~8–11g / 100g | ~42–50% |
| 95/5 lean ground beef | 5% | — | ~33–35% |
| Trimmed ground round (round primal, butcher grind) | 85–90% lean label range | 10–15% | ~55–65%+ |

**Point:** "Lean" on the package ≠ lean for Burn & Build servings.

---

## Fast Start / meals — exploration notes

- Caveats = **idea generators**, not prescriptions. Servings are the prescription.
- **Potato:** Dave = clean mashed from **boiled**; some eat **baby reds whole**. Use `Potato, boiled` / `Potato, red, boiled` — not only baked.
- **Dave:** blends chicken in blender (dry breast compliance) — caveat spark, not rule.
- **Rocky:** sweet potato + white potato rotation.
- Bodybuilding meal ideas OK if portions come from engine; trim catalog to PDF proteins before adding meals that reference salmon, tilapia, steak cuts, pork.
- Photorealistic images: meals + fruits — user to generate separately.

---

## Marketing / product philosophy (context)

- Referral-led, not cold sell. Dave/Paul = proof; website = leave-behind.
- Don't dumb down engine for masses; 1982 closed list is non-compressible.
- Right food, right amount, right time — coupled system.
- Paul/Dave = years in contest shape **without** peak-week manipulation; not that path.

---

## Open tasks (when returning)

- [ ] Full PDF diff → trim `data/foods.json` proteins (and starches/grains when sheet available)
- [ ] Update gram weights from PDF tested weights
- [ ] Add handbook/FAQ Q&As above to `proteinTipsPrintout.js` or `handbookFaqPrintout.js` (generic print — fixed copy rules apply)
- [ ] Fix Fast Start meals to PDF-only proteins; add potato-based combos
- [ ] Default week: Friday snack fruit on Fast Start list (Pear — done on branch)
- [ ] `Beef, ground round` gram weight 24 from seminar — done on branch
