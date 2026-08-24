/**
 * Preview-only: KWarner 5-page seminar content + locked personalized frame.
 * Not wired to production API — run scripts/render-kwarner-locked-preview.mjs
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { createPrintPdf } from './creator.js';
import {
  addFramePage,
  drawContinuationHeader,
  drawFramePageTitle,
  framePageTitleStartY,
  pinnedContentBottomY,
  stampPinnedProgramFooters,
  PDF_FRAME_COLORS,
  PDF_FRAME_FONTS,
} from './drawFrame.js';
import { drawPersonalizationHeader } from './drawSeminar.js';
import {
  SEMINAR_COLORS,
  SEMINAR_FONTS,
} from './drawSeminar.js';
import { validatePrintPayload } from './validate.js';
import { PRINT_TEMPLATE_TYPOGRAPHY as PT } from '../../js/printTemplateTypography.js';
import {
  CUTTING_STAPLES_FRUIT,
  CUTTING_STAPLES_GRAINS_STARCHES,
  CUTTING_STAPLES_PROTEIN_DAIRY,
  CUTTING_STAPLES_VEGETABLES,
  GROCERY_STAPLES_PANTRY,
} from '../../data/cuttingStaplesPrintout.js';
import {
  scaleStapleRows,
  stapleCategoryServings,
} from '../../js/stapleServingPrintout.js';
import {
  COMMON_SPLASHES,
  FLAVOR_KIT_RULE,
  flavorKitList,
  SPLASH_RULE,
} from '../../menuplanner/data/flavorKits.js';
import { QUESTIONNAIRE_JOB_OPTIONS, WORK_STRESS } from '../../js/onboardingEngine.js';
import {
  BODY_FAT_PROGRESS_BAR_FOOTER,
  BODY_FAT_PROGRESS_BAR_SUBTITLE,
  BODY_FAT_PROGRESS_BAR_TITLE,
} from '../../js/lbaPrintout.js';

export const KWARNER_LOCKED_MIN_PAGES = 8;

const pdfRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FAT_CAN_3LB_IMAGE = path.join(pdfRoot, 'img/print/fat-can-3lb.png');
const FAT_CAN_INLINE_COUNT = 3;
const FAT_CAN_INLINE_HEIGHT = 52;
const FAT_CAN_INLINE_GAP = 5;

function fatCanInlineCell() {
  return {
    type: 'inlineImages',
    path: FAT_CAN_3LB_IMAGE,
    count: FAT_CAN_INLINE_COUNT,
    height: FAT_CAN_INLINE_HEIGHT,
    gap: FAT_CAN_INLINE_GAP,
  };
}

function isInlineImagesCell(content) {
  return content && typeof content === 'object' && content.type === 'inlineImages';
}

function inlineImagesLayout(doc, content, maxWidth) {
  const { path: imagePath, count, height, gap } = content;
  const img = doc.openImage(imagePath);
  const aspect = img.width / img.height;
  let h = height;
  let w = h * aspect;
  let totalW = count * w + (count - 1) * gap;
  if (totalW > maxWidth) {
    h = (maxWidth - (count - 1) * gap) / (count * aspect);
    w = h * aspect;
    totalW = count * w + (count - 1) * gap;
  }
  return { height: h, width: w, totalWidth: totalW };
}

function measureInlineImagesCell(doc, content, innerW) {
  const { height } = inlineImagesLayout(doc, content, innerW);
  return height + TABLE_CONTAINER.cellPad * 2;
}

function drawInlineImagesCell(doc, content, cellX, cellY, cellW, cellH) {
  const pad = TABLE_CONTAINER.cellPad;
  const innerW = cellW - pad * 2;
  const { path: imagePath, count, gap } = content;
  const { height, width, totalWidth } = inlineImagesLayout(doc, content, innerW);
  let x = cellX + (cellW - totalWidth) / 2;
  const y = cellY + (cellH - height) / 2;
  for (let i = 0; i < count; i += 1) {
    doc.image(imagePath, x, y, { height });
    x += width + gap;
  }
}

const LAYOUT = {
  bodySize: PT.body,
  subsectionSize: PT.subsection,
  tableHeadSize: PT.tableHead,
  tableBodySize: PT.tableBody,
  tableRowPad: PT.tableRowPad,
  lineGap: PT.lineGap,
  paragraphGap: PT.paragraphGap,
  sectionGap: PT.sectionGap,
  headerGap: PT.headerGap,
  contentPad: PT.contentPad,
};

function measureParagraph(doc, paragraph, width) {
  if (!paragraph) return 0;
  doc.font(SEMINAR_FONTS.regular).fontSize(LAYOUT.bodySize);
  return doc.heightOfString(String(paragraph), {
    width,
    lineGap: LAYOUT.lineGap,
  }) + LAYOUT.paragraphGap;
}

function drawBodyParagraphs(doc, payload, page, paragraphs, { fullHeader = false, pageTitle = null } = {}) {
  let current = page;
  (paragraphs || []).forEach((paragraph) => {
    if (!paragraph) return;
    const blockH = measureParagraph(doc, paragraph, current.width);
    current = ensureLockedSpace(doc, payload, current, blockH, { fullHeader });
    doc
      .font(SEMINAR_FONTS.regular)
      .fontSize(LAYOUT.bodySize)
      .fillColor(SEMINAR_COLORS.body)
      .text(String(paragraph), current.x, current.y, {
        width: current.width,
        lineGap: LAYOUT.lineGap,
        align: 'left',
      });
    current = { ...current, y: doc.y + LAYOUT.paragraphGap };
  });
  return current;
}

function measureBodyParagraphs(doc, paragraphs, width) {
  return (paragraphs || []).reduce(
    (sum, paragraph) => sum + measureParagraph(doc, paragraph, width),
    0,
  );
}

/** Tables only — gold border, no fill (watermark shows through). */
const TABLE_CONTAINER = Object.freeze({
  stroke: PDF_FRAME_COLORS.gold,
  radius: 4,
  inset: 2,
  cellPad: 8,
});

function tableColumnSpanBounds(columns, colSpan) {
  if (!colSpan?.from || !colSpan?.to) return null;
  const fromIndex = columns.findIndex((col) => col.key === colSpan.from);
  const toIndex = columns.findIndex((col) => col.key === colSpan.to);
  if (fromIndex < 0 || toIndex < fromIndex) return null;
  return { fromIndex, toIndex };
}

function tableColumnSpanWidth(colWidths, spanBounds) {
  return colWidths.slice(spanBounds.fromIndex, spanBounds.toIndex + 1).reduce((sum, w) => sum + w, 0);
}

function isTableColumnSpanned(columns, row, colIndex) {
  const spanBounds = tableColumnSpanBounds(columns, row._colSpan);
  if (!spanBounds) return false;
  return colIndex > spanBounds.fromIndex && colIndex <= spanBounds.toIndex;
}

function tableCellWidth(colWidths, columns, row, colIndex) {
  const spanBounds = tableColumnSpanBounds(columns, row._colSpan);
  if (spanBounds && colIndex === spanBounds.fromIndex) {
    return tableColumnSpanWidth(colWidths, spanBounds);
  }
  return colWidths[colIndex];
}

function resolveTableCellStyle(opts, row, rowIndex, col) {
  const headerRows = opts.headerRows ?? 1;
  const isHeader = rowIndex < headerRows;
  const boldKeys = new Set(opts.boldColumnKeys ?? []);

  if (typeof opts.getRowStyle === 'function') {
    const style = opts.getRowStyle(row, rowIndex, { isHeader });
    const font = style.font
      ?? (isHeader || boldKeys.has(col.key) ? SEMINAR_FONTS.bold : SEMINAR_FONTS.regular);
    const fontSize = style.fontSize
      ?? (isHeader ? (opts.headFontSize ?? LAYOUT.tableHeadSize) : (opts.bodyFontSize ?? LAYOUT.tableBodySize));
    return { font, fontSize };
  }

  return {
    font: isHeader || boldKeys.has(col.key) ? SEMINAR_FONTS.bold : SEMINAR_FONTS.regular,
    fontSize: isHeader
      ? (opts.headFontSize ?? LAYOUT.tableHeadSize)
      : (opts.bodyFontSize ?? LAYOUT.tableBodySize),
  };
}

