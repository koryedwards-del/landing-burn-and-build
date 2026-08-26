/**
 * 2026 Burn & Build Diet program report (Welcome → LBA → Food Plan → Servings → Food List → Confirmation).
 * Production: renderProgramReport.js · Preview samples: scripts/render-kwarner-locked-preview.mjs
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
import {
  PRINT_TEMPLATE_LBA_SNAPSHOT,
  PRINT_TEMPLATE_PROGRESS_BAR,
  PRINT_TEMPLATE_TYPOGRAPHY as PT,
  PRINT_TEMPLATE_WELCOME,
} from '../../js/printTemplateTypography.js';
import {
  CUTTING_STAPLES_FRUIT,
  CUTTING_STAPLES_GRAINS_STARCHES,
  CUTTING_STAPLES_PROTEIN_DAIRY,
  CUTTING_STAPLES_VEGETABLES,
} from '../../data/cuttingStaplesPrintout.js';
import {
  scaleStapleRows,
  stapleCategoryServings,
} from '../../js/stapleServingPrintout.js';
import { QUESTIONNAIRE_JOB_OPTIONS, WORK_STRESS } from '../../js/onboardingEngine.js';
import {
  BODY_FAT_PROGRESS_BAR_FOOTER,
  BODY_FAT_PROGRESS_BAR_SUBTITLE,
  BODY_FAT_PROGRESS_BAR_TITLE,
} from '../../js/lbaPrintout.js';
import { GRAINS_STARCHES_TIPS_PROSE } from '../../data/grainsStarchesTipsPrintout.js';
import { FRUIT_TIPS_PROSE } from '../../data/fruitTipsPrintout.js';
import { BURN_AND_BUILD_DIET_PDF_NAME } from '../../js/dietPdfNaming.js';
import { EXTRA_FATS_LABEL } from '../../js/servingsPrintout.js';

export const PROGRAM_REPORT_MIN_PAGES = 7;
/** @deprecated Use PROGRAM_REPORT_MIN_PAGES */
export const KWARNER_LOCKED_MIN_PAGES = PROGRAM_REPORT_MIN_PAGES;

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

function resolveBodyTypography(options = {}) {
  return {
    bodySize: options.bodySize ?? LAYOUT.bodySize,
    lineGap: options.lineGap ?? LAYOUT.lineGap,
    paragraphGap: options.paragraphGap ?? LAYOUT.paragraphGap,
  };
}

function measureParagraph(doc, paragraph, width, typography = {}) {
  if (!paragraph) return 0;
  const { bodySize, lineGap, paragraphGap } = resolveBodyTypography(typography);
  doc.font(SEMINAR_FONTS.regular).fontSize(bodySize);
  return doc.heightOfString(String(paragraph), {
    width,
    lineGap,
  }) + paragraphGap;
}

function drawCenteredBodyParagraph(doc, payload, page, text) {
  if (!text) return page;
  const blockH = measureParagraph(doc, text, page.width);
  let current = ensureLockedSpace(doc, payload, page, blockH);
  doc
    .font(SEMINAR_FONTS.regular)
    .fontSize(LAYOUT.bodySize)
    .fillColor(SEMINAR_COLORS.body)
    .text(String(text), current.x, current.y, {
      width: current.width,
      lineGap: LAYOUT.lineGap,
      align: 'center',
    });
  return { ...current, y: doc.y + LAYOUT.paragraphGap };
}

