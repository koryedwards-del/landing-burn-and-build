# Knowledge base backlog — save for later

Working notes from product exploration. Not user-facing copy yet.  
**Source of truth for food macro density:** USDA FoodData Central (per 100g in `data/cuttingStaplesAuditMap.js`). **Serving criteria:** Burn Engine. Historical 1982 seminar test weights are archival only.

---

## Organizing question (Burn & Build)

**Top question:** *How much food do I need to eat for what I do?*

That was the original question in 1982. Burn & Build is essentially the modern way of answering the same question.

This is **not** the same as claiming it is the most searched wording on Google. People probably break that question into searches like:

- How many calories should I eat?
- How much protein do I need?
- How much should I eat to lose fat?
- Can I lose fat without losing muscle?
- What should I eat to build muscle?

Those six search topics share a common root: people may Google calories, protein, lose fat without losing muscle, or body recomposition, but underneath they're often trying to figure out how much they should eat for their particular body and activity.

The organizing question sits **above** all of them. Those searches are pieces of the larger question Burn & Build has been answering since 1982.

**Use this question to structure the knowledge base.** Each article, FAQ entry, handbook tip, and printout Q&A should connect back to: *for this body and this activity level, how much food — and of what kind — do you need?*

### Two-fold approach (content + conversion)

Tie each Google search fragment to **two things**:

| Fold | What they get | Product role |
|------|---------------|--------------|
| **1. The diet as the answer** | Burn & Build — the system, the why, the 1982 principle | Educate: this is what you've been looking for |
| **2. The food plan as the path** | Their custom servings, built for their body and activity | Convert: this is how you get there |

Someone searching *"how many calories should I eat?"* isn't really looking for a generic calorie calculator. They're looking for **an answer** (a diet built for recomp — lose fat, keep muscle) and **a path** (a food plan calculated for their lean body mass, job, and exercise).

Every KB article / landing touchpoint follows the same arc:

1. **Meet them at the Google question** — use their exact search wording as the headline
2. **Answer with the diet** — Burn & Build explains *why* and *how much in principle*
3. **Point to the food plan** — questionnaire → Burn Engine → personalized servings is *their* answer

```
Google fragment  →  Diet (the answer)  →  Food plan (the path)
     ↓                    ↓                        ↓
"How much protein?"   Burn & Build system    Your custom servings
```

**Site flow already matches this:**

| Step | Path | Fold |
|------|------|------|
| Educate | KB article / landing section | Diet = the answer |
| Questionnaire | `/questionnaire/` | Path begins — body + activity |
| Purchase | `/createyourfoodplan/` | Food plan unlocked |
| Deliver | `/createyourfoodplan/` | Burn & Build Diet PDF download |

| Layer | Role |
|-------|------|
| **Organizing question** | How much food do I need to eat for what I do? |
| **Search fragments** | Calories, protein, fat loss, muscle retention, recomp, muscle gain |
| **Fold 1 — Diet (answer)** | Burn & Build system — recomp, lean mass, right food/right amount/right time |
| **Fold 2 — Food plan (path)** | Burn Engine → personalized macros → servings across five food groups |

### Pricing frame ($149)

Either fold alone is worth $149:

| Fold | Standalone value |
|------|------------------|
| **Diet (answer)** | A proven recomp system — 40+ years, Burn Engine logic, curated food philosophy, handbook/FAQ |
| **Food plan (path)** | Personalized servings for *your* body and activity — macros, five food groups, menu planner, printouts |

Combined at $149, it's a bargain in the industry. Competitors charge separately for "the program" and "your custom plan," or lock you into subscriptions. Burn & Build delivers both in one purchase.

**Messaging implication:** KB articles and landing copy can lead with either fold depending on the search fragment — some people need the system first, others need the plan first — but checkout always sells both.

---

## 1982 PDF protein sheet (authoritative)

Tested gram weights from seminar printout. Dairy is a **separate column** (not below).

| Food | Serving label | Weight (g) |
|------|---------------|------------|
| Beef, round steak (ground) | 1 oz | 24 |
| Eggs, medium | 2 whites/1 yolk | 69 |
| Eggs, substitute (Eggbeaters) | 1/3 cup | 80 |
| Fish, blue | 1 oz | 25 |
| Fish, catfish | 1 ½ oz | 31 |
| Fish, cod | 1 oz | 28 |
| Fish, flounder | 1 oz | 26 |
| Fish, haddock | 1 ¼ oz | 34 |
| Fish, halibut | 1 ¼ oz | 38 |
| Fish, perch | 1 ½ oz | 42 |
| Fish, pike | 1 ½ oz | 44 |
| Fish, snapper | 1 ½ oz | 40 |
| Fish, sole | 1 ¾ oz | 48 |
| Fish, swordfish | 1 oz | 28 |
| Fish, tuna (water-packed) | 1 oz | 28 |
| Poultry, chicken (no skin) | 1 oz | 24 |
| Poultry, turkey | 1 oz | 29 |
| Seafood, clams | 1/3 cup | 51 |
| Seafood, crab meat | 1 ½ oz | 46 |
| Seafood, lobster | 1 ½ oz | 43 |
| Seafood, oysters | 3 ½ oz | 95 |
| Seafood, scallops | 1 ¼ oz | 34 |
| Seafood, shrimp | 1 ¼ oz | 33 |
| Game, venison | 1 ½ oz | 38 |

