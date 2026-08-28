/**
 * Cutting-staples food list pages (protein/grains + vegetables/fruit).
 * Shared by the Burn & Build Diet PDF template (sample + purchased).
 */
import { PDF_FRAME_COLORS } from './drawFrame.js';
import {
  MODERN_REPORT_COLORS,
  MODERN_REPORT_FONTS,
  registerModernReportFonts,
} from './drawModernReportFrame.js';
import {
  CUTTING_STAPLES_FRUIT,
  CUTTING_STAPLES_GRAINS_STARCHES,
  CUTTING_STAPLES_PROTEIN_DAIRY,
  CUTTING_STAPLES_VEGETABLES,
} from '../../data/cuttingStaplesPrintout.js';
import { scaleStapleRows, stapleCategoryServings } from '../../js/stapleServingPrintout.js';

const FONTS = MODERN_REPORT_FONTS;
const COLORS = MODERN_REPORT_COLORS;

const LAYOUT = Object.freeze({
  bodySize: 9.5,
  categorySize: 11.5,
  introSize: 9.5,
  introGap: 10,
  headerGap: 8,
  categoryRuleGap: 2,
  categoryRuleWidth: 1.25,
  stackedServingGap: 2,
});

const STAPLES_LIST = Object.freeze({
  columnGap: 20,
  rowGap: 5,
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

function drawFoodListIntro(doc, x, y, width, text) {
  doc
    .font(FONTS.regular)
    .fontSize(LAYOUT.introSize)
    .fillColor(COLORS.body)
    .text(String(text || ''), x, y, { width, lineGap: 2 });
  return doc.y + LAYOUT.introGap;
}

function drawSectionTitle(doc, title, x, y, width) {
  const label = String(title || '');
  doc
    .font(FONTS.bold)
    .fontSize(LAYOUT.categorySize)
    .fillColor(COLORS.body)
    .text(label, x, y, { width, lineBreak: false });

  const textW = doc.widthOfString(label);
  const ruleY = y + LAYOUT.categorySize + LAYOUT.categoryRuleGap;
  doc
    .strokeColor(COLORS.gold)
    .lineWidth(LAYOUT.categoryRuleWidth)
    .moveTo(x, ruleY)
    .lineTo(x + textW, ruleY)
    .stroke();

  return ruleY + LAYOUT.headerGap;
}

function drawStapleListRow(doc, item, x, y, width) {
  const name = String(item.name);
  const serving = String(item.serving);
  const pad = STAPLES_LIST.leaderPad;
  const lineH = LAYOUT.bodySize;

  doc.font(FONTS.regular).fontSize(lineH).fillColor(COLORS.body);
  const nameW = doc.widthOfString(name);
  doc.font(FONTS.bold).fontSize(lineH);
  const servingWBold = doc.widthOfString(serving);
  doc.font(FONTS.regular).fontSize(lineH);

  const minLeader = doc.widthOfString(' . . .');
  const singleLineFits = nameW + pad * 2 + minLeader + servingWBold <= width;

  if (!singleLineFits) {
    doc.text(name, x, y, { lineBreak: false });
    drawStapleDotLeaders(doc, x + nameW + pad, x + width, y);
    const servingY = y + lineH + LAYOUT.stackedServingGap;
    doc.font(FONTS.bold).fontSize(lineH).fillColor(COLORS.body);
    doc.text(serving, x, servingY, { width, align: 'right', lineBreak: false });
    doc.font(FONTS.regular).fontSize(lineH).fillColor(COLORS.body);
    return servingY + lineH + STAPLES_LIST.rowGap;
  }

  const servingX = x + width - servingWBold;
  const nameMaxW = width - servingWBold - pad * 2 - minLeader;

  if (nameW <= nameMaxW) {
    doc.text(name, x, y, { lineBreak: false });
    drawStapleDotLeaders(doc, x + nameW + pad, servingX - pad, y);
    doc.font(FONTS.bold).fontSize(lineH).fillColor(COLORS.body);
    doc.text(serving, servingX, y, { lineBreak: false });
    doc.font(FONTS.regular).fontSize(lineH).fillColor(COLORS.body);
    return y + lineH + STAPLES_LIST.rowGap;
  }

  const { first, rest } = staplesFirstLine(doc, name, nameMaxW);
  const firstW = doc.widthOfString(first);
  doc.text(first, x, y, { lineBreak: false });
  drawStapleDotLeaders(doc, x + firstW + pad, servingX - pad, y);
  doc.font(FONTS.bold).fontSize(lineH).fillColor(COLORS.body);
  doc.text(serving, servingX, y, { lineBreak: false });
  doc.font(FONTS.regular).fontSize(lineH).fillColor(COLORS.body);

  if (!rest) return y + lineH + STAPLES_LIST.rowGap;

  const restH = doc.heightOfString(rest, { width, lineGap: 0 });
  doc.text(rest, x, y + lineH, { width, lineGap: 0 });
  return y + lineH + restH + STAPLES_LIST.rowGap;
}

function stapleRowReserve(doc, item, width) {
  const name = String(item.name);
  const serving = String(item.serving);
  const lineH = LAYOUT.bodySize;
  doc.font(FONTS.regular).fontSize(lineH);
  const nameW = doc.widthOfString(name);
  doc.font(FONTS.bold).fontSize(lineH);
  const servingWBold = doc.widthOfString(serving);
  doc.font(FONTS.regular).fontSize(lineH);
  const minLeader = doc.widthOfString(' . . .');
  if (nameW + STAPLES_LIST.leaderPad * 2 + minLeader + servingWBold > width) {
    return lineH * 2 + LAYOUT.stackedServingGap + STAPLES_LIST.rowGap;
  }
  return lineH + STAPLES_LIST.rowGap;
}

function drawStapleListItems(doc, items, col, yStart, bottomY, startIndex = 0) {
  let y = yStart;
  let index = startIndex;
  for (; index < items.length; index += 1) {
    const rowReserve = stapleRowReserve(doc, items[index], col.width);
    if (y + rowReserve > bottomY) break;
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
  registerModernReportFonts(doc);

  const proteinItems = staplesForPayload(CUTTING_STAPLES_PROTEIN_DAIRY, 'protein', payload);
  const grainItems = staplesForPayload(CUTTING_STAPLES_GRAINS_STARCHES, 'grains', payload);

  let page = frame.startPage(doc, payload, 'Food List');
  let columns = staplesColumnLayout(page);
  let contentY = page.y;
  if (payload.foodList?.intro) {
    contentY = drawFoodListIntro(doc, page.x, contentY, page.width, payload.foodList.intro);
  }

  const ruleX = columns[0].x + columns[0].width + STAPLES_LIST.columnGap / 2;
  drawStaplesColumnRule(doc, ruleX, contentY, page.bottom);

  const proteinCol = columns[0];
  let proteinY = drawSectionTitle(doc, 'Protein & Dairy', proteinCol.x, contentY, proteinCol.width);
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
  let gsY = drawSectionTitle(doc, 'Grains & Starches', gsCol.x, contentY, gsCol.width);
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
  registerModernReportFonts(doc);

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
