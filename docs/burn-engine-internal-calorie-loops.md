# Burn Engine — internal calorie loops (implementation only)

**Not used for portions, food-list gram weights, PDF labels, or user-facing copy.**  
Agents sizing food or writing printouts: use `.cursor/rules/burn-engine-servings.mdc` only.

`js/burnEngine.js` `computeServingsPhase` balances daily totals using calorie-weighted loops. Constants are exported as `SERVING_*_CAL` from `burnEngine.js`; macro-gram targets are in `js/burnEngineServingTargets.js`. Agents sizing food: use `.cursor/rules/burn-engine-servings.mdc`.

## Balancing loops

| Loop | Target | Per-serving formula |
|------|--------|---------------------|
| Protein `T9` | Daily protein grams `QG` | `(P1+D1)×32 + (G1+S2)×3` |
| Carb `TC` | Daily carb budget `C7` | `D1×48 + (G1+S2)×56 + VE×40 + FQ×72` |
| Fat `TF` | Maintain fat budget `FC` | `P1×18 + D1×22 + G1×9 + (S2+FQ)×4 + VE×3` |
| Extra fat | Gap to maintain total `T8` | `FT × 45` |

## Constant → macro-gram meaning

| Constant | Macro grams |
|----------|-------------|
| 32 | 8g protein |
| 48 | 12g carbs (dairy) |
| 56 | 14g carbs (grain/starch) |
| 40 | 10g carbs (vegetable) |
| 72 | Fruit slot (= **18g carbs**) |
| 18 | 2g fat (protein) |
| 22 | ~2.4g fat (dairy) |
| 9 | 1g fat (grain) |
| 4 | ~0.44g fat (starch/fruit baked-in) |
| 3 | ~0.33g fat (vegetable) |
| 45 | 1 extra-fat point (~5g fat if pure) |

## Other engine-only symbols

- `FAT_SERVING_CALORIES = 45` — extra-fat point size in code
- `fatLossPoundsFromDailyServings()` — projection math using unused fat points
- Projections / eight-week timeline — calorie gap between maintain and reduce totals