function layoutTableRowHeights(doc, opts) {
  const columns = opts.columns;
  const tableW = opts.width;
  const colWidths = columns.map((col) => col.width * tableW);
  const headerRows = opts.headerRows ?? 1;
  const rowPad = opts.tableRowPad ?? LAYOUT.tableRowPad;

  return opts.rows.map((row, rowIndex) => {
    const isHeader = rowIndex < headerRows;
    let maxH = (opts.bodyFontSize ?? LAYOUT.tableBodySize) + rowPad * 2;
    columns.forEach((col, index) => {
      if (isTableColumnSpanned(columns, row, index)) return;
      const cell = row[col.key] ?? '';
      const { font, fontSize } = resolveTableCellStyle(opts, row, rowIndex, col);
      const h = doc.font(font).fontSize(fontSize).heightOfString(String(cell), {
        width: tableCellWidth(colWidths, columns, row, index) - TABLE_CONTAINER.cellPad * 2,
        lineGap: 0,
      });
      maxH = Math.max(maxH, h + rowPad * 2);
    });
    return maxH;
  });
}

function drawSectionTitle(doc, title, x, y, width) {
  doc
    .font(SEMINAR_FONTS.bold)
    .fontSize(LAYOUT.subsectionSize)
    .fillColor(SEMINAR_COLORS.body)
    .text(String(title || ''), x, y, { width, lineGap: 0 });
  return doc.y + LAYOUT.headerGap;
}

const STAPLES_LIST = {
  columnGap: 20,
  rowGap: 3,
  leaderPad: 4,
  ruleWidth: 0.75,
};

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