**Not on sheet:** salmon, tilapia, pork, bison, steak cuts (eye of round, sirloin), generic 95% ground.

**On sheet (corrects earlier assumptions):** swordfish, bluefish, catfish, venison.

**Butcher (meal caveat only):** Ground Round & Potato card — ask the butcher to grind trimmed round; not grab-and-go hamburger.

### 8g / 2g audit (USDA × tested weights)

Burn Engine: 32 cal = 8g protein; 18 cal = 2g fat per protein serving.

| Result | Items |
|--------|-------|
| **Pass @ tested weight** | Eggbeaters (80g), shrimp (33g), haddock (34g), scallops (34g), turkey (29g), chicken (24g), halibut (38g) |
| **Fat >2g @ tested weight** | Eggs 2w/1y (3.1g), swordfish (2.1g), oysters (2.8g) |
| **Fat >2g if scaled to 8g pro** | + bluefish (2.2g), eggs (3.6g) |
| **Tested portion, fat OK** | Ground round, cod, flounder, sole, tuna, catfish, crab, lobster, venison, perch, pike, snapper, clams — protein grams vary; **seminar weights override USDA** |

**Takeaway:** 8/2 was the screening rule; portions are **empirically tested**. Catalog `foods.json` needs diff to this sheet (e.g. chicken 24 not 26, flounder 26 not 37). Run: `node scripts/protein-82-audit.mjs`

---

## Burn Engine — grains & starches (separate)

From `js/burnEngine.js` `computeServingsPhase`:

| Slot | Cal/serving | Baked-in fat (TF) | Strict rule |
|------|-------------|-------------------|-------------|
| **Grains (G1)** | 56 → **14g carbs** | `G1 × 9` → **~1.0g fat** | **14/1** — fat ≤ 1.0g at 14g-carb portion |
| **Starches (S2)** | 56 → **14g carbs** | `S2 × 4` → **~0.44g fat** | **14/0.44** — fat ≤ 0.44g at 14g-carb portion |

Gram weight (now) = `1400 / carbs_per_100g` (current USDA, not 1982).  
Handbook: bread **1 oz** per serving — measure slices.  
Beans/rice count here as grains/starches, not protein (`grainsStarchesTipsPrintout.js`).

**No 1982 grains/starches PDF yet** — audit uses current catalog + USDA + prep cross-ref.  
Run: `node scripts/grains-14-1-audit.mjs` · `node scripts/starches-14-0-audit.mjs`

### Grains — 14/1 × prep (2026-07-30)

**KEEP (11):** Corn grits, Cream of Rice, Cream of Wheat, English muffin, Pasta regular, Rice cakes plain, Rice basmati/brown/jasmine/white, Tortilla corn (6-inch).

**MAYBE (10):** Barley, Pita whole wheat, Bread sourdough/white, Bulgur, Corn flakes, Rice noodles, Rice wild, Shredded Wheat, Soba.

**Math FAIL — prep staples (needs decision):**
- **Oats, rolled** — 1.46g fat @ 14g carb (Fast Start breakfast)
- **Bread, whole wheat** — 1.19g fat @ 14g carb (Fast Start bread meal)

**Math FAIL — dropped (2026-07-30):** Amaranth, multigrain bread, Cheerios, saltines, egg noodles, quinoa. **41 grains remain** in catalog.

### Starches — 14/0.44 × prep (2026-07-30)

**KEEP (6):** Beans black, Potato baked/boiled/red/Yukon gold, Sweet potato baked.

**MAYBE (4):** Beans navy/pinto, Lentils, Yam cooked.

**Math FAIL — drop:** Chickpeas, all squash (1982 summer/winter/zucchini fail 14/0.44; acorn/butternut pass math but dropped per roster decision), spaghetti squash.

**Pass but not prep rotation:** kidney/lima/cannellini beans, jicama, peas variants, plantain, pumpkin, rutabaga, parsnips, taro, water chestnuts, etc.

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

- **Organizing question:** *How much food do I need to eat for what I do?* — see section above. Distinct from the landing-page tagline (*Lose the Fat. Keep the Muscle.*); the tagline is marketing shorthand, the organizing question is product truth.
- **Two-fold value @ $149:** Either fold (diet or food plan) alone is worth $149; combined, a bargain vs. industry norms. Lead with whichever fold matches the search fragment.
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