function drawBodyParagraphs(doc, payload, page, paragraphs, {
  fullHeader = false,
  pageTitle = null,
  bodySize,
  lineGap,
  paragraphGap,
} = {}) {
  const typography = resolveBodyTypography({ bodySize, lineGap, paragraphGap });
  let current = page;
  (paragraphs || []).forEach((paragraph) => {
    if (!paragraph) return;
    const blockH = measureParagraph(doc, paragraph, current.width, typography);
    current = ensureLockedSpace(doc, payload, current, blockH, { fullHeader });
    doc
      .font(SEMINAR_FONTS.regular)
      .fontSize(typography.bodySize)
      .fillColor(SEMINAR_COLORS.body)
      .text(String(paragraph), current.x, current.y, {
        width: current.width,
        lineGap: typography.lineGap,
        align: 'left',
      });
    current = { ...current, y: doc.y + typography.paragraphGap };
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

const STAPLES_TIPS_PARAGRAPH_GAP = 4;

function measureStaplesTipsBlock(doc, width, tips) {
  doc.font(SEMINAR_FONTS.boldItalic).fontSize(LAYOUT.subsectionSize);
  let h = LAYOUT.sectionGap
    + doc.heightOfString(tips.title, { width })
    + LAYOUT.headerGap;
  doc.font(SEMINAR_FONTS.regular).fontSize(LAYOUT.bodySize);
  for (const paragraph of tips.paragraphs) {
    h += doc.heightOfString(paragraph, { width, lineGap: LAYOUT.lineGap })
      + STAPLES_TIPS_PARAGRAPH_GAP;
  }
  return h;
}

function drawStaplesTipsBlock(doc, col, yStart, tips) {
  const { x, width } = col;
  let y = yStart + LAYOUT.sectionGap;
  doc
    .font(SEMINAR_FONTS.boldItalic)
    .fontSize(LAYOUT.subsectionSize)
    .fillColor(SEMINAR_COLORS.body)
    .text(tips.title, x, y, { width, lineGap: 0 });
  y = doc.y + LAYOUT.headerGap;
  for (const paragraph of tips.paragraphs) {
    doc
      .font(SEMINAR_FONTS.regular)
      .fontSize(LAYOUT.bodySize)
      .fillColor(SEMINAR_COLORS.body)
      .text(paragraph, x, y, { width, lineGap: LAYOUT.lineGap });
    y = doc.y + STAPLES_TIPS_PARAGRAPH_GAP;
  }
  return y;
}

function drawStaplesTipsUnderList(doc, payload, page, col, yStart, tips) {
  const tipsH = measureStaplesTipsBlock(doc, col.width, tips);
  if (yStart + tipsH <= page.bottom) {
    drawStaplesTipsBlock(doc, col, yStart, tips);
    return page;
  }
  finishLockedPage(doc, page.box, payload);
  page = startLockedPage(doc, payload, null);
  const columns = staplesColumnLayout(page);
  const ruleX = columns[0].x + columns[0].width + STAPLES_LIST.columnGap / 2;
  drawStaplesColumnRule(doc, ruleX, page.y, page.bottom);
  drawStaplesTipsBlock(doc, columns[1], page.y, tips);
  return page;
}

function staplesForPayload(items, category, payload) {
  const servings = stapleCategoryServings(payload.servings?.planServings, category);
  return scaleStapleRows(items, servings);
}

function drawStaplesFoodListPage(doc, payload) {
  const proteinItems = staplesForPayload(CUTTING_STAPLES_PROTEIN_DAIRY, 'protein', payload);
  const grainItems = staplesForPayload(CUTTING_STAPLES_GRAINS_STARCHES, 'grains', payload);

  let page = startLockedPage(doc, payload, 'Food List');
  let columns = staplesColumnLayout(page);
  const ruleX = columns[0].x + columns[0].width + STAPLES_LIST.columnGap / 2;
  drawStaplesColumnRule(doc, ruleX, page.y, page.bottom);
  drawStaplesColumn(doc, 'Protein & Dairy', proteinItems, columns[0], page.y, page.bottom);

  let gsCol = columns[1];
  let gsY = drawSectionTitle(doc, 'Grains & Starches', gsCol.x, page.y, gsCol.width);
  let gsIndex = 0;

  while (gsIndex < grainItems.length) {
    const result = drawStapleListItems(doc, grainItems, gsCol, gsY, page.bottom, gsIndex);
    gsIndex = result.nextIndex;
    gsY = result.y;

    if (gsIndex < grainItems.length) {
      finishLockedPage(doc, page.box, payload);
      page = startLockedPage(doc, payload, null);
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

  page = drawStaplesTipsUnderList(doc, payload, page, gsCol, gsY, GRAINS_STARCHES_TIPS_PROSE);
  finishLockedPage(doc, page.box, payload);
}

function drawVegFruitFoodListPage(doc, payload) {
  const vegetableItems = staplesForPayload(CUTTING_STAPLES_VEGETABLES, 'vegetable', payload);
  const fruitItems = staplesForPayload(CUTTING_STAPLES_FRUIT, 'fruit', payload);

  let vegIndex = 0;
  let fruitIndex = 0;
  let fruitTipsDrawn = false;
  let firstPage = true;

  while (vegIndex < vegetableItems.length || fruitIndex < fruitItems.length) {
    let page = startLockedPage(doc, payload, firstPage ? 'Food List' : null);
    firstPage = false;
    const columns = staplesColumnLayout(page);
    const ruleX = columns[0].x + columns[0].width + STAPLES_LIST.columnGap / 2;
    drawStaplesColumnRule(doc, ruleX, page.y, page.bottom);

    let fruitColEndY = null;

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
      const result = drawStapleListItems(
        doc,
        fruitItems,
        columns[1],
        y,
        page.bottom,
        fruitIndex,
      );
      fruitIndex = result.nextIndex;
      fruitColEndY = result.y;
    }

    if (!fruitTipsDrawn && fruitIndex >= fruitItems.length) {
      page = drawStaplesTipsUnderList(
        doc,
        payload,
        page,
        columns[1],
        fruitColEndY ?? page.y,
        FRUIT_TIPS_PROSE,
      );
      fruitTipsDrawn = true;
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
  const guide = PRINT_TEMPLATE_WELCOME;

  page = drawBodyParagraphs(doc, payload, page, payload.welcome.intro, {
    fullHeader: true,
    pageTitle: 'Welcome',
    bodySize: guide.introBody,
    lineGap: guide.lineGap,
    paragraphGap: guide.paragraphGap,
  });
  page = { ...page, y: page.y + guide.sectionGap };

  const sections = [
    ['Lean Body Analysis', payload.welcome.leanBodyAnalysis],
    ['Food Plan', payload.welcome.foodPlan],
    ['Servings', payload.welcome.servings],
    ['Food List', payload.welcome.foodList],
  ].filter(([, body]) => body);

  sections.forEach(([title, body], index) => {
    doc.font(SEMINAR_FONTS.bold).fontSize(guide.sectionTitle);
    const blockH = guide.sectionTitle + guide.headerGap
      + doc.heightOfString(String(body), { width: page.width, lineGap: guide.lineGap })
      + guide.paragraphGap;
    page = ensureLockedSpace(doc, payload, page, blockH, { fullHeader: true });
    doc
      .font(SEMINAR_FONTS.bold)
      .fontSize(guide.sectionTitle)
      .fillColor(SEMINAR_COLORS.body)
      .text(String(title), page.x, page.y, { width: page.width, lineGap: 0 });
    page = { ...page, y: doc.y + guide.headerGap };
    doc
      .font(SEMINAR_FONTS.regular)
      .fontSize(guide.sectionBody)
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

const PROJECTION_TABLE_HEAD_SIZE = PT.macroTableHead;

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
    { macro: 'FOOD GROUPS', tooMuch: 'TOO MUCH', tooLittle: 'TOO LITTLE' },
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
  titleSize: PRINT_TEMPLATE_PROGRESS_BAR.title,
  subtitleSize: PRINT_TEMPLATE_PROGRESS_BAR.subtitle,
  barHeight: 52,
  barRadius: 6,
  lbmCellWidthRatio: 0.15,
  barFill: '#EFEFEF',
  barDivider: '#C8C8C8',
  barText: SEMINAR_COLORS.body,
  capLabelSize: PRINT_TEMPLATE_PROGRESS_BAR.capLabel,
  categorySize: PRINT_TEMPLATE_PROGRESS_BAR.category,
  weightLabelSize: PRINT_TEMPLATE_PROGRESS_BAR.weightLabel,
  cellLineGap: 2,
  markerLabelSize: PRINT_TEMPLATE_PROGRESS_BAR.markerLabel,
  markerH: 5,
  footerSize: PRINT_TEMPLATE_PROGRESS_BAR.footer,
  footerLineGap: 6,
  footerPad: 10,
  sectionGap: 10,
  timelineLabelSize: PRINT_TEMPLATE_PROGRESS_BAR.timelineLabel,
  timelineBfSize: PRINT_TEMPLATE_PROGRESS_BAR.timelineBf,
  timelineSectionH: 39,
  timelineMarkerH: 8,
  timelineTriHalfW: 5,
});

function fatBarLayout(x, width, lbmCell) {
  const lbmW = lbmCell ? Math.max(Math.round(width * BODY_FAT_PROGRESS_BAR.lbmCellWidthRatio), 64) : 0;
  return {
    lbmX: x,
    lbmW,
    bfX: x + lbmW,
    bfW: width - lbmW,
  };
}

function bfToBarX(bfX, bfW, bf, scaleMax) {
  const clamped = Math.max(0, Math.min(Number(bf), scaleMax));
  return bfX + (clamped / scaleMax) * bfW;
}

function drawLbmCell(doc, lbmCell, x0, barY, segW, barH) {
  doc.fillColor(BODY_FAT_PROGRESS_BAR.barFill).rect(x0, barY, segW, barH).fill();
  drawStackedBarCell(doc, {
    fatLabel: lbmCell.fatLabel,
    categoryLabel: lbmCell.label.toUpperCase(),
    poundsLabel: lbmCell.poundsLabel,
  }, x0, barY, segW, barH, BODY_FAT_PROGRESS_BAR.barText, true);
}

function drawStackedBarCell(doc, { fatLabel, categoryLabel, poundsLabel }, x0, barY, segW, barH, textColor, isActive) {
  const font = isActive ? SEMINAR_FONTS.bold : SEMINAR_FONTS.regular;
  const gap = BODY_FAT_PROGRESS_BAR.cellLineGap;
  const fatH = fatLabel ? BODY_FAT_PROGRESS_BAR.capLabelSize : 0;
  const catH = categoryLabel ? BODY_FAT_PROGRESS_BAR.categorySize : 0;
  const poundsH = poundsLabel ? BODY_FAT_PROGRESS_BAR.weightLabelSize : 0;
  const blockH = fatH + (fatLabel ? gap : 0) + catH + (categoryLabel && poundsLabel ? gap : 0) + poundsH;
  let ty = barY + (barH - blockH) / 2;
  if (fatLabel) {
    doc.font(font).fontSize(BODY_FAT_PROGRESS_BAR.capLabelSize).fillColor(textColor);
    doc.text(fatLabel, x0, ty, { width: segW, align: 'center', lineGap: 0 });
    ty += fatH + gap;
  }
  if (categoryLabel) {
    doc.font(font).fontSize(BODY_FAT_PROGRESS_BAR.categorySize).fillColor(textColor);
    doc.text(categoryLabel, x0, ty, { width: segW, align: 'center', lineGap: 0 });
    ty += catH;
  }
  if (poundsLabel) {
    if (categoryLabel) ty += gap;
    doc.font(font).fontSize(BODY_FAT_PROGRESS_BAR.weightLabelSize).fillColor(textColor);
    doc.text(poundsLabel, x0, ty, { width: segW, align: 'center', lineGap: 0 });
  }
}

function drawSegmentCellLabels(doc, zone, x0, barY, segW, barH, activeStage, textColor) {
  const isActive = zone.label === activeStage;
  drawStackedBarCell(doc, {
    fatLabel: zone.capLabel,
    categoryLabel: '',
    poundsLabel: zone.weightLabel,
  }, x0, barY, segW, barH, textColor, isActive);
}

function fatBarTimelineSectionHeight(bar) {
  return bar?.timelineMarkers?.length ? BODY_FAT_PROGRESS_BAR.timelineSectionH : 0;
}

function drawFatBarTimelineMarkers(doc, layout, barY, barH, scaleMax, markers, pageX, pageWidth) {
  if (!markers?.length) return;
  const triH = BODY_FAT_PROGRESS_BAR.timelineMarkerH;
  const triHalfW = BODY_FAT_PROGRESS_BAR.timelineTriHalfW;
  const markerTop = barY + barH + 3;
  const labelY = markerTop + triH + 2;
  const color = BODY_FAT_PROGRESS_BAR.barText;

  markers.forEach((marker) => {
    const markerX = bfToBarX(layout.bfX, layout.bfW, marker.bodyFat, scaleMax);
    const timelineLabel = String(marker.timelineLabel || '').replace(/\*+$/, '');

    doc
      .fillColor(color)
      .moveTo(markerX, markerTop + triH)
      .lineTo(markerX - triHalfW, markerTop)
      .lineTo(markerX + triHalfW, markerTop)
      .closePath()
      .fill();
    doc
      .strokeColor(color)
      .lineWidth(0.75)
      .moveTo(markerX, barY + barH)
      .lineTo(markerX, markerTop)
      .stroke();

    doc.font(SEMINAR_FONTS.bold).fontSize(BODY_FAT_PROGRESS_BAR.timelineLabelSize).fillColor(color);
    const labelW = doc.widthOfString(timelineLabel);
    const labelX = Math.max(pageX, Math.min(markerX - labelW / 2, pageX + pageWidth - labelW));
    doc.text(timelineLabel, labelX, labelY, { lineBreak: false });

    doc.font(SEMINAR_FONTS.regular).fontSize(BODY_FAT_PROGRESS_BAR.timelineBfSize);
    const weightW = doc.widthOfString(marker.weightLabel);
    const weightX = Math.max(pageX, Math.min(markerX - weightW / 2, pageX + pageWidth - weightW));
    doc.text(marker.weightLabel, weightX, labelY + BODY_FAT_PROGRESS_BAR.timelineLabelSize + 2, { lineBreak: false });
  });
}

function measureBodyFatProgressBar(doc, width, footerText, bar) {
  doc.font(SEMINAR_FONTS.bold).fontSize(BODY_FAT_PROGRESS_BAR.titleSize);
  const titleH = doc.heightOfString(BODY_FAT_PROGRESS_BAR_TITLE, { width, align: 'center' });
  doc.font(SEMINAR_FONTS.regular).fontSize(BODY_FAT_PROGRESS_BAR.subtitleSize);
  const subtitleH = doc.heightOfString(BODY_FAT_PROGRESS_BAR_SUBTITLE, { width, align: 'center' });
  doc.font(PDF_FRAME_FONTS.italic).fontSize(BODY_FAT_PROGRESS_BAR.footerSize);
  const footerH = doc.heightOfString(footerText || BODY_FAT_PROGRESS_BAR_FOOTER, {
    width: width - BODY_FAT_PROGRESS_BAR.footerPad * 2,
    align: 'center',
    lineGap: BODY_FAT_PROGRESS_BAR.footerLineGap,
  });
  return (
    titleH
    + 4
    + subtitleH
    + BODY_FAT_PROGRESS_BAR.sectionGap
    + BODY_FAT_PROGRESS_BAR.markerLabelSize
    + 4
    + BODY_FAT_PROGRESS_BAR.barHeight
    + fatBarTimelineSectionHeight(bar)
    + BODY_FAT_PROGRESS_BAR.sectionGap
    + footerH
    + BODY_FAT_PROGRESS_BAR.footerPad * 2
    + LAYOUT.paragraphGap
  );
}

function drawBodyFatProgressBar(doc, page, bar, footerText) {
  const { x, y, width } = page;
  const { currentBf, scaleMax, zones, activeStage, lbmCell, timelineMarkers } = bar;
  if (!zones?.length || !scaleMax) return y;

  const footerCopy = footerText || BODY_FAT_PROGRESS_BAR_FOOTER;
  const layout = fatBarLayout(x, width, lbmCell);
  let cy = y;
  const gold = PDF_FRAME_COLORS.gold;

  doc.font(SEMINAR_FONTS.bold).fontSize(BODY_FAT_PROGRESS_BAR.titleSize);
  const titleParts = BODY_FAT_PROGRESS_BAR_TITLE.split(' ');
  const titleSplitAt = titleParts.length <= 2 ? 1 : 2;
  const titleSilver = titleParts.slice(0, titleSplitAt).join(' ');
  const titleGold = titleParts.slice(titleSplitAt).join(' ');
  const titleSilverW = doc.widthOfString(titleGold ? `${titleSilver} ` : titleSilver);
  const titleTotalW = doc.widthOfString(BODY_FAT_PROGRESS_BAR_TITLE);
  const titleX = x + (width - titleTotalW) / 2;
  doc.fillColor('#888888').text(titleSilver, titleX, cy, { lineBreak: false });
  doc.fillColor(gold).text(titleGold, titleX + titleSilverW, cy, { lineBreak: false });
  cy += BODY_FAT_PROGRESS_BAR.titleSize + 4;

  doc
    .font(SEMINAR_FONTS.regular)
    .fontSize(BODY_FAT_PROGRESS_BAR.subtitleSize)
    .fillColor('#2F6FA8')
    .text(BODY_FAT_PROGRESS_BAR_SUBTITLE, x, cy, { width, align: 'center', lineGap: 0 });
  cy += BODY_FAT_PROGRESS_BAR.subtitleSize + BODY_FAT_PROGRESS_BAR.sectionGap;

  const barY = cy + BODY_FAT_PROGRESS_BAR.markerLabelSize + 4;
  const barH = BODY_FAT_PROGRESS_BAR.barHeight;
  const barR = BODY_FAT_PROGRESS_BAR.barRadius;

  doc.save();
  doc.roundedRect(x, barY, width, barH, barR).clip();
  if (lbmCell && layout.lbmW > 0) {
    drawLbmCell(doc, lbmCell, layout.lbmX, barY, layout.lbmW, barH);
  }
  doc.fillColor(BODY_FAT_PROGRESS_BAR.barFill).rect(layout.bfX, barY, layout.bfW, barH).fill();
  zones.forEach((zone) => {
    const x0 = bfToBarX(layout.bfX, layout.bfW, zone.from, scaleMax);
    const x1 = bfToBarX(layout.bfX, layout.bfW, zone.to, scaleMax);
    const segW = Math.max(x1 - x0, 1);
    drawSegmentCellLabels(
      doc,
      zone,
      x0,
      barY,
      segW,
      barH,
      activeStage,
      BODY_FAT_PROGRESS_BAR.barText,
    );
  });
  doc.restore();

  doc
    .strokeColor(gold)
    .lineWidth(1.25)
    .roundedRect(x, barY, width, barH, BODY_FAT_PROGRESS_BAR.barRadius)
    .stroke();

  zones.forEach((zone, index) => {
    if (index === 0) return;
    const boundaryX = bfToBarX(layout.bfX, layout.bfW, zone.from, scaleMax);
    doc
      .strokeColor(BODY_FAT_PROGRESS_BAR.barDivider)
      .lineWidth(0.75)
      .moveTo(boundaryX, barY + 2)
      .lineTo(boundaryX, barY + barH - 2)
      .stroke();
  });

  if (lbmCell && layout.lbmW > 0) {
    const lbmDividerX = layout.bfX;
    doc
      .strokeColor(BODY_FAT_PROGRESS_BAR.barDivider)
      .lineWidth(0.75)
      .moveTo(lbmDividerX, barY + 2)
      .lineTo(lbmDividerX, barY + barH - 2)
      .stroke();
  }

  if (Number.isFinite(currentBf)) {
    const markerX = bfToBarX(layout.bfX, layout.bfW, currentBf, scaleMax);
    const markerLabel = `${currentBf}%`;
    doc.font(SEMINAR_FONTS.bold).fontSize(BODY_FAT_PROGRESS_BAR.markerLabelSize);
    const labelW = doc.widthOfString(markerLabel);
    const labelX = Math.max(x, Math.min(markerX - labelW / 2, x + width - labelW));
    doc.fillColor(SEMINAR_COLORS.body).text(markerLabel, labelX, cy, { lineBreak: false });
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

  drawFatBarTimelineMarkers(
    doc,
    layout,
    barY,
    barH,
    scaleMax,
    timelineMarkers,
    x,
    width,
  );

  cy = barY + barH + fatBarTimelineSectionHeight(bar) + BODY_FAT_PROGRESS_BAR.sectionGap;

  doc.font(PDF_FRAME_FONTS.italic).fontSize(BODY_FAT_PROGRESS_BAR.footerSize);
  const footerInnerW = width - BODY_FAT_PROGRESS_BAR.footerPad * 2;
  const footerTextH = doc.heightOfString(footerCopy, {
    width: footerInnerW,
    align: 'center',
    lineGap: BODY_FAT_PROGRESS_BAR.footerLineGap,
  });
  const footerBoxH = footerTextH + BODY_FAT_PROGRESS_BAR.footerPad * 2;
  doc
    .fillColor('#FFF9E0')
    .roundedRect(x, cy, width, footerBoxH, 4)
    .fill();
  doc
    .strokeColor(gold)
    .lineWidth(1)
    .roundedRect(x, cy, width, footerBoxH, 4)
    .stroke();
  doc
    .fillColor('#8B6914')
    .text(footerCopy, x + BODY_FAT_PROGRESS_BAR.footerPad, cy + BODY_FAT_PROGRESS_BAR.footerPad, {
      width: footerInnerW,
      align: 'center',
      lineGap: BODY_FAT_PROGRESS_BAR.footerLineGap,
    });

  return cy + footerBoxH + LAYOUT.paragraphGap;
}

const DESIRABLE_LBM_BAR = Object.freeze({
  titleSize: 11,
  subtitleSize: 8,
  barHeight: 40,
  barRadius: 6,
  segmentStyles: Object.freeze({
    'Below desirable': { fill: '#C4681A', text: '#ffffff' },
    'At or above': { fill: '#0B6E78', text: '#ffffff' },
  }),
  capLabelSize: 8,
  categorySize: 6,
  cellLineGap: 2,
  markerLabelSize: 10,
  markerH: 5,
  footerSize: 9,
  footerPad: 10,
  sectionGap: 10,
});

function lbmSegmentStyle(zoneLabel) {
  return DESIRABLE_LBM_BAR.segmentStyles[zoneLabel]
    || DESIRABLE_LBM_BAR.segmentStyles['At or above'];
}

function lbmToBarX(x, width, lbm, scaleMax) {
  const clamped = Math.max(0, Math.min(Number(lbm), scaleMax));
  return x + (clamped / scaleMax) * width;
}

function drawLbmSegmentCellLabels(doc, zone, x0, barY, segW, barH, activeStage, textColor) {
  const stageName = zone.label.toUpperCase();
  const isActive = zone.label === activeStage;
  const font = isActive ? SEMINAR_FONTS.bold : SEMINAR_FONTS.regular;
  const gap = DESIRABLE_LBM_BAR.cellLineGap;
  const capH = zone.capLabel ? DESIRABLE_LBM_BAR.capLabelSize : 0;
  const catH = DESIRABLE_LBM_BAR.categorySize;
  const blockH = capH + (zone.capLabel ? gap : 0) + catH;
  let ty = barY + (barH - blockH) / 2;
  if (zone.capLabel) {
    doc.font(font).fontSize(DESIRABLE_LBM_BAR.capLabelSize).fillColor(textColor);
    doc.text(zone.capLabel, x0, ty, { width: segW, align: 'center', lineGap: 0 });
    ty += capH + gap;
  }
  doc.font(font).fontSize(DESIRABLE_LBM_BAR.categorySize).fillColor(textColor);
  doc.text(stageName, x0, ty, { width: segW, align: 'center', lineGap: 0 });
}

function measureDesirableLbmBar(doc, width, footerText) {
  doc.font(SEMINAR_FONTS.bold).fontSize(DESIRABLE_LBM_BAR.titleSize);
  const titleH = doc.heightOfString(DESIRABLE_LBM_BAR_TITLE, { width, align: 'center' });
  doc.font(SEMINAR_FONTS.regular).fontSize(DESIRABLE_LBM_BAR.subtitleSize);
  const subtitleH = doc.heightOfString(DESIRABLE_LBM_BAR_SUBTITLE, { width, align: 'center' });
  doc.font(PDF_FRAME_FONTS.italic).fontSize(DESIRABLE_LBM_BAR.footerSize);
  const footerH = doc.heightOfString(footerText || DESIRABLE_LBM_BAR_FOOTER, {
    width: width - DESIRABLE_LBM_BAR.footerPad * 2,
    align: 'center',
  });
  return (
    titleH
    + 4
    + subtitleH
    + DESIRABLE_LBM_BAR.sectionGap
    + DESIRABLE_LBM_BAR.markerLabelSize
    + 4
    + DESIRABLE_LBM_BAR.barHeight
    + DESIRABLE_LBM_BAR.sectionGap
    + footerH
    + DESIRABLE_LBM_BAR.footerPad * 2
    + LAYOUT.paragraphGap
  );
}

function drawDesirableLbmBar(doc, page, bar, footerText) {
  const { x, y, width } = page;
  const { currentLbm, scaleMax, zones, activeStage } = bar || {};
  if (!zones?.length || !scaleMax) return y;

  const footerCopy = footerText || DESIRABLE_LBM_BAR_FOOTER;
  let cy = y;
  const gold = PDF_FRAME_COLORS.gold;

  doc.font(SEMINAR_FONTS.bold).fontSize(DESIRABLE_LBM_BAR.titleSize);
  const titleParts = DESIRABLE_LBM_BAR_TITLE.split(' ');
  const titleSilver = titleParts.slice(0, 2).join(' ');
  const titleGold = titleParts.slice(2).join(' ');
  const titleSilverW = doc.widthOfString(`${titleSilver} `);
  const titleTotalW = doc.widthOfString(DESIRABLE_LBM_BAR_TITLE);
  const titleX = x + (width - titleTotalW) / 2;
  doc.fillColor('#888888').text(titleSilver, titleX, cy, { lineBreak: false });
  doc.fillColor(gold).text(titleGold, titleX + titleSilverW, cy, { lineBreak: false });
  cy += DESIRABLE_LBM_BAR.titleSize + 4;

  doc
    .font(SEMINAR_FONTS.regular)
    .fontSize(DESIRABLE_LBM_BAR.subtitleSize)
    .fillColor('#2F6FA8')
    .text(DESIRABLE_LBM_BAR_SUBTITLE, x, cy, { width, align: 'center', lineGap: 0 });
  cy += DESIRABLE_LBM_BAR.subtitleSize + DESIRABLE_LBM_BAR.sectionGap;

  const barY = cy + DESIRABLE_LBM_BAR.markerLabelSize + 4;
  const barH = DESIRABLE_LBM_BAR.barHeight;
  const barR = DESIRABLE_LBM_BAR.barRadius;

  doc.save();
  doc.roundedRect(x, barY, width, barH, barR).clip();
  zones.forEach((zone) => {
    const x0 = lbmToBarX(x, width, zone.from, scaleMax);
    const x1 = lbmToBarX(x, width, zone.to, scaleMax);
    const segW = Math.max(x1 - x0, 1);
    const style = lbmSegmentStyle(zone.label);
    doc.fillColor(style.fill).rect(x0, barY, segW, barH).fill();
    drawLbmSegmentCellLabels(doc, zone, x0, barY, segW, barH, activeStage, style.text);
  });
  doc.restore();

  doc
    .strokeColor(gold)
    .lineWidth(1.25)
    .roundedRect(x, barY, width, barH, DESIRABLE_LBM_BAR.barRadius)
    .stroke();

  zones.forEach((zone, index) => {
    if (index === 0) return;
    const boundaryX = lbmToBarX(x, width, zone.from, scaleMax);
    doc
      .strokeColor('#ffffff')
      .lineWidth(0.75)
      .moveTo(boundaryX, barY + 2)
      .lineTo(boundaryX, barY + barH - 2)
      .stroke();
  });

  if (Number.isFinite(currentLbm)) {
    const markerX = lbmToBarX(x, width, currentLbm, scaleMax);
    const markerLabel = `${currentLbm} lbs`;
    doc.font(SEMINAR_FONTS.bold).fontSize(DESIRABLE_LBM_BAR.markerLabelSize);
    const labelW = doc.widthOfString(markerLabel);
    const labelX = Math.max(x, Math.min(markerX - labelW / 2, x + width - labelW));
    doc.fillColor(SEMINAR_COLORS.body).text(markerLabel, labelX, cy, { lineBreak: false });
    const triY = barY - 2;
    doc
      .fillColor(gold)
      .moveTo(markerX, triY)
      .lineTo(markerX - 4, triY - DESIRABLE_LBM_BAR.markerH)
      .lineTo(markerX + 4, triY - DESIRABLE_LBM_BAR.markerH)
      .closePath()
      .fill();
    doc
      .strokeColor(gold)
      .lineWidth(1.5)
      .moveTo(markerX, barY)
      .lineTo(markerX, barY + barH)
      .stroke();
  }

  cy = barY + barH + DESIRABLE_LBM_BAR.sectionGap;

  doc.font(PDF_FRAME_FONTS.italic).fontSize(DESIRABLE_LBM_BAR.footerSize);
  const footerInnerW = width - DESIRABLE_LBM_BAR.footerPad * 2;
  const footerTextH = doc.heightOfString(footerCopy, {
    width: footerInnerW,
    align: 'center',
  });
  const footerBoxH = footerTextH + DESIRABLE_LBM_BAR.footerPad * 2;
  doc
    .fillColor('#FFF9E0')
    .roundedRect(x, cy, width, footerBoxH, 4)
    .fill();
  doc
    .strokeColor(gold)
    .lineWidth(1)
    .roundedRect(x, cy, width, footerBoxH, 4)
    .stroke();
  doc
    .fillColor('#8B6914')
    .text(footerCopy, x + DESIRABLE_LBM_BAR.footerPad, cy + DESIRABLE_LBM_BAR.footerPad, {
      width: footerInnerW,
      align: 'center',
      lineGap: 2,
    });

  return cy + footerBoxH + LAYOUT.paragraphGap;
}

const LBA_SNAPSHOT = Object.freeze({
  pad: 10,
  profileLabelSize: PRINT_TEMPLATE_LBA_SNAPSHOT.profileLabel,
  profileValueSize: PRINT_TEMPLATE_LBA_SNAPSHOT.profileValue,
  todayTitleSize: PRINT_TEMPLATE_LBA_SNAPSHOT.todayTitle,
  todayHeadSize: PRINT_TEMPLATE_LBA_SNAPSHOT.todayHead,
  todayBodySize: PRINT_TEMPLATE_LBA_SNAPSHOT.todayBody,
  todayRowPad: 6,
  todayColGap: 22,
  sectionGap: 8,
  ruleInset: 10,
});

const LBA_TODAY_TITLE = '--TODAY--';

function lbaToday1982PctDisplay(pct) {
  const raw = String(pct ?? '').trim().replace(/%$/, '');
  return raw ? `${raw} %` : '—';
}

/** Compact three-column block widths — centered like 1982 Lean Body Analysis. */
function lbaTodayBlockLayout(doc, todayRows) {
  const bodySize = LBA_SNAPSHOT.todayBodySize;
  doc.font(SEMINAR_FONTS.bold).fontSize(bodySize);
  const labelColW = todayRows.reduce(
    (max, row) => Math.max(max, doc.widthOfString(String(row.label || ''))),
    doc.widthOfString('TOTAL'),
  );
  doc.font(SEMINAR_FONTS.regular).fontSize(bodySize);
  const pctColW = todayRows.reduce(
    (max, row) => Math.max(max, doc.widthOfString(lbaToday1982PctDisplay(row.pct))),
    doc.widthOfString('100.00 %'),
  );
  const lbsColW = todayRows.reduce(
    (max, row) => Math.max(max, doc.widthOfString(String(row.lbs || ''))),
    doc.widthOfString('184.0 lbs.'),
  );
  const gap = LBA_SNAPSHOT.todayColGap;
  return {
    labelColW,
    pctColW,
    lbsColW,
    blockW: labelColW + gap + pctColW + gap + lbsColW,
    rowH: bodySize + LBA_SNAPSHOT.todayRowPad * 2,
  };
}

function measureLbaProfileSection(doc, profileStats, width) {
  const pad = LBA_SNAPSHOT.pad;
  const colW = width / Math.max(profileStats?.length || 1, 1);
  const innerW = colW - pad;

  doc.font(SEMINAR_FONTS.bold).fontSize(LBA_SNAPSHOT.profileLabelSize);
  const profileLabelH = doc.heightOfString('HEIGHT', { width: innerW });
  doc.font(SEMINAR_FONTS.regular).fontSize(LBA_SNAPSHOT.profileValueSize);
  const profileValueH = profileStats.reduce(
    (max, stat) => Math.max(
      max,
      doc.heightOfString(String(stat.value || ''), { width: innerW, lineGap: 1 }),
    ),
    0,
  );
  return pad + profileLabelH + 3 + profileValueH + pad;
}

function measureLbaTodaySection(doc, todayRows) {
  const { rowH } = lbaTodayBlockLayout(doc, todayRows);
  const todayTitleH = LBA_SNAPSHOT.todayTitleSize;
  return LBA_SNAPSHOT.sectionGap + todayTitleH + 4 + rowH * todayRows.length + LBA_SNAPSHOT.pad;
}

function measureLbaSnapshotCard(doc, profileStats, todayRows, width) {
  return measureLbaProfileSection(doc, profileStats, width)
    + 1
    + measureLbaTodaySection(doc, todayRows);
}

function drawLbaToday1982Cell(doc, text, cellX, cellY, cellW, { font, fontSize, align = 'left' }) {
  doc.font(font).fontSize(fontSize).fillColor(SEMINAR_COLORS.body);
  const textW = doc.widthOfString(String(text));
  let textX = cellX;
  if (align === 'right') textX = cellX + cellW - textW;
  else if (align === 'center') textX = cellX + (cellW - textW) / 2;
  doc.text(String(text), textX, cellY + LBA_SNAPSHOT.todayRowPad, { lineBreak: false });
}

function drawLbaSnapshotCard(doc, x, y, width, profileStats, todayRows) {
  const pad = LBA_SNAPSHOT.pad;
  const totalH = measureLbaSnapshotCard(doc, profileStats, todayRows, width);
  const colCount = Math.max(profileStats?.length || 1, 1);
  const colW = width / colCount;
  const blue = '#2F6FA8';
  let cy = y;

  doc
    .strokeColor(TABLE_CONTAINER.stroke)
    .lineWidth(1.25)
    .roundedRect(x, y, width, totalH, TABLE_CONTAINER.radius)
    .stroke();

  profileStats.forEach((stat, index) => {
    const colX = x + colW * index;
    doc
      .font(SEMINAR_FONTS.bold)
      .fontSize(LBA_SNAPSHOT.profileLabelSize)
      .fillColor(blue)
      .text(String(stat.label || ''), colX + pad, cy + pad, {
        width: colW - pad * 2,
        lineGap: 0,
        align: 'center',
      });
    doc
      .font(SEMINAR_FONTS.regular)
      .fontSize(LBA_SNAPSHOT.profileValueSize)
      .fillColor(SEMINAR_COLORS.body)
      .text(String(stat.value || ''), colX + pad, cy + pad + LBA_SNAPSHOT.profileLabelSize + 3, {
        width: colW - pad * 2,
        lineGap: 1,
        align: 'center',
      });
  });

  const profileH = measureLbaProfileSection(doc, profileStats, width);
  cy = y + profileH;
  doc
    .strokeColor(TABLE_CONTAINER.stroke)
    .lineWidth(0.5)
    .moveTo(x + LBA_SNAPSHOT.ruleInset, cy)
    .lineTo(x + width - LBA_SNAPSHOT.ruleInset, cy)
    .stroke();

  cy += LBA_SNAPSHOT.sectionGap;
  doc
    .font(SEMINAR_FONTS.bold)
    .fontSize(LBA_SNAPSHOT.todayTitleSize)
    .fillColor(blue)
    .text(LBA_TODAY_TITLE, x, cy, { width, align: 'center', lineGap: 0 });
  cy += LBA_SNAPSHOT.todayTitleSize + 4;

  const { labelColW, pctColW, lbsColW, blockW, rowH } = lbaTodayBlockLayout(doc, todayRows);
  const gap = LBA_SNAPSHOT.todayColGap;
  const blockX = x + (width - blockW) / 2;
  const pctX = blockX + labelColW + gap;
  const lbsX = pctX + pctColW + gap;
  const bodySize = LBA_SNAPSHOT.todayBodySize;

  todayRows.forEach((row) => {
    drawLbaToday1982Cell(doc, row.label, blockX, cy, labelColW, {
      font: SEMINAR_FONTS.bold,
      fontSize: bodySize,
      align: 'left',
    });
    drawLbaToday1982Cell(doc, lbaToday1982PctDisplay(row.pct), pctX, cy, pctColW, {
      font: SEMINAR_FONTS.regular,
      fontSize: bodySize,
      align: 'right',
    });
    drawLbaToday1982Cell(doc, row.lbs, lbsX, cy, lbsColW, {
      font: SEMINAR_FONTS.regular,
      fontSize: bodySize,
      align: 'right',
    });
    cy += rowH;
  });

  return y + totalH;
}

const LBA_BF_RANGE_TABLE = Object.freeze({
  labelSize: 9.5,
  rangeSize: 9,
  rowPad: 7,
});

const LBA_STATUS_STYLES = Object.freeze({
  'CONGRATULATIONS!': { color: '#1B7A3E' },
  'ALERT!': { color: '#8B0000' },
});

function parseLbaStatusPrefix(text) {
  const str = String(text || '');
  for (const prefix of Object.keys(LBA_STATUS_STYLES)) {
    if (str.startsWith(prefix)) {
      return {
        prefix,
        rest: str.slice(prefix.length),
        color: LBA_STATUS_STYLES[prefix].color,
      };
    }
  }
  return null;
}

function drawLbaStatusParagraph(doc, payload, page, paragraph, typography, { fullHeader = false } = {}) {
  if (!paragraph) return page;
  const status = parseLbaStatusPrefix(paragraph);
  const blockH = measureParagraph(doc, paragraph, page.width, typography);
  let current = ensureLockedSpace(doc, payload, page, blockH, { fullHeader });

  if (!status) {
    doc
      .font(SEMINAR_FONTS.regular)
      .fontSize(typography.bodySize)
      .fillColor(SEMINAR_COLORS.body)
      .text(String(paragraph), current.x, current.y, {
        width: current.width,
        lineGap: typography.lineGap,
        align: 'left',
      });
    return { ...current, y: doc.y + typography.paragraphGap };
  }

  doc
    .font(SEMINAR_FONTS.bold)
    .fontSize(typography.bodySize)
    .fillColor(status.color)
    .text(status.prefix, current.x, current.y, {
      continued: true,
      lineGap: typography.lineGap,
    });
  doc
    .font(SEMINAR_FONTS.regular)
    .fontSize(typography.bodySize)
    .fillColor(SEMINAR_COLORS.body)
    .text(status.rest, {
      width: current.width,
      lineGap: typography.lineGap,
      align: 'left',
    });
  return { ...current, y: doc.y + typography.paragraphGap };
}

function drawLbaBodyParagraphs(doc, payload, page, paragraphs, options = {}) {
  const typography = resolveBodyTypography(options);
  let current = page;
  (paragraphs || []).forEach((paragraph) => {
    current = drawLbaStatusParagraph(doc, payload, current, paragraph, typography, options);
  });
  return current;
}

function lbaBfRangeTableColumns(count) {
  const columnCount = Math.max(1, Number(count) || 1);
  const width = 1 / columnCount;
  return Array.from({ length: columnCount }, (_, index) => ({
    key: `c${index}`,
    width,
    align: 'center',
  }));
}

function lbaBfRangeRowFromCategories(categories, valueKey) {
  return Object.fromEntries(
    categories.map((cat, index) => {
      let value = cat[valueKey] || '';
      if (valueKey === 'label') value = String(value).toUpperCase();
      return [`c${index}`, value];
    }),
  );
}

function measureLbaBfRangeTable(doc, categories, width, { headerKey, valueKey }) {
  return measureLayoutTable(doc, {
    columns: lbaBfRangeTableColumns(categories.length),
    rows: [
      lbaBfRangeRowFromCategories(categories, headerKey),
      lbaBfRangeRowFromCategories(categories, valueKey),
    ],
    headerRows: 1,
    headFontSize: LBA_BF_RANGE_TABLE.labelSize,
    bodyFontSize: LBA_BF_RANGE_TABLE.rangeSize,
    tableRowPad: LBA_BF_RANGE_TABLE.rowPad,
    width,
  });
}

function drawLbaBfRangeTable(doc, x, y, width, categories, { headerKey, valueKey }) {
  return drawLayoutTable(doc, {
    x,
    y,
    width,
    columns: lbaBfRangeTableColumns(categories.length),
    rows: [
      lbaBfRangeRowFromCategories(categories, headerKey),
      lbaBfRangeRowFromCategories(categories, valueKey),
    ],
    headerRows: 1,
    headFontSize: LBA_BF_RANGE_TABLE.labelSize,
    bodyFontSize: LBA_BF_RANGE_TABLE.rangeSize,
    tableRowPad: LBA_BF_RANGE_TABLE.rowPad,
  });
}

function drawLbaBfRangeSection(doc, payload, page, lba) {
  const categories = lba.bfRangeCategories || [];
  const weightRanges = lba.bfRangeWeightRanges || [];
  if (!categories.length) return page;

  if (lba.bfRangeLead) {
    page = drawBodyParagraphs(doc, payload, page, [lba.bfRangeLead], { paragraphGap: 4 });
  }

  let tableH = measureLbaBfRangeTable(doc, categories, page.width, {
    headerKey: 'label',
    valueKey: 'bfRangeLabel',
  });
  page = ensureLockedSpace(doc, payload, page, tableH + LAYOUT.sectionGap);
  page = {
    ...page,
    y: drawLbaBfRangeTable(doc, page.x, page.y, page.width, categories, {
      headerKey: 'label',
      valueKey: 'bfRangeLabel',
    }) + LAYOUT.sectionGap,
  };

  const lbmParagraphs = (lba.lbmParagraphs || []).filter(Boolean);
  if (lbmParagraphs.length) {
    page = drawLbaBodyParagraphs(doc, payload, page, lbmParagraphs, { fullHeader: true });
    page = { ...page, y: page.y + LAYOUT.sectionGap };
  }

  tableH = measureLbaBfRangeTable(doc, weightRanges, page.width, {
    headerKey: 'label',
    valueKey: 'weightRangeLabel',
  });
  page = ensureLockedSpace(doc, payload, page, tableH);
  return {
    ...page,
    y: drawLbaBfRangeTable(doc, page.x, page.y, page.width, weightRanges, {
      headerKey: 'label',
      valueKey: 'weightRangeLabel',
    }),
  };
}

function drawLeanBodyAnalysisPage(doc, payload) {
  const lba = payload.leanBodyAnalysis;
  let page = startLockedPage(doc, payload, 'Lean Body Analysis');

  const profileStats = lba.profileStats || [];
  const todayRows = lba.todayRows || [];
  if (profileStats.length && todayRows.length) {
    const snapshotH = measureLbaSnapshotCard(doc, profileStats, todayRows, page.width);
    page = ensureLockedSpace(doc, payload, page, snapshotH + LAYOUT.sectionGap);
    page = {
      ...page,
      y: drawLbaSnapshotCard(doc, page.x, page.y, page.width, profileStats, todayRows) + LAYOUT.sectionGap,
    };
  }

  if (lba.bfRangeCategories?.length) {
    page = drawLbaBfRangeSection(doc, payload, page, lba);
  }

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

function buildServingsTableRows(gridRows, extraFats = []) {
  const extraRows = extraFats.map((line, index) => ({
    label: index === 0 ? EXTRA_FATS_LABEL : '',
    daily: line.value,
    breakfast: line.note,
    snack1: '',
    lunch: '',
    snack2: '',
    dinner: '',
    snack3: '',
    _colSpan: { from: 'breakfast', to: 'snack3' },
  }));

  return [
    {
      label: '',
      daily: 'Daily',
      breakfast: 'Breakfast',
      snack1: 'Fruit',
      lunch: 'Lunch',
      snack2: 'Fruit',
      dinner: 'Dinner',
      snack3: 'Fruit',
    },
    ...gridRows,
    ...extraRows,
  ];
}

function drawServingsTable(doc, payload, page, gridRows, extraFats = []) {
  const servingsTableOpts = {
    x: page.x,
    y: page.y,
    width: page.width,
    columns: SERVINGS_TABLE_COLUMNS,
    rows: buildServingsTableRows(gridRows, extraFats),
    headerRows: 1,
  };
  page = ensureLockedSpace(doc, payload, page, measureLayoutTable(doc, servingsTableOpts));
  servingsTableOpts.y = page.y;
  return { ...page, y: drawLayoutTable(doc, servingsTableOpts) + LAYOUT.sectionGap };
}

function foodPlanNarrativeBlock(payload, title) {
  return payload.foodPlanNarrative?.blocks?.find((block) => block.title === title);
}

function foodPlanServingsBlock(payload) {
  const blocks = payload.foodPlanNarrative?.blocks || [];
  return blocks.find((block) => /servings/i.test(String(block.title || '')));
}

function foodPlanPreambleParagraphs(fp) {
  const intro = fp?.macroSignalIntro
    ? (Array.isArray(fp.macroSignalIntro) ? fp.macroSignalIntro : [fp.macroSignalIntro])
    : [];
  return [...(fp?.lead || []), ...intro].filter(Boolean);
}

const FOOD_PLAN_PAGE_TYPO = Object.freeze({
  lineGap: LAYOUT.lineGap,
  paragraphGap: 8,
  beforeTableGap: 6,
  afterTableGap: 14,
});

function drawFoodPlanTitledProse(doc, payload, page, titled, typo) {
  const titleH = measureParagraph(doc, titled.title, page.width, {
    bodySize: LAYOUT.subsectionSize,
    lineGap: typo.lineGap,
    paragraphGap: 0,
  });
  const bodyH = (titled.paragraphs || []).reduce(
    (sum, paragraph) => sum + measureParagraph(doc, paragraph, page.width, typo),
    0,
  );
  page = ensureLockedSpace(
    doc,
    payload,
    page,
    LAYOUT.sectionGap + titleH + LAYOUT.headerGap + bodyH,
  );
  page = { ...page, y: page.y + LAYOUT.sectionGap };
  doc
    .font(SEMINAR_FONTS.boldItalic)
    .fontSize(LAYOUT.subsectionSize)
    .fillColor(SEMINAR_COLORS.body)
    .text(titled.title, page.x, page.y, { width: page.width, lineGap: 0 });
  page = { ...page, y: doc.y + LAYOUT.headerGap };
  return drawBodyParagraphs(doc, payload, page, titled.paragraphs, typo);
}

function drawFoodPlanPage(doc, payload) {
  const fp = payload.foodPlan;
  let page = startLockedPage(doc, payload, 'Food Plan');
  const typo = FOOD_PLAN_PAGE_TYPO;

  const preamble = foodPlanPreambleParagraphs(fp);
  if (preamble.length) {
    page = drawBodyParagraphs(doc, payload, page, preamble, typo);
    page = { ...page, y: page.y + typo.beforeTableGap };
  }

  const macroRows = fp.macroSignalRows || [];
  if (macroRows.length) {
    const macroTableH = measureMacroSignalLayoutTable(doc, page.width, macroRows);
    page = ensureLockedSpace(doc, payload, page, macroTableH + typo.afterTableGap);
    const tableBottomY = drawMacroSignalLayoutTable(doc, {
      x: page.x,
      y: page.y,
      width: page.width,
      rows: macroRows,
    });
    page = { ...page, y: tableBottomY + typo.afterTableGap };
  }

  if (fp.howToParagraphs?.length) {
    page = drawBodyParagraphs(doc, payload, page, fp.howToParagraphs, typo);
  } else {
    const servingsBlock = foodPlanServingsBlock(payload);
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
  }

  if (fp.measureTip) {
    page = drawBodyParagraphs(doc, payload, page, [fp.measureTip], typo);
  }
  if (fp.toUseThisPlan?.paragraphs?.length) {
    page = drawFoodPlanTitledProse(doc, payload, page, fp.toUseThisPlan, typo);
  }

  finishLockedPage(doc, page.box, payload);
}

const SERVINGS_STEPS_TYPO = { lineGap: 1, paragraphGap: 3 };
const SERVINGS_RULES_BREAK_GAP = 6;
const SERVINGS_DAILY_RULES_COUNT = 3;
const SERVINGS_AFTER_DAILY_RULES_GAP = PT.body + PT.lineGap;

function drawMealBuildSteps(doc, payload, page, steps) {
  const splitAt = steps.findIndex((paragraph) => /^1\. Eat/.test(String(paragraph)));
  if (splitAt <= 0) {
    return drawBodyParagraphs(doc, payload, page, steps, SERVINGS_STEPS_TYPO);
  }
  page = drawBodyParagraphs(doc, payload, page, steps.slice(0, splitAt), SERVINGS_STEPS_TYPO);
  page = { ...page, y: page.y + SERVINGS_RULES_BREAK_GAP };

  const rulesEnd = splitAt + SERVINGS_DAILY_RULES_COUNT;
  page = drawBodyParagraphs(doc, payload, page, steps.slice(splitAt, rulesEnd), SERVINGS_STEPS_TYPO);
  page = { ...page, y: page.y + SERVINGS_AFTER_DAILY_RULES_GAP };

  if (rulesEnd < steps.length) {
    page = drawBodyParagraphs(doc, payload, page, steps.slice(rulesEnd), SERVINGS_STEPS_TYPO);
  }
  return page;
}

function drawServingsPage(doc, payload) {
  const servings = payload.servings;
  let page = startLockedPage(doc, payload, 'Servings');

  if (servings.intro?.length) {
    page = drawBodyParagraphs(doc, payload, page, servings.intro);
  }

  page = drawBodyParagraphs(doc, payload, page, [servings.note]);

  const gridRows = servings.gridRows.map((row) => ({ ...row }));
  page = drawServingsTable(doc, payload, page, gridRows, servings.extraFats || []);

  if (servings.mealBuildSteps?.length) {
    page = drawMealBuildSteps(doc, payload, page, servings.mealBuildSteps);
  }

  finishLockedPage(doc, page.box, payload);
}

const CONFIRMATION_TABLE_COLUMNS = Object.freeze([
  { key: 'label', width: 0.34 },
  { key: 'value', width: 0.66 },
]);

function drawQuestionnaireConfirmationPage(doc, payload) {
  const confirmation = payload.questionnaireConfirmation;
  if (!confirmation?.rows?.length) return;

  let page = startLockedPage(doc, payload, 'Questionnaire confirmation');

  if (confirmation.intro) {
    page = drawBodyParagraphs(doc, payload, page, [confirmation.intro]);
  }

  const tableOpts = {
    x: page.x,
    y: page.y,
    width: page.width,
    columns: CONFIRMATION_TABLE_COLUMNS,
    rows: confirmation.rows.map((row) => ({
      label: row.label,
      value: row.value,
    })),
    headerRows: 0,
    tableRowPad: LAYOUT.tableRowPad + 1,
  };

  page = ensureLockedSpace(doc, payload, page, measureLayoutTable(doc, tableOpts));
  tableOpts.y = page.y;
  page = { ...page, y: drawLayoutTable(doc, tableOpts) + LAYOUT.sectionGap };

  finishLockedPage(doc, page.box, payload);
}

export async function renderProgramReportKwarnerLockedPreview(payload, { title, buildLabel } = {}) {
  validatePrintPayload('programreport', payload);

  const creator = createPrintPdf({
    title: title || payload.title || BURN_AND_BUILD_DIET_PDF_NAME,
    author: 'Burn & Build Diet',
  });

  const doc = creator.doc;
  if (buildLabel) {
    doc.info.Subject = `${BURN_AND_BUILD_DIET_PDF_NAME} sample ${buildLabel}`;
  }

  drawWelcomePage(doc, payload);
  drawLeanBodyAnalysisPage(doc, payload);
  drawFoodPlanPage(doc, payload);
  drawServingsPage(doc, payload);
  drawStaplesFoodListPage(doc, payload);
  drawVegFruitFoodListPage(doc, payload);
  drawQuestionnaireConfirmationPage(doc, payload);

  stampPinnedProgramFooters(doc, payload.header);

  const buffer = await creator.finish({ stampPageNumbers: false });
  const pages = (buffer.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  if (pages < PROGRAM_REPORT_MIN_PAGES) {
    throw new Error(`Preview PDF expected at least ${PROGRAM_REPORT_MIN_PAGES} pages, got ${pages}`);
  }
  return buffer;
}