function drawStapleListRow(doc, item, x, y, width) {
  const name = String(item.name);
  const serving = String(item.serving);
  const pad = STAPLES_LIST.leaderPad;
  const lineH = LAYOUT.bodySize;

  doc.font(SEMINAR_FONTS.regular).fontSize(lineH).fillColor(SEMINAR_COLORS.body);

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

function drawStaplesColumn(doc, title, items, col, yStart, bottomY) {
  let y = drawSectionTitle(doc, title, col.x, yStart, col.width);
  return drawStapleListItems(doc, items, col, y, bottomY).nextIndex;
}

function staplesForPayload(items, category, payload) {
  const servings = stapleCategoryServings(payload.servings?.planServings, category);
  return scaleStapleRows(items, servings);
}

function drawStaplesFoodListPage(doc, payload) {
  const proteinItems = staplesForPayload(CUTTING_STAPLES_PROTEIN_DAIRY, 'protein', payload);
  const grainItems = staplesForPayload(CUTTING_STAPLES_GRAINS_STARCHES, 'grains', payload);

  let page = startLockedPage(doc, payload, 'Food List');
  const columns = staplesColumnLayout(page);
  const ruleX = columns[0].x + columns[0].width + STAPLES_LIST.columnGap / 2;
  drawStaplesColumnRule(doc, ruleX, page.y, page.bottom);
  drawStaplesColumn(doc, 'Protein Staples', proteinItems, columns[0], page.y, page.bottom);

  let gsTitleY = drawSectionTitle(doc, 'Grains & Starches', columns[1].x, page.y, columns[1].width);
  let gsIndex = 0;
  let result = drawStapleListItems(
    doc,
    grainItems,
    columns[1],
    gsTitleY,
    page.bottom,
    gsIndex,
  );
  gsIndex = result.nextIndex;

  while (gsIndex < grainItems.length) {
    finishLockedPage(doc, page.box, payload);
    page = startLockedPage(doc, payload, null);
    drawStaplesColumnRule(doc, ruleX, page.y, page.bottom);
    result = drawStapleListItems(
      doc,
      grainItems,
      columns[1],
      page.y,
      page.bottom,
      gsIndex,
    );
    gsIndex = result.nextIndex;
  }

  if (gsIndex !== grainItems.length) {
    throw new Error(`Grains/starches list truncated: drew ${gsIndex} of ${grainItems.length}`);
  }

  finishLockedPage(doc, page.box, payload);
}

function drawVegFruitFoodListPage(doc, payload) {
  const vegetableItems = staplesForPayload(CUTTING_STAPLES_VEGETABLES, 'vegetable', payload);
  const fruitItems = staplesForPayload(CUTTING_STAPLES_FRUIT, 'fruit', payload);

  let vegIndex = 0;
  let fruitIndex = 0;
  let firstPage = true;

  while (vegIndex < vegetableItems.length || fruitIndex < fruitItems.length) {
    const page = startLockedPage(doc, payload, firstPage ? 'Food List' : null);
    firstPage = false;
    const columns = staplesColumnLayout(page);
    const ruleX = columns[0].x + columns[0].width + STAPLES_LIST.columnGap / 2;
    drawStaplesColumnRule(doc, ruleX, page.y, page.bottom);

    if (vegIndex < vegetableItems.length) {
      let y = page.y;
      if (vegIndex === 0) {
        y = drawSectionTitle(doc, 'Vegetables', columns[0].x, y, columns[0].width);
      }
      vegIndex = drawStapleListItems(
        doc,
        vegetableItems,
        columns[0],
        y,
        page.bottom,
        vegIndex,
      ).nextIndex;
    }

    if (fruitIndex < fruitItems.length) {
      let y = page.y;
      if (fruitIndex === 0) {
        y = drawSectionTitle(doc, 'Fruit', columns[1].x, y, columns[1].width);
      }
      fruitIndex = drawStapleListItems(
        doc,
        fruitItems,
        columns[1],
        y,
        page.bottom,
        fruitIndex,
      ).nextIndex;
    }

    finishLockedPage(doc, page.box, payload);
  }

  if (vegIndex !== vegetableItems.length) {
    throw new Error(`Vegetable list truncated: drew ${vegIndex} of ${vegetableItems.length}`);
  }
  if (fruitIndex !== fruitItems.length) {
    throw new Error(`Fruit list truncated: drew ${fruitIndex} of ${fruitItems.length}`);
  }
}

const PANEL_BULLET = { indent: 12, gap: 3, kitGap: 8 };
/** PDFKit line-box slack so measure matches draw (avoids 1px truncation). */
const PANEL_MEASURE_SLACK = 8;

function measurePanelBullets(doc, items, width) {
  doc.font(SEMINAR_FONTS.regular).fontSize(LAYOUT.bodySize);
  return items.reduce((sum, item) => {
    const line = `\u2022 ${item}`;
    return sum + Math.max(
      LAYOUT.bodySize + PANEL_BULLET.gap,
      doc.heightOfString(line, { width: width - PANEL_BULLET.indent, lineGap: 0 }) + PANEL_BULLET.gap,
    );
  }, 0);
}

function measurePanelSection(doc, title, items, innerWidth) {
  doc.font(SEMINAR_FONTS.bold).fontSize(LAYOUT.subsectionSize);
  let h = doc.heightOfString(title, { width: innerWidth, lineGap: 0 }) + LAYOUT.headerGap;
  h += measurePanelBullets(doc, items, innerWidth);
  return h;
}

/** @param {import('pdfkit')} doc @param {ReadonlyArray<{ label: string, flavors: readonly string[] }>} kits */
function measureFlavorKitsColumn(doc, kits, innerWidth) {
  doc.font(SEMINAR_FONTS.bold).fontSize(LAYOUT.subsectionSize);
  let h = doc.heightOfString('Flavor Kits', { width: innerWidth, lineGap: 0 }) + LAYOUT.headerGap;
  kits.forEach((kit, index) => {
    doc.font(SEMINAR_FONTS.bold).fontSize(LAYOUT.bodySize);
    h += doc.heightOfString(kit.label, { width: innerWidth, lineGap: 0 }) + 4;
    h += measurePanelBullets(doc, kit.flavors, innerWidth);
    if (index < kits.length - 1) h += PANEL_BULLET.kitGap;
  });
  return h + PANEL_MEASURE_SLACK;
}

function drawPanelBullets(doc, items, x, y, width, bottomY) {
  doc.font(SEMINAR_FONTS.regular).fontSize(LAYOUT.bodySize).fillColor(SEMINAR_COLORS.body);
  for (const item of items) {
    const line = `\u2022 ${item}`;
    const blockH = Math.max(
      LAYOUT.bodySize + PANEL_BULLET.gap,
      doc.heightOfString(line, { width: width - PANEL_BULLET.indent, lineGap: 0 }) + PANEL_BULLET.gap,
    );
    if (y + blockH > bottomY) throw new Error(`Panel list truncated near "${item}"`);
    doc.text('\u2022', x, y, { lineBreak: false });
    doc.text(String(item), x + PANEL_BULLET.indent, y, {
      width: width - PANEL_BULLET.indent,
      lineGap: 0,
    });
    y += blockH;
  }
  return y;
}

function drawPanelSectionTitle(doc, title, x, y, width) {
  doc
    .font(SEMINAR_FONTS.bold)
    .fontSize(LAYOUT.subsectionSize)
    .fillColor(SEMINAR_COLORS.body)
    .text(title, x, y, { width, lineGap: 0 });
  return doc.y + LAYOUT.headerGap;
}

/** @param {import('pdfkit')} doc @param {ReadonlyArray<{ label: string, flavors: readonly string[] }>} kits */
function drawFlavorKitsColumn(doc, kits, x, y, width, bottomY) {
  let cy = drawPanelSectionTitle(doc, 'Flavor Kits', x, y, width);
  kits.forEach((kit, index) => {
    doc
      .font(SEMINAR_FONTS.bold)
      .fontSize(LAYOUT.bodySize)
      .fillColor(SEMINAR_COLORS.body)
      .text(kit.label, x, cy, { width, lineGap: 0 });
    cy = doc.y + 4;
    cy = drawPanelBullets(doc, kit.flavors, x, cy, width, bottomY);
    if (index < kits.length - 1) cy += PANEL_BULLET.kitGap;
  });
  return cy;
}

function drawPanelNote(doc, text, x, y, width) {
  doc
    .font(SEMINAR_FONTS.regular)
    .fontSize(LAYOUT.bodySize - 0.5)
    .fillColor(SEMINAR_COLORS.body)
    .text(String(text), x, y, { width, lineGap: LAYOUT.lineGap });
  return doc.y + LAYOUT.paragraphGap;
}

function measurePanelNote(doc, text, width) {
  doc.font(SEMINAR_FONTS.regular).fontSize(LAYOUT.bodySize - 0.5);
  return doc.heightOfString(String(text), { width, lineGap: LAYOUT.lineGap });
}

/** PDF page 7 — seasonings & splashes: flavor kits | splashes | pantry. */
function drawFlavorKitsPage(doc, payload) {
  const page = startLockedPage(doc, payload, 'Seasonings and Splashes');
  const kits = flavorKitList();
  const pad = TABLE_CONTAINER.cellPad;
  const colW = page.width / 3;
  const innerW = colW - pad * 2;

  const colHeights = [
    pad * 2 + measureFlavorKitsColumn(doc, kits, innerW),
    pad * 2 + measurePanelSection(doc, 'Splashes', COMMON_SPLASHES, innerW),
    pad * 2 + measurePanelSection(doc, 'Pantry', GROCERY_STAPLES_PANTRY, innerW),
  ];
  const footerH = LAYOUT.sectionGap
    + measurePanelNote(doc, FLAVOR_KIT_RULE, page.width)
    + LAYOUT.paragraphGap
    + measurePanelNote(doc, SPLASH_RULE, page.width);
  const maxPanelH = page.bottom - page.y - footerH;
  const panelH = Math.min(Math.max(...colHeights), maxPanelH);

  if (panelH < Math.max(...colHeights)) {
    throw new Error('Seasonings and Splashes panel does not fit below page title');
  }

  const panelBottom = page.y + panelH;

  doc
    .strokeColor(TABLE_CONTAINER.stroke)
    .lineWidth(1.25)
    .roundedRect(page.x, page.y, page.width, panelH, TABLE_CONTAINER.radius)
    .stroke();

  const ruleTop = page.y + TABLE_CONTAINER.radius * 0.5;
  const ruleBottom = page.y + panelH - TABLE_CONTAINER.radius * 0.5;
  [1, 2].forEach((index) => {
    const ruleX = page.x + colW * index;
    doc
      .strokeColor(TABLE_CONTAINER.stroke)
      .lineWidth(STAPLES_LIST.ruleWidth)
      .moveTo(ruleX, ruleTop)
      .lineTo(ruleX, ruleBottom)
      .stroke();
  });

  const colXs = [page.x + pad, page.x + colW + pad, page.x + colW * 2 + pad];
  drawFlavorKitsColumn(doc, kits, colXs[0], page.y + pad, innerW, panelBottom - pad);

  let cy = drawPanelSectionTitle(doc, 'Splashes', colXs[1], page.y + pad, innerW);
  drawPanelBullets(doc, COMMON_SPLASHES, colXs[1], cy, innerW, panelBottom - pad);

  cy = drawPanelSectionTitle(doc, 'Pantry', colXs[2], page.y + pad, innerW);
  drawPanelBullets(doc, GROCERY_STAPLES_PANTRY, colXs[2], cy, innerW, panelBottom - pad);

  let y = panelBottom + LAYOUT.sectionGap;
  y = drawPanelNote(doc, FLAVOR_KIT_RULE, page.x, y, page.width);
  y += LAYOUT.paragraphGap;
  drawPanelNote(doc, SPLASH_RULE, page.x, y, page.width);

  finishLockedPage(doc, page.box, payload);
}

function drawLayoutTable(doc, opts) {
  const columns = opts.columns;
  const headerRows = opts.headerRows ?? 1;
  const rowPad = opts.tableRowPad ?? LAYOUT.tableRowPad;
  const tableX = opts.x;
  const tableY = opts.y;
  const tableW = opts.width;
  const colWidths = columns.map((col) => col.width * tableW);
  const rowHeights = layoutTableRowHeights(doc, { ...opts, width: tableW });
  const totalH = rowHeights.reduce((sum, h) => sum + h, 0);
  const pad = TABLE_CONTAINER.cellPad;

  doc
    .strokeColor(TABLE_CONTAINER.stroke)
    .lineWidth(1.25)
    .roundedRect(tableX, tableY, tableW, totalH, TABLE_CONTAINER.radius)
    .stroke();

  let cy = tableY;
  opts.rows.forEach((row, rowIndex) => {
    const rh = rowHeights[rowIndex];
    let cx = tableX;
    columns.forEach((col, index) => {
      if (isTableColumnSpanned(columns, row, index)) return;
      const w = tableCellWidth(colWidths, columns, row, index);
      const { font, fontSize } = resolveTableCellStyle(opts, row, rowIndex, col);
      doc
        .font(font)
        .fontSize(fontSize)
        .fillColor(SEMINAR_COLORS.body)
        .text(String(row[col.key] ?? ''), cx + pad, cy + rowPad, {
          width: w - pad * 2,
          lineGap: 0,
          align: col.align || 'left',
        });
      cx += w;
    });
    cy += rh;
    if (rowIndex < opts.rows.length - 1) {
      doc
        .strokeColor(TABLE_CONTAINER.stroke)
        .lineWidth(0.5)
        .moveTo(tableX + TABLE_CONTAINER.radius, cy)
        .lineTo(tableX + tableW - TABLE_CONTAINER.radius, cy)
        .stroke();
    }
  });

  return tableY + totalH;
}

function beginLockedPage(doc, payload, pageTitle, { fullHeader = false } = {}) {
  const box = addFramePage(doc);
  const topGoldY = fullHeader
    ? drawPersonalizationHeader(doc, payload, box)
    : drawContinuationHeader(doc, box);

  const bottom = pinnedContentBottomY(box);
  let y = fullHeader ? framePageTitleStartY(topGoldY) : topGoldY + 16;
  if (pageTitle) {
    y = drawFramePageTitle(doc, pageTitle, box.x, y, box.width, {
      size: PT.pageTitle,
      gapAfter: PT.titleBottomGap,
    });
  }
  return { box, x: box.x, y, width: box.width, bottom };
}

function finishLockedPage(_doc, _box, _payload) {
  /* Footers stamped once after all pages — see stampPinnedProgramFooters */
}

function startLockedPage(doc, payload, pageTitle, { fullHeader = false } = {}) {
  return beginLockedPage(doc, payload, pageTitle, { fullHeader });
}

function ensureLockedSpace(doc, payload, page, needed, { fullHeader = false } = {}) {
  if (page.y + needed <= page.bottom) return page;
  finishLockedPage(doc, page.box, payload);
  return startLockedPage(doc, payload, null, { fullHeader });
}

function drawWelcomePage(doc, payload) {
  let page = startLockedPage(doc, payload, 'Welcome', { fullHeader: true });
  const guide = {
    bodySize: 9.5,
    titleSize: 10.5,
    lineGap: 2,
    paragraphGap: 6,
    headerGap: 4,
    sectionGap: 6,
  };

  page = drawBodyParagraphs(doc, payload, page, payload.welcome.intro, {
    fullHeader: true,
    pageTitle: 'Welcome',
  });
  page = { ...page, y: page.y + guide.sectionGap };

  const sections = [
    ['Lean Body Analysis', payload.welcome.leanBodyAnalysis],
    ['Projections', payload.welcome.projections],
    ['Food Plan', payload.welcome.foodPlan],
    ['Servings', payload.welcome.servings],
  ].filter(([, body]) => body);

  sections.forEach(([title, body], index) => {
    doc.font(SEMINAR_FONTS.bold).fontSize(guide.titleSize);
    const blockH = guide.titleSize + guide.headerGap
      + doc.heightOfString(String(body), { width: page.width, lineGap: guide.lineGap })
      + guide.paragraphGap;
    page = ensureLockedSpace(doc, payload, page, blockH, { fullHeader: true });
    doc
      .font(SEMINAR_FONTS.bold)
      .fontSize(guide.titleSize)
      .fillColor(SEMINAR_COLORS.body)
      .text(String(title), page.x, page.y, { width: page.width, lineGap: 0 });
    page = { ...page, y: doc.y + guide.headerGap };
    doc
      .font(SEMINAR_FONTS.regular)
      .fontSize(guide.bodySize)
      .fillColor(SEMINAR_COLORS.body)
      .text(String(body), page.x, page.y, {
        width: page.width,
        lineGap: guide.lineGap,
        align: 'left',
      });
    page = { ...page, y: doc.y + guide.paragraphGap };
    if (index < sections.length - 1) {
      page = { ...page, y: page.y + guide.sectionGap };
    }
  });

  finishLockedPage(doc, page.box, payload);
}

function measureLayoutTable(doc, opts) {
  return layoutTableRowHeights(doc, opts).reduce((sum, h) => sum + h, 0);
}

const PROJECTION_TABLE_HEAD_SIZE = PT.body * 1.5 * 0.75;

function projectionTimelineRowStyle(row, rowIndex, { isHeader }) {
  if (isHeader) {
    return { font: SEMINAR_FONTS.bold, fontSize: PROJECTION_TABLE_HEAD_SIZE };
  }
  if (row.isCurrent) {
    return { font: SEMINAR_FONTS.bold, fontSize: PT.body };
  }
  if (row.badge === 'Average') {
    return { font: SEMINAR_FONTS.italic, fontSize: PT.subsection };
  }
  return { font: SEMINAR_FONTS.regular, fontSize: PT.subsection };
}

function buildProjectionSummaryTableOpts(projections, x, y, width) {
  return {
    x,
    y,
    width,
    keys: ['fatLoss', 'bodyFat', 'timeline'],
    rows: [
      { fatLoss: 'FAT LOSS', bodyFat: 'BODY FAT %', timeline: 'TIMELINE' },
      {
        fatLoss: fatCanInlineCell(),
        bodyFat: `${projections.startBf}% to ${projections.endBf}%`,
        timeline: '8 weeks',
      },
    ],
    headerRows: 1,
    getRowStyle: projectionTimelineRowStyle,
  };
}

function measureProjectionSummaryTable(doc, projections, width) {
  return measureProjectionTimelineTable(doc, buildProjectionSummaryTableOpts(projections, 0, 0, width))
    .reduce((sum, h) => sum + h, 0);
}

function measureProjectionTimelineTable(doc, opts) {
  const pad = TABLE_CONTAINER.cellPad;
  const colW = opts.width / 3;
  const innerW = colW - pad * 2;
  const keys = opts.keys ?? ['weight', 'timeline', 'bodyFat'];

  return opts.rows.map((row, rowIndex) => {
    const isHeader = rowIndex < (opts.headerRows ?? 1);
    let maxH = LAYOUT.tableRowPad * 2;
    keys.forEach((key) => {
      const content = row[key];
      if (isInlineImagesCell(content)) {
        maxH = Math.max(maxH, measureInlineImagesCell(doc, content, innerW) + LAYOUT.tableRowPad * 2);
        return;
      }
      const style = resolveCenteredTableCellStyle(opts, row, rowIndex, key, { isHeader });
      const h = doc.font(style.font).fontSize(style.fontSize).heightOfString(String(content ?? ''), {
        width: innerW,
        align: 'center',
        lineGap: 0,
      });
      maxH = Math.max(maxH, h + LAYOUT.tableRowPad * 2);
    });
    return maxH;
  });
}

function resolveCenteredTableCellStyle(opts, row, rowIndex, colKey, { isHeader }) {
  if (typeof opts.getCellStyle === 'function') {
    return opts.getCellStyle(row, rowIndex, colKey, { isHeader });
  }
  if (typeof opts.getRowStyle === 'function') {
    return opts.getRowStyle(row, rowIndex, { isHeader });
  }
  return { font: SEMINAR_FONTS.regular, fontSize: PT.subsection };
}

function drawCenteredTableCell(doc, text, cellX, cellY, cellW, cellH, { font, fontSize }) {
  const pad = TABLE_CONTAINER.cellPad;
  const innerW = cellW - pad * 2;
  const str = String(text ?? '');
  doc.font(font).fontSize(fontSize).fillColor(SEMINAR_COLORS.body);

  const lineH = doc.currentLineHeight();
  const singleLine = !str.includes('\n') && doc.widthOfString(str) <= innerW;
  if (singleLine) {
    const textX = cellX + (cellW - doc.widthOfString(str)) / 2;
    const textY = cellY + (cellH - lineH) / 2;
    doc.text(str, textX, textY, { lineBreak: false });
    return;
  }

  const textH = doc.heightOfString(str, { width: innerW, align: 'center', lineGap: 0 });
  const textY = cellY + (cellH - textH) / 2;
  doc.text(str, cellX + pad, textY, {
    width: innerW,
    align: 'center',
    lineGap: 0,
  });
}

function drawProjectionTimelineTable(doc, opts) {
  const tableX = opts.x;
  const tableY = opts.y;
  const tableW = opts.width;
  const colW = tableW / 3;
  const keys = opts.keys ?? ['weight', 'timeline', 'bodyFat'];
  const rowHeights = measureProjectionTimelineTable(doc, opts);
  const totalH = rowHeights.reduce((sum, h) => sum + h, 0);
  const headerRows = opts.headerRows ?? 1;

  doc
    .strokeColor(TABLE_CONTAINER.stroke)
    .lineWidth(1.25)
    .roundedRect(tableX, tableY, tableW, totalH, TABLE_CONTAINER.radius)
    .stroke();

  const ruleTop = tableY + TABLE_CONTAINER.radius * 0.5;
  const ruleBottom = tableY + totalH - TABLE_CONTAINER.radius * 0.5;
  for (let i = 1; i < 3; i += 1) {
    const ruleX = tableX + colW * i;
    doc
      .strokeColor(TABLE_CONTAINER.stroke)
      .lineWidth(STAPLES_LIST.ruleWidth)
      .moveTo(ruleX, ruleTop)
      .lineTo(ruleX, ruleBottom)
      .stroke();
  }

  let cy = tableY;
  opts.rows.forEach((row, rowIndex) => {
    const rh = rowHeights[rowIndex];
    const isHeader = rowIndex < headerRows;
    keys.forEach((key, index) => {
      const cellX = tableX + colW * index;
      const content = row[key];
      if (isInlineImagesCell(content)) {
        drawInlineImagesCell(doc, content, cellX, cy, colW, rh);
        return;
      }
      const style = resolveCenteredTableCellStyle(opts, row, rowIndex, key, { isHeader });
      drawCenteredTableCell(doc, content, cellX, cy, colW, rh, style);
    });
    cy += rh;
    if (rowIndex < opts.rows.length - 1) {
      doc
        .strokeColor(TABLE_CONTAINER.stroke)
        .lineWidth(0.5)
        .moveTo(tableX + TABLE_CONTAINER.radius, cy)
        .lineTo(tableX + tableW - TABLE_CONTAINER.radius, cy)
        .stroke();
    }
  });

  return tableY + totalH;
}

const MACRO_SIGNAL_TABLE_KEYS = ['macro', 'tooMuch', 'tooLittle'];

function buildMacroSignalLayoutRows(macroRows = []) {
  return [
    { macro: 'THE MACROS', tooMuch: 'TOO MUCH', tooLittle: 'TOO LITTLE' },
    ...macroRows.map((row) => ({
      macro: row.label,
      tooMuch: row.tooMuch,
      tooLittle: row.tooLittle,
      emphasizeTooLittle: Boolean(row.emphasizeTooLittle),
    })),
  ];
}

function macroSignalCellStyle(row, rowIndex, colKey, { isHeader }) {
  if (isHeader) {
    return { font: SEMINAR_FONTS.bold, fontSize: PROJECTION_TABLE_HEAD_SIZE };
  }
  if (colKey === 'tooLittle' && row.emphasizeTooLittle) {
    return { font: SEMINAR_FONTS.bold, fontSize: PROJECTION_TABLE_HEAD_SIZE };
  }
  if (colKey === 'macro') {
    return { font: SEMINAR_FONTS.bold, fontSize: PT.body };
  }
  return { font: SEMINAR_FONTS.regular, fontSize: PT.subsection };
}

function measureMacroSignalLayoutTable(doc, width, macroRows = []) {
  return measureProjectionTimelineTable(doc, {
    width,
    keys: MACRO_SIGNAL_TABLE_KEYS,
    rows: buildMacroSignalLayoutRows(macroRows),
    getCellStyle: macroSignalCellStyle,
  }).reduce((sum, h) => sum + h, 0);
}

function drawMacroSignalLayoutTable(doc, { x, y, width, rows }) {
  return drawProjectionTimelineTable(doc, {
    x,
    y,
    width,
    keys: MACRO_SIGNAL_TABLE_KEYS,
    rows: buildMacroSignalLayoutRows(rows),
    getCellStyle: macroSignalCellStyle,
  });
}

function measureProjectionTimelineTableHeight(doc, opts) {
  return measureProjectionTimelineTable(doc, opts).reduce((sum, h) => sum + h, 0);
}

function buildProjectionsInputGridRows(fp) {
  const hours = fp.introHours || {};
  return [
    [
      {
        type: 'metric',
        label: 'LBM',
        value: fp.inputGrid?.lbm ?? fp.lbmLbs ?? '—',
        unit: 'lbs',
      },
      {
        type: 'choice',
        title: 'JOB',
        selectedId: fp.workPhysical,
        options: QUESTIONNAIRE_JOB_OPTIONS,
      },
      {
        type: 'choice',
        title: 'DAY TO DAY',
        selectedId: fp.workStress,
        options: WORK_STRESS,
      },
    ],
    [
      {
        type: 'metric',
        label: 'WT',
        value: fp.inputGrid?.wt ?? hours.wt ?? '—',
        unit: 'hours per week',
      },
      {
        type: 'metric',
        label: 'HHT',
        value: fp.inputGrid?.hht ?? hours.cardio ?? '—',
        unit: 'hours per week',
      },
      {
        type: 'metric',
        label: 'LHR',
        value: fp.inputGrid?.lhr ?? hours.fatBurn ?? '—',
        unit: 'hours per week',
      },
    ],
  ];
}

const INPUT_GRID = {
  cellPad: 5,
  cellPadTop: 7,
  /** All 6 cell titles (LBM, JOB, …) — one size, bold. */
  titleFont: SEMINAR_FONTS.bold,
  titleSize: PROJECTION_TABLE_HEAD_SIZE,
  /** Match projection table data rows (184 lbs, Current, …). */
  textSize: PT.subsection,
  labelGap: 3,
};

function measureInputGridTitle(doc, text, innerW) {
  doc.font(INPUT_GRID.titleFont).fontSize(INPUT_GRID.titleSize);
  return doc.heightOfString(String(text), { width: innerW, align: 'center', lineGap: 0 });
}

function drawInputGridTitle(doc, text, x, y, innerW) {
  doc
    .font(INPUT_GRID.titleFont)
    .fontSize(INPUT_GRID.titleSize)
    .fillColor(SEMINAR_COLORS.body)
    .text(String(text), x + INPUT_GRID.cellPad, y, { width: innerW, align: 'center', lineGap: 0 });
}

function choiceCellFontSize(doc, cell, innerW) {
  const { textSize } = INPUT_GRID;
  const slotW = innerW / cell.options.length;
  let size = textSize;
  while (size > 6) {
    let fits = true;
    cell.options.forEach((option) => {
      const font = option.id === cell.selectedId ? SEMINAR_FONTS.bold : SEMINAR_FONTS.regular;
      doc.font(font).fontSize(size);
      if (doc.widthOfString(option.label) > slotW - 4) fits = false;
    });
    if (fits) return size;
    size -= 0.25;
  }
  return 6;
}

/** Column 2 (JOB) sets choice content size — column 3 (DAY TO DAY) matches it. */
function choiceRowFontSize(doc, row, innerW) {
  const jobCell = row.find((cell) => cell.type === 'choice' && cell.title === 'JOB');
  if (!jobCell) return INPUT_GRID.textSize;
  return choiceCellFontSize(doc, jobCell, innerW);
}

function measureChoiceOptionRow(doc, optionSize) {
  doc.font(SEMINAR_FONTS.regular).fontSize(optionSize);
  return doc.currentLineHeight();
}

function drawChoiceOptionRow(doc, cell, x, y, innerW, optionSize) {
  const slotW = innerW / cell.options.length;
  cell.options.forEach((option, index) => {
    const selected = option.id === cell.selectedId;
    const font = selected ? SEMINAR_FONTS.bold : SEMINAR_FONTS.regular;
    doc.font(font).fontSize(optionSize);
    const labelW = doc.widthOfString(option.label);
    const startX = x + slotW * index + (slotW - labelW) / 2;
    doc
      .font(font)
      .fontSize(optionSize)
      .fillColor(SEMINAR_COLORS.body)
      .text(option.label, startX, y, { lineBreak: false });
  });
}

function metricValueLine(cell) {
  return `${cell.value} ${cell.unit}`;
}

function metricCellTypography() {
  return {
    labelFont: INPUT_GRID.titleFont,
    labelSize: INPUT_GRID.titleSize,
    valueFont: SEMINAR_FONTS.regular,
    valueSize: INPUT_GRID.textSize,
    labelGap: INPUT_GRID.labelGap,
  };
}

function metricValueFontSize(doc, text, innerW, minSize = 6) {
  const { textSize } = INPUT_GRID;
  let size = textSize;
  while (size > minSize) {
    doc.font(SEMINAR_FONTS.regular).fontSize(size);
    if (doc.widthOfString(text) <= innerW) return size;
    size -= 0.25;
  }
  return minSize;
}

function measureMetricInputCell(doc, cell, innerW, valueSize) {
  const { labelGap } = metricCellTypography(cell);
  const labelH = measureInputGridTitle(doc, cell.label, innerW);
  const size = valueSize ?? metricValueFontSize(doc, metricValueLine(cell), innerW);
  doc.font(SEMINAR_FONTS.regular).fontSize(size);
  return labelH + labelGap + doc.currentLineHeight();
}

function measureChoiceInputCell(doc, cell, innerW, optionSize) {
  const titleH = measureInputGridTitle(doc, cell.title, innerW);
  return titleH + INPUT_GRID.labelGap + measureChoiceOptionRow(doc, optionSize);
}

function measureInputCell(doc, cell, innerW, opts = {}) {
  if (cell.type === 'choice') return measureChoiceInputCell(doc, cell, innerW, opts.choiceOptionSize);
  return measureMetricInputCell(doc, cell, innerW, opts.metricValueSize);
}

function measureProjectionsInputGrid(doc, fp, width) {
  const pad = INPUT_GRID.cellPad;
  const padTop = INPUT_GRID.cellPadTop;
  const colW = width / 3;
  const innerW = colW - pad * 2;
  const rows = buildProjectionsInputGridRows(fp);
  const choiceOptionSize = choiceRowFontSize(doc, rows[0], innerW);
  const rowHeights = rows.map((row, rowIndex) => {
    let maxH = padTop + pad;
    const cellOpts = rowIndex === 1
      ? { metricValueSize: choiceOptionSize }
      : { choiceOptionSize };
    row.forEach((cell) => {
      maxH = Math.max(maxH, padTop + pad + measureInputCell(doc, cell, innerW, cellOpts));
    });
    return maxH;
  });
  return rowHeights.reduce((sum, h) => sum + h, 0);
}

function drawChoiceInputCell(doc, cell, x, y, innerW, cellH, optionSize) {
  const pad = INPUT_GRID.cellPad;
  const contentH = measureChoiceInputCell(doc, cell, innerW, optionSize);
  let cy = y + (cellH - contentH) / 2;
  drawInputGridTitle(doc, cell.title, x, cy, innerW);
  const optionsY = doc.y + INPUT_GRID.labelGap;
  drawChoiceOptionRow(doc, cell, x + pad, optionsY, innerW, optionSize);
}

function drawMetricInputCell(doc, cell, x, y, innerW, cellH, valueSize) {
  const pad = INPUT_GRID.cellPad;
  const { labelGap } = metricCellTypography(cell);
  const valueLine = metricValueLine(cell);
  const resolvedValueSize = valueSize ?? metricValueFontSize(doc, valueLine, innerW);
  const contentH = measureMetricInputCell(doc, cell, innerW, resolvedValueSize);
  let cy = y + (cellH - contentH) / 2;
  drawInputGridTitle(doc, cell.label, x, cy, innerW);
  const valueY = doc.y + labelGap;
  doc.font(SEMINAR_FONTS.regular).fontSize(resolvedValueSize).fillColor(SEMINAR_COLORS.body);
  const valueW = doc.widthOfString(valueLine);
  const valueX = x + pad + (innerW - valueW) / 2;
  doc.text(valueLine, valueX, valueY, { lineBreak: false });
}

function drawInputCell(doc, cell, x, y, innerW, cellH, opts = {}) {
  if (cell.type === 'choice') {
    drawChoiceInputCell(doc, cell, x, y, innerW, cellH, opts.choiceOptionSize);
    return;
  }
  drawMetricInputCell(doc, cell, x, y, innerW, cellH, opts.metricValueSize);
}

function drawProjectionsInputGrid(doc, fp, x, y, width) {
  const pad = INPUT_GRID.cellPad;
  const colW = width / 3;
  const innerW = colW - pad * 2;
  const rows = buildProjectionsInputGridRows(fp);
  const choiceOptionSize = choiceRowFontSize(doc, rows[0], innerW);
  const rowHeights = rows.map((row, rowIndex) => {
    const cellOpts = rowIndex === 1
      ? { metricValueSize: choiceOptionSize }
      : { choiceOptionSize };
    let maxH = pad * 2;
    row.forEach((cell) => {
      maxH = Math.max(maxH, pad * 2 + measureInputCell(doc, cell, innerW, cellOpts));
    });
    return maxH;
  });
  const totalH = rowHeights.reduce((sum, h) => sum + h, 0);

  doc
    .strokeColor(TABLE_CONTAINER.stroke)
    .lineWidth(1.25)
    .roundedRect(x, y, width, totalH, TABLE_CONTAINER.radius)
    .stroke();

  const ruleTop = y + TABLE_CONTAINER.radius * 0.5;
  const ruleBottom = y + totalH - TABLE_CONTAINER.radius * 0.5;
  [1, 2].forEach((index) => {
    const ruleX = x + colW * index;
    doc
      .strokeColor(TABLE_CONTAINER.stroke)
      .lineWidth(STAPLES_LIST.ruleWidth)
      .moveTo(ruleX, ruleTop)
      .lineTo(ruleX, ruleBottom)
      .stroke();
  });

  let rowY = y;
  rows.forEach((row, rowIndex) => {
    const rowH = rowHeights[rowIndex];
    const cellOpts = rowIndex === 1
      ? { metricValueSize: choiceOptionSize }
      : { choiceOptionSize };
    row.forEach((cell, colIndex) => {
      const cellX = x + colW * colIndex;
      drawInputCell(doc, cell, cellX, rowY, innerW, rowH, cellOpts);
    });
    rowY += rowH;
    if (rowIndex < rows.length - 1) {
      doc
        .strokeColor(TABLE_CONTAINER.stroke)
        .lineWidth(0.5)
        .moveTo(x + TABLE_CONTAINER.radius, rowY)
        .lineTo(x + width - TABLE_CONTAINER.radius, rowY)
        .stroke();
    }
  });

  return y + totalH;
}

function measureFoodPlanInputBlock(doc, fp, width) {
  return measureProjectionsInputGrid(doc, fp, width) + LAYOUT.sectionGap;
}

function drawFoodPlanInputBlock(doc, payload, page) {
  const fp = payload.foodPlan;
  if (!fp) return page;

  page = ensureLockedSpace(doc, payload, page, measureFoodPlanInputBlock(doc, fp, page.width));
  page = {
    ...page,
    y: drawProjectionsInputGrid(doc, fp, page.x, page.y, page.width) + LAYOUT.sectionGap,
  };

  return page;
}

function drawProjectionsPage(doc, payload) {
  const projections = payload.projections;
  if (!projections) return;

  let page = startLockedPage(doc, payload, 'Projections');

  if (projections.fatLostLbs && projections.startBf && projections.endBf) {
    const summaryH = measureProjectionSummaryTable(doc, projections, page.width) + LAYOUT.sectionGap;
    page = ensureLockedSpace(doc, payload, page, summaryH);
    const summaryOpts = buildProjectionSummaryTableOpts(projections, page.x, page.y, page.width);
    page = {
      ...page,
      y: drawProjectionTimelineTable(doc, summaryOpts) + LAYOUT.sectionGap,
    };
  }

  page = drawBodyParagraphs(doc, payload, page, [projections.intro]);

  page = drawFoodPlanInputBlock(doc, payload, page);

  if (projections.rmrBridge) {
    page = drawBodyParagraphs(doc, payload, page, [projections.rmrBridge]);
  }

  if (projections.timelineRows.length) {
    const timelineTableOpts = {
      x: page.x,
      y: page.y,
      width: page.width,
      rows: [
        { weight: 'BODYWEIGHT', timeline: 'TIMELINE', bodyFat: 'BODY FAT %' },
        ...projections.timelineRows.map((row) => ({
          weight: row.weight,
          timeline: row.timeline,
          bodyFat: row.bodyFat,
          isCurrent: row.isCurrent,
          badge: row.badge,
        })),
      ],
      headerRows: 1,
      getRowStyle: projectionTimelineRowStyle,
    };
    page = ensureLockedSpace(doc, payload, page, measureProjectionTimelineTableHeight(doc, timelineTableOpts));
    timelineTableOpts.y = page.y;
    page = { ...page, y: drawProjectionTimelineTable(doc, timelineTableOpts) + LAYOUT.sectionGap };
  }

  finishLockedPage(doc, page.box, payload);
}

const BODY_FAT_PROGRESS_BAR = Object.freeze({
  titleSize: 11,
  subtitleSize: 8,
  barHeight: 30,
  barRadius: 6,
  segmentGreys: ['#8a8a8a', '#767676', '#626262', '#4e4e4e'],
  capLabelSize: 8,
  markerLabelSize: 10,
  markerH: 5,
  categorySize: 7,
  iconSize: 11,
  iconGap: 3,
  braceSize: 10,
  footerSize: 9,
  footerPad: 10,
  sectionGap: 10,
});

function bfToBarX(x, width, bf, scaleMax) {
  const clamped = Math.max(0, Math.min(Number(bf), scaleMax));
  return x + (clamped / scaleMax) * width;
}

function measureBodyFatProgressBar(doc, width) {
  doc.font(SEMINAR_FONTS.bold).fontSize(BODY_FAT_PROGRESS_BAR.titleSize);
  const titleH = doc.heightOfString(BODY_FAT_PROGRESS_BAR_TITLE, { width, align: 'center' });
  doc.font(SEMINAR_FONTS.regular).fontSize(BODY_FAT_PROGRESS_BAR.subtitleSize);
  const subtitleH = doc.heightOfString(BODY_FAT_PROGRESS_BAR_SUBTITLE, { width, align: 'center' });
  doc.font(PDF_FRAME_FONTS.italic).fontSize(BODY_FAT_PROGRESS_BAR.footerSize);
  const footerH = doc.heightOfString(BODY_FAT_PROGRESS_BAR_FOOTER, {
    width: width - BODY_FAT_PROGRESS_BAR.footerPad * 2,
    align: 'center',
  });
  const categoryH = (
    BODY_FAT_PROGRESS_BAR.braceSize
    + BODY_FAT_PROGRESS_BAR.iconGap
    + BODY_FAT_PROGRESS_BAR.iconSize
    + BODY_FAT_PROGRESS_BAR.iconGap
    + BODY_FAT_PROGRESS_BAR.categorySize
  );
  return (
    titleH
    + 4
    + subtitleH
    + BODY_FAT_PROGRESS_BAR.sectionGap
    + BODY_FAT_PROGRESS_BAR.markerLabelSize
    + 4
    + BODY_FAT_PROGRESS_BAR.barHeight
    + 6
    + categoryH
    + BODY_FAT_PROGRESS_BAR.sectionGap
    + footerH
    + BODY_FAT_PROGRESS_BAR.footerPad * 2
    + LAYOUT.paragraphGap
  );
}

function drawProgressBarIcon(doc, kind, cx, cy, size, color) {
  const s = size / 2;
  doc.save().strokeColor(color).fillColor(color).lineWidth(1);
  switch (kind) {
    case 'Competition':
      doc.moveTo(cx - s, cy + s).lineTo(cx + s, cy - s).stroke();
      doc.moveTo(cx - s, cy - s).lineTo(cx + s, cy + s).stroke();
      break;
    case 'Peaking':
      doc.moveTo(cx - s, cy + s).lineTo(cx, cy - s).lineTo(cx + s, cy + s).closePath().stroke();
      doc.circle(cx + s * 0.55, cy - s * 0.75, 1.6).fill();
      break;
    case 'Prepping':
      doc.circle(cx - s * 0.85, cy, 1.8).fill();
      doc.circle(cx + s * 0.85, cy, 1.8).fill();
      doc.moveTo(cx - s * 0.55, cy).lineTo(cx + s * 0.55, cy).stroke();
      break;
    case 'Training':
      doc.moveTo(cx - s, cy + s * 0.2).quadraticCurveTo(cx, cy - s, cx + s, cy + s * 0.35).stroke();
      break;
    default:
      doc.circle(cx, cy, s * 0.55).stroke();
      for (let i = 0; i < 8; i += 1) {
        const a = (i / 8) * Math.PI * 2;
        doc.moveTo(cx + Math.cos(a) * s * 0.65, cy + Math.sin(a) * s * 0.65)
          .lineTo(cx + Math.cos(a) * s, cy + Math.sin(a) * s).stroke();
      }
      break;
  }
  doc.restore();
}

function drawBodyFatProgressBar(doc, page, bar) {
  const { x, y, width } = page;
  const { currentBf, scaleMax, zones, activeStage } = bar;
  if (!zones?.length || !scaleMax) return y;

  let cy = y;
  const gold = PDF_FRAME_COLORS.gold;

  doc.font(SEMINAR_FONTS.bold).fontSize(BODY_FAT_PROGRESS_BAR.titleSize);
  const titleParts = BODY_FAT_PROGRESS_BAR_TITLE.split(' ');
  const titleSilver = titleParts.slice(0, 2).join(' ');
  const titleGold = titleParts.slice(2).join(' ');
  const titleSilverW = doc.widthOfString(`${titleSilver} `);
  const titleTotalW = doc.widthOfString(BODY_FAT_PROGRESS_BAR_TITLE);
  const titleX = x + (width - titleTotalW) / 2;
  doc.fillColor('#888888').text(titleSilver, titleX, cy, { lineBreak: false });
  doc.fillColor(gold).text(titleGold, titleX + titleSilverW, cy, { lineBreak: false });
  cy += BODY_FAT_PROGRESS_BAR.titleSize + 4;

  doc
    .font(SEMINAR_FONTS.regular)
    .fontSize(BODY_FAT_PROGRESS_BAR.subtitleSize)
    .fillColor(SEMINAR_COLORS.muted)
    .text(BODY_FAT_PROGRESS_BAR_SUBTITLE, x, cy, { width, align: 'center', lineGap: 0 });
  cy += BODY_FAT_PROGRESS_BAR.subtitleSize + BODY_FAT_PROGRESS_BAR.sectionGap;

  const barY = cy + BODY_FAT_PROGRESS_BAR.markerLabelSize + 4;
  const barH = BODY_FAT_PROGRESS_BAR.barHeight;
  const barR = BODY_FAT_PROGRESS_BAR.barRadius;

  doc.save();
  doc.roundedRect(x, barY, width, barH, barR).clip();
  zones.forEach((zone, index) => {
    const x0 = bfToBarX(x, width, zone.from, scaleMax);
    const x1 = bfToBarX(x, width, zone.to, scaleMax);
    const segW = Math.max(x1 - x0, 1);
    if (zone.label === 'Off-season') {
      const grad = doc.linearGradient(x0, barY, x1, barY);
      grad.stop(0, '#D4A800');
      grad.stop(1, '#FFEB66');
      doc.fillColor(grad).rect(x0, barY, segW, barH).fill();
    } else {
      doc
        .fillColor(BODY_FAT_PROGRESS_BAR.segmentGreys[index] || '#8a8a8a')
        .rect(x0, barY, segW, barH)
        .fill();
    }
    if (zone.capLabel) {
      doc
        .font(zone.label === activeStage ? SEMINAR_FONTS.bold : SEMINAR_FONTS.regular)
        .fontSize(BODY_FAT_PROGRESS_BAR.capLabelSize)
        .fillColor('#ffffff')
        .text(zone.capLabel, x0, barY + (barH - BODY_FAT_PROGRESS_BAR.capLabelSize) / 2, {
          width: segW,
          align: 'center',
          lineGap: 0,
        });
    }
  });
  doc.restore();

  doc
    .strokeColor(gold)
    .lineWidth(1.25)
    .roundedRect(x, barY, width, barH, BODY_FAT_PROGRESS_BAR.barRadius)
    .stroke();

  zones.forEach((zone, index) => {
    if (index === 0) return;
    const boundaryX = bfToBarX(x, width, zone.from, scaleMax);
    doc
      .strokeColor('#ffffff')
      .lineWidth(0.75)
      .moveTo(boundaryX, barY + 2)
      .lineTo(boundaryX, barY + barH - 2)
      .stroke();
  });

  if (Number.isFinite(currentBf)) {
    const markerX = bfToBarX(x, width, currentBf, scaleMax);
    const markerLabel = `${currentBf}%`;
    doc.font(SEMINAR_FONTS.bold).fontSize(BODY_FAT_PROGRESS_BAR.markerLabelSize);
    const labelW = doc.widthOfString(markerLabel);
    const labelX = Math.max(x, Math.min(markerX - labelW / 2, x + width - labelW));
    doc.fillColor(gold).text(markerLabel, labelX, cy, { lineBreak: false });
    const triY = barY - 2;
    doc
      .fillColor(gold)
      .moveTo(markerX, triY)
      .lineTo(markerX - 4, triY - BODY_FAT_PROGRESS_BAR.markerH)
      .lineTo(markerX + 4, triY - BODY_FAT_PROGRESS_BAR.markerH)
      .closePath()
      .fill();
    doc
      .strokeColor(gold)
      .lineWidth(1.5)
      .moveTo(markerX, barY)
      .lineTo(markerX, barY + barH)
      .stroke();
  }

  cy = barY + barH + 6;
  zones.forEach((zone) => {
    const x0 = bfToBarX(x, width, zone.from, scaleMax);
    const x1 = bfToBarX(x, width, zone.to, scaleMax);
    const segW = Math.max(x1 - x0, 1);
    const centerX = x0 + segW / 2;
    const stageName = zone.label.toUpperCase();
    doc
      .font(SEMINAR_FONTS.regular)
      .fontSize(BODY_FAT_PROGRESS_BAR.braceSize)
      .fillColor(gold)
      .text('{  }', x0, cy, { width: segW, align: 'center', lineBreak: false });
    const iconY = cy + BODY_FAT_PROGRESS_BAR.braceSize + BODY_FAT_PROGRESS_BAR.iconGap;
    drawProgressBarIcon(doc, zone.label, centerX, iconY + BODY_FAT_PROGRESS_BAR.iconSize / 2, BODY_FAT_PROGRESS_BAR.iconSize, gold);
    doc
      .font(SEMINAR_FONTS.bold)
      .fontSize(BODY_FAT_PROGRESS_BAR.categorySize)
      .fillColor(gold)
      .text(stageName, x0, iconY + BODY_FAT_PROGRESS_BAR.iconSize + BODY_FAT_PROGRESS_BAR.iconGap, {
        width: segW,
        align: 'center',
        lineGap: 0,
      });
  });

  cy += (
    BODY_FAT_PROGRESS_BAR.braceSize
    + BODY_FAT_PROGRESS_BAR.iconGap
    + BODY_FAT_PROGRESS_BAR.iconSize
    + BODY_FAT_PROGRESS_BAR.iconGap
    + BODY_FAT_PROGRESS_BAR.categorySize
    + BODY_FAT_PROGRESS_BAR.sectionGap
  );

  doc.font(PDF_FRAME_FONTS.italic).fontSize(BODY_FAT_PROGRESS_BAR.footerSize);
  const footerInnerW = width - BODY_FAT_PROGRESS_BAR.footerPad * 2;
  const footerTextH = doc.heightOfString(BODY_FAT_PROGRESS_BAR_FOOTER, {
    width: footerInnerW,
    align: 'center',
  });
  const footerBoxH = footerTextH + BODY_FAT_PROGRESS_BAR.footerPad * 2;
  doc
    .strokeColor(gold)
    .lineWidth(1)
    .roundedRect(x, cy, width, footerBoxH, 4)
    .stroke();
  doc
    .fillColor(gold)
    .text(BODY_FAT_PROGRESS_BAR_FOOTER, x + BODY_FAT_PROGRESS_BAR.footerPad, cy + BODY_FAT_PROGRESS_BAR.footerPad, {
      width: footerInnerW,
      align: 'center',
      lineGap: 2,
    });

  return cy + footerBoxH + LAYOUT.paragraphGap;
}

function leannessStageTableOpts(page, table, compact = {}) {
  const stageCount = table.stageLabels.length;
  const columns = table.stageLabels.map((_, index) => ({
    key: `s${index}`,
    width: 1 / stageCount,
    align: 'center',
  }));
  const labelRow = Object.fromEntries(
    table.stageLabels.map((label, index) => [`s${index}`, label]),
  );
  const valueRow = Object.fromEntries(
    table.values.map((value, index) => [`s${index}`, value]),
  );
  return {
    x: page.x,
    y: page.y,
    width: page.width,
    columns,
    rows: [labelRow, valueRow],
    headerRows: 1,
    ...compact,
  };
}

function drawLeanBodyAnalysisPage(doc, payload) {
  const lba = payload.leanBodyAnalysis;
  let page = startLockedPage(doc, payload, 'Lean Body Analysis');

  const profileLine = `Height: ${lba.heightInches} inches  Sex: ${lba.sex}  Thigh: ${lba.thigh}  Waist: ${lba.waist}  Age: ${lba.age} years of experience`;
  page = drawBodyParagraphs(doc, payload, page, [profileLine]);
  page = { ...page, y: page.y + LAYOUT.sectionGap };

  page = ensureLockedSpace(doc, payload, page, LAYOUT.subsectionSize + LAYOUT.headerGap + 60);
  page = { ...page, y: drawSectionTitle(doc, '--TODAY--', page.x, page.y, page.width) };

  const todayTableOpts = {
    x: page.x,
    y: page.y,
    width: page.width,
    columns: [
      { key: 'label', width: 0.18 },
      { key: 'pct', width: 0.32, align: 'center' },
      { key: 'lbs', width: 0.5, align: 'right' },
    ],
    rows: [
      { label: 'LEAN', pct: `${lba.today.leanPct} %`, lbs: `${lba.today.leanLbs} lbs.` },
      { label: 'FAT', pct: `${lba.today.fatPct} %`, lbs: `${lba.today.fatLbs} lbs.` },
      { label: 'TOTAL', pct: `${lba.today.totalPct} %`, lbs: `${lba.today.totalLbs} lbs.` },
    ],
    headerRows: 0,
  };
  page = ensureLockedSpace(doc, payload, page, measureLayoutTable(doc, todayTableOpts));
  todayTableOpts.y = page.y;
  page = { ...page, y: drawLayoutTable(doc, todayTableOpts) + LAYOUT.paragraphGap };

  const fatBarH = measureBodyFatProgressBar(doc, page.width);
  page = ensureLockedSpace(doc, payload, page, fatBarH);
  page = { ...page, y: drawBodyFatProgressBar(doc, page, lba.leannessFatBar) };

  const proseParagraphs = [
    lba.riskMessage,
    lba.lbmLead,
    lba.lbmCongrats,
  ].filter(Boolean);
  if (proseParagraphs.length) {
    page = drawBodyParagraphs(doc, payload, page, proseParagraphs);
  }

  const lbaTableCompact = { tableRowPad: 4, bodyFontSize: 9, headFontSize: 9 };

  const weightTableOpts = leannessStageTableOpts(page, lba.leannessWeightGoals, lbaTableCompact);
  page = ensureLockedSpace(doc, payload, page, measureLayoutTable(doc, weightTableOpts));
  weightTableOpts.y = page.y;
  page = { ...page, y: drawLayoutTable(doc, weightTableOpts) + LAYOUT.paragraphGap };

  page = drawBodyParagraphs(doc, payload, page, [lba.monitorCopy]);
  finishLockedPage(doc, page.box, payload);
}

const REPORT_GRID = {
  valueSize: 15,
  labelSize: PT.body,
  unitSize: PT.body,
  labelLineGap: 2,
};

/** @param {import('pdfkit')} doc @param {Array<{ label: string, value: string, unit: string }>} columns */
function measureMetricColumnGrid(doc, columns, width) {
  const colW = width / columns.length;
  const pad = TABLE_CONTAINER.cellPad;
  const innerW = colW - pad * 2;
  doc.font(SEMINAR_FONTS.bold).fontSize(REPORT_GRID.labelSize);
  const maxLabelH = columns.reduce(
    (max, col) => Math.max(
      max,
      doc.heightOfString(col.label, { width: innerW, lineGap: REPORT_GRID.labelLineGap }),
    ),
    0,
  );
  doc.font(SEMINAR_FONTS.bold).fontSize(REPORT_GRID.valueSize);
  const valueH = doc.heightOfString('113.7', { width: innerW });
  doc.font(SEMINAR_FONTS.regular).fontSize(REPORT_GRID.unitSize);
  const unitH = doc.heightOfString('hours per week', { width: innerW });
  return pad * 2 + maxLabelH + 6 + valueH + 4 + unitH;
}

const SERVINGS_TABLE_COLUMNS = Object.freeze([
  { key: 'label', width: 0.18 },
  { key: 'daily', width: 0.1, align: 'center' },
  { key: 'breakfast', width: 0.12, align: 'center' },
  { key: 'snack1', width: 0.1, align: 'center' },
  { key: 'lunch', width: 0.1, align: 'center' },
  { key: 'snack2', width: 0.1, align: 'center' },
  { key: 'dinner', width: 0.12, align: 'center' },
  { key: 'snack3', width: 0.1, align: 'center' },
]);

function buildServingsTableRows(gridRows) {
  return [
    {
      label: '',
      daily: 'Daily',
      breakfast: 'Breakfast',
      snack1: 'Snack',
      lunch: 'Lunch',
      snack2: 'Snack',
      dinner: 'Dinner',
      snack3: 'Snack',
    },
    ...gridRows,
  ];
}

function drawServingsTable(doc, payload, page, gridRows) {
  const servingsTableOpts = {
    x: page.x,
    y: page.y,
    width: page.width,
    columns: SERVINGS_TABLE_COLUMNS,
    rows: buildServingsTableRows(gridRows),
    headerRows: 1,
  };
  page = ensureLockedSpace(doc, payload, page, measureLayoutTable(doc, servingsTableOpts));
  servingsTableOpts.y = page.y;
  return { ...page, y: drawLayoutTable(doc, servingsTableOpts) + LAYOUT.sectionGap };
}

function foodPlanNarrativeBlock(payload, title) {
  return payload.foodPlanNarrative?.blocks?.find((block) => block.title === title);
}

function drawFoodPlanPage(doc, payload) {
  const fp = payload.foodPlan;
  let page = startLockedPage(doc, payload, 'Food Plan');

  const lead = fp.lead || [];
  if (lead.length) {
    page = drawBodyParagraphs(doc, payload, page, lead);
  }

  const servingsBlock = foodPlanNarrativeBlock(payload, 'Step 4 — Turn targets into servings');
  if (servingsBlock?.paragraphs?.length) {
    page = ensureLockedSpace(
      doc,
      payload,
      page,
      LAYOUT.subsectionSize + LAYOUT.headerGap + servingsBlock.paragraphs.reduce(
        (sum, paragraph) => sum + measureParagraph(doc, paragraph, page.width),
        0,
      ),
    );
    if (servingsBlock?.title) {
      page = { ...page, y: drawSectionTitle(doc, servingsBlock.title, page.x, page.y, page.width) };
    }
    page = drawBodyParagraphs(doc, payload, page, servingsBlock.paragraphs);
  }

  const macroRows = fp.macroSignalRows || [];
  if (macroRows.length) {
    const macroTableH = measureMacroSignalLayoutTable(doc, page.width, macroRows);
    page = ensureLockedSpace(doc, payload, page, macroTableH + LAYOUT.sectionGap);
    drawMacroSignalLayoutTable(doc, {
      x: page.x,
      y: page.y,
      width: page.width,
      rows: macroRows,
    });
  }

  finishLockedPage(doc, page.box, payload);
}

function drawServingsPage(doc, payload) {
  const servings = payload.servings;
  let page = startLockedPage(doc, payload, 'Servings');

  page = drawBodyParagraphs(doc, payload, page, [servings.note]);

  const gridRows = servings.gridRows.map((row) => ({ ...row }));
  page = drawServingsTable(doc, payload, page, gridRows);

  finishLockedPage(doc, page.box, payload);
}

export async function renderProgramReportKwarnerLockedPreview(payload, { title, buildLabel } = {}) {
  validatePrintPayload('programreport', payload);

  const creator = createPrintPdf({
    title: title || payload.title || 'Program Report',
    author: 'Burn & Build Diet',
  });

  const doc = creator.doc;
  if (buildLabel) {
    doc.info.Subject = `KWarner locked preview ${buildLabel}`;
  }

  drawWelcomePage(doc, payload);
  drawLeanBodyAnalysisPage(doc, payload);
  drawProjectionsPage(doc, payload);
  drawFoodPlanPage(doc, payload);
  drawServingsPage(doc, payload);
  drawStaplesFoodListPage(doc, payload);
  drawVegFruitFoodListPage(doc, payload);
  drawFlavorKitsPage(doc, payload);

  stampPinnedProgramFooters(doc, payload.header);

  const buffer = await creator.finish({ stampPageNumbers: false });
  const pages = (buffer.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  if (pages < KWARNER_LOCKED_MIN_PAGES) {
    throw new Error(`Preview PDF expected at least ${KWARNER_LOCKED_MIN_PAGES} pages, got ${pages}`);
  }
  return buffer;
}
