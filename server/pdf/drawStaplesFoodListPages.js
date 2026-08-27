/**
 * Cutting-staples food list pages (protein/grains + vegetables/fruit).
 * Used by B&B Sample Diet PDF (b&bsamplediet.pdf); program report keeps its own copy.
 */
import { PDF_FRAME_COLORS } from './drawFrame.js';
import { SEMINAR_COLORS, SEMINAR_FONTS } from './drawSeminar.js';
import { PRINT_TEMPLATE_TYPOGRAPHY as PT } from '../../js/printTemplateTypographyData.js';
import {
  CUTTING_STAPLES_FRUIT,
  CUTTING_STAPLES_GRAINS_STARCHES,
  CUTTING_STAPLES_PROTEIN_DAIRY,
  CUTTING_STAPLES_VEGETABLES,
} from '../../data/cuttingStaplesPrintout.js';
import { scaleStapleRows, stapleCategoryServings } from '../../js/stapleServingPrintout.js';

const FONTS = SEMINAR_FONTS;
const LAYOUT = Object.freeze({
  bodySize: PT.body,
  subsectionSize: PT.subsection,
  lineGap: PT.lineGap,
  sectionGap: PT.sectionGap,
  headerGap: PT.headerGap,
});

const STAPLES_LIST = Object.freeze({
  columnGap: 20,
  rowGap: 3,
  leaderPad: 4,
  ruleWidth: 0.75,
});

function staplesFirstLine(doc, text, maxWidth) {
  const words = String(text).split(/\s+/);
  let line = '';
  for (let i = 0; i < words.length; i += 1) {
    const candidate = line ? `${line} ${words[i]}` : words[i];
    if (doc.widthOfString(candidate) > maxWidth && line) {
      return { first: line, rest: words.slice(i).join(' ') };
    }
    line = candidate;
  }
  return { first: line, rest: '' };
}

function drawStapleDotLeaders(doc, xStart, xEnd, y) {
  if (xEnd <= xStart) return;
  const dot = '.';
  const dotW = doc.widthOfString(dot);
  const step = dotW + 1.5;
  let x = xStart;
  while (x + dotW <= xEnd) {
    doc.text(dot, x, y, { lineBreak: false });
    x += step;
  }
}

function staplesColumnLayout(page) {
  const gap = STAPLES_LIST.columnGap;
  const colWidth = (page.width - gap) / 2;
  return [
    { x: page.x, width: colWidth },
    { x: page.x + colWidth + gap, width: colWidth },
  ];
}

function drawStaplesColumnRule(doc, x, yTop, yBottom) {
  doc
    .strokeColor(PDF_FRAME_COLORS.gold)
    .lineWidth(STAPLES_LIST.ruleWidth)
    .moveTo(x, yTop)
    .lineTo(x, yBottom)
    .stroke();
}

function drawSectionTitle(doc, title, x, y, width) {
  doc
    .font(FONTS.bold)
    .fontSize(LAYOUT.subsectionSize)
    .fillColor(SEMINAR_COLORS.body)
    .text(String(title || ''), x, y, { width, lineGap: 0 });
  return doc.y + LAYOUT.headerGap;
}

function drawStapleListRow(doc, item, x, y, width) {
  const name = String(item.name);
  const serving = String(item.serving);
  const pad = STAPLES_LIST.leaderPad;
  const lineH = LAYOUT.bodySize;

  doc.font(FONTS.regular).fontSize(lineH).fillColor(SEMINAR_COLORS.body);

  const servingW = doc.widthOfString(serving);
  const servingX = x + width - servingW;
  const minLeader = doc.widthOfString(' . . .');
  const nameMaxW = width - servingW - pad * 2 - minLeader;

  if (doc.widthOfString(name) <= nameMaxW) {
    doc.text(name, x, y, { lineBreak: false });
    drawStapleDotLeaders(doc, x + doc.widthOfString(name) + pad, servingX - pad, y);
    doc.text(serving, servingX, y, { lineBreak: false });
    return y + lineH + STAPLES_LIST.rowGap;
  }

  const { first, rest } = staplesFirstLine(doc, name, nameMaxW);
  const firstW = doc.widthOfString(first);
  doc.text(first, x, y, { lineBreak: false });
  drawStapleDotLeaders(doc, x + firstW + pad, servingX - pad, y);
  doc.text(serving, servingX, y, { lineBreak: false });

  if (!rest) return y + lineH + STAPLES_LIST.rowGap;

  const restH = doc.heightOfString(rest, { width, lineGap: 0 });
  doc.text(rest, x, y + lineH, { width, lineGap: 0 });
  return y + lineH + restH + STAPLES_LIST.rowGap;
}

function drawStapleListItems(doc, items, col, yStart, bottomY, startIndex = 0) {
  let y = yStart;
  let index = startIndex;
  const lineH = LAYOUT.bodySize + STAPLES_LIST.rowGap;
  for (; index < items.length; index += 1) {
    if (y + lineH > bottomY) break;
    y = drawStapleListRow(doc, items[index], col.x, y, col.width);
  }
  return { y, nextIndex: index };
}

function staplesForPayload(items, category, payload) {
  const servings = stapleCategoryServings(payload.servings?.planServings, category);
  return scaleStapleRows(items, servings);
}

/**
 * @param {object} frame
 * @param {(doc, payload, pageTitle?: string|null) => object} frame.startPage
 * @param {(doc, payload) => object} frame.continuePage
 */
export function drawStaplesFoodListPage(doc, payload, frame) {
  const proteinItems = staplesForPayload(CUTTING_STAPLES_PROTEIN_DAIRY, 'protein', payload);
  const grainItems = staplesForPayload(CUTTING_STAPLES_GRAINS_STARCHES, 'grains', payload);

  let page = frame.startPage(doc, payload, 'Food List');
  let columns = staplesColumnLayout(page);
  const ruleX = columns[0].x + columns[0].width + STAPLES_LIST.columnGap / 2;
  drawStaplesColumnRule(doc, ruleX, page.y, page.bottom);

  const proteinCol = columns[0];
  let proteinY = drawSectionTitle(doc, 'Protein & Dairy', proteinCol.x, page.y, proteinCol.width);
  const proteinResult = drawStapleListItems(
    doc,
    proteinItems,
    proteinCol,
    proteinY,
    page.bottom,
    0,
  );
  if (proteinResult.nextIndex !== proteinItems.length) {
    throw new Error(`Protein list truncated: drew ${proteinResult.nextIndex} of ${proteinItems.length}`);
  }

  let gsCol = columns[1];
  let gsY = drawSectionTitle(doc, 'Grains & Starches', gsCol.x, page.y, gsCol.width);
  let gsIndex = 0;

  while (gsIndex < grainItems.length) {
    const result = drawStapleListItems(doc, grainItems, gsCol, gsY, page.bottom, gsIndex);
    gsIndex = result.nextIndex;
    gsY = result.y;

    if (gsIndex < grainItems.length) {
      page = frame.continuePage(doc, payload);
      columns = staplesColumnLayout(page);
      const nextRuleX = columns[0].x + columns[0].width + STAPLES_LIST.columnGap / 2;
      drawStaplesColumnRule(doc, nextRuleX, page.y, page.bottom);
      gsCol = columns[1];
      gsY = page.y;
    }
  }

  if (gsIndex !== grainItems.length) {
    throw new Error(`Grains/starches list truncated: drew ${gsIndex} of ${grainItems.length}`);
  }
}

export function drawVegFruitFoodListPage(doc, payload, frame) {
  const vegetableItems = staplesForPayload(CUTTING_STAPLES_VEGETABLES, 'vegetable', payload);
  const fruitItems = staplesForPayload(CUTTING_STAPLES_FRUIT, 'fruit', payload);

  let vegIndex = 0;
  let fruitIndex = 0;
  let firstPage = true;

  while (vegIndex < vegetableItems.length || fruitIndex < fruitItems.length) {
    const page = firstPage
      ? frame.startPage(doc, payload, 'Food List')
      : frame.continuePage(doc, payload);
    firstPage = false;
    const columns = staplesColumnLayout(page);
    const ruleX = columns[0].x + columns[0].width + STAPLES_LIST.columnGap / 2;
    drawStaplesColumnRule(doc, ruleX, page.y, page.bottom);

    if (vegIndex < vegetableItems.length) {
      let y = page.y;
      if (vegIndex === 0) {
        y = drawSectionTitle(doc, 'Vegetables', columns[0].x, y, columns[0].width);
      }
      const vegResult = drawStapleListItems(
        doc,
        vegetableItems,
        columns[0],
        y,
        page.bottom,
        vegIndex,
      );
      vegIndex = vegResult.nextIndex;
    }

    if (fruitIndex < fruitItems.length) {
      let y = page.y;
      if (fruitIndex === 0) {
        y = drawSectionTitle(doc, 'Fruit', columns[1].x, y, columns[1].width);
      }
      const result = drawStapleListItems(
        doc,
        fruitItems,
        columns[1],
        y,
        page.bottom,
        fruitIndex,
      );
      fruitIndex = result.nextIndex;
    }
  }

  if (vegIndex !== vegetableItems.length) {
    throw new Error(`Vegetable list truncated: drew ${vegIndex} of ${vegetableItems.length}`);
  }
  if (fruitIndex !== fruitItems.length) {
    throw new Error(`Fruit list truncated: drew ${fruitIndex} of ${fruitItems.length}`);
  }
}
