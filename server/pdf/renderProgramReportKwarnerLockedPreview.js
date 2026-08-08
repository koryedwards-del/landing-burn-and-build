/**
 * Preview-only: KWarner 5-page seminar content + locked personalized frame.
 * Not wired to production API — run scripts/render-kwarner-locked-preview.mjs
 */
import { createPrintPdf } from './creator.js';
import {
  addFramePage,
  drawContinuationHeader,
  drawFramePageTitle,
  framePageTitleStartY,
  pinnedContentBottomY,
  stampPinnedProgramFooters,
  PDF_FRAME_COLORS,
} from './drawFrame.js';
import { drawPersonalizationHeader } from './drawSeminar.js';
import {
  SEMINAR_COLORS,
  SEMINAR_FONTS,
} from './drawSeminar.js';
import { validatePrintPayload } from './validate.js';
import { PRINT_TEMPLATE_TYPOGRAPHY as PT } from '../../js/printTemplateTypography.js';
import { drawCalloutRow } from './drawProgramReportNarrative.js';
import {
  CUTTING_STAPLES_FRUIT,
  CUTTING_STAPLES_GRAINS_STARCHES,
  CUTTING_STAPLES_PROTEIN_DAIRY,
  CUTTING_STAPLES_VEGETABLES,
  GROCERY_STAPLES_PANTRY,
} from '../../data/cuttingStaplesPrintout.js';
import {
  COMMON_SPLASHES,
  FLAVOR_KIT_RULE,
  flavorKitList,
  SPLASH_RULE,
} from '../../menuplanner/data/flavorKits.js';
import { QUESTIONNAIRE_JOB_OPTIONS, WORK_STRESS } from '../../js/onboardingEngine.js';

export const KWARNER_LOCKED_MIN_PAGES = 7;

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

  return opts.rows.map((row, rowIndex) => {
    const isHeader = rowIndex < headerRows;
    let maxH = (opts.bodyFontSize ?? LAYOUT.tableBodySize) + LAYOUT.tableRowPad * 2;
    columns.forEach((col, index) => {
      if (isTableColumnSpanned(columns, row, index)) return;
      const cell = row[col.key] ?? '';
      const { font, fontSize } = resolveTableCellStyle(opts, row, rowIndex, col);
      const h = doc.font(font).fontSize(fontSize).heightOfString(String(cell), {
        width: tableCellWidth(colWidths, columns, row, index) - TABLE_CONTAINER.cellPad * 2,
        lineGap: 0,
      });
      maxH = Math.max(maxH, h + LAYOUT.tableRowPad * 2);
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

function drawStaplesFoodListPage(doc, payload) {
  let page = startLockedPage(doc, payload, 'Food List');
  const columns = staplesColumnLayout(page);
  const ruleX = columns[0].x + columns[0].width + STAPLES_LIST.columnGap / 2;
  drawStaplesColumnRule(doc, ruleX, page.y, page.bottom);
  drawStaplesColumn(doc, 'Protein Staples', CUTTING_STAPLES_PROTEIN_DAIRY, columns[0], page.y, page.bottom);

  let gsTitleY = drawSectionTitle(doc, 'Grains & Starches', columns[1].x, page.y, columns[1].width);
  let gsIndex = 0;
  let result = drawStapleListItems(
    doc,
    CUTTING_STAPLES_GRAINS_STARCHES,
    columns[1],
    gsTitleY,
    page.bottom,
    gsIndex,
  );
  gsIndex = result.nextIndex;

  while (gsIndex < CUTTING_STAPLES_GRAINS_STARCHES.length) {
    finishLockedPage(doc, page.box, payload);
    page = startLockedPage(doc, payload, null);
    drawStaplesColumnRule(doc, ruleX, page.y, page.bottom);
    result = drawStapleListItems(
      doc,
      CUTTING_STAPLES_GRAINS_STARCHES,
      columns[1],
      page.y,
      page.bottom,
      gsIndex,
    );
    gsIndex = result.nextIndex;
  }

  if (gsIndex !== CUTTING_STAPLES_GRAINS_STARCHES.length) {
    throw new Error(`Grains/starches list truncated: drew ${gsIndex} of ${CUTTING_STAPLES_GRAINS_STARCHES.length}`);
  }

  finishLockedPage(doc, page.box, payload);
}

function drawVegFruitFoodListPage(doc, payload) {
  let vegIndex = 0;
  let fruitIndex = 0;
  let firstPage = true;

  while (vegIndex < CUTTING_STAPLES_VEGETABLES.length || fruitIndex < CUTTING_STAPLES_FRUIT.length) {
    const page = startLockedPage(doc, payload, firstPage ? 'Food List' : null);
    firstPage = false;
    const columns = staplesColumnLayout(page);
    const ruleX = columns[0].x + columns[0].width + STAPLES_LIST.columnGap / 2;
    drawStaplesColumnRule(doc, ruleX, page.y, page.bottom);

    if (vegIndex < CUTTING_STAPLES_VEGETABLES.length) {
      let y = page.y;
      if (vegIndex === 0) {
        y = drawSectionTitle(doc, 'Vegetables', columns[0].x, y, columns[0].width);
      }
      vegIndex = drawStapleListItems(
        doc,
        CUTTING_STAPLES_VEGETABLES,
        columns[0],
        y,
        page.bottom,
        vegIndex,
      ).nextIndex;
    }

    if (fruitIndex < CUTTING_STAPLES_FRUIT.length) {
      let y = page.y;
      if (fruitIndex === 0) {
        y = drawSectionTitle(doc, 'Fruit', columns[1].x, y, columns[1].width);
      }
      fruitIndex = drawStapleListItems(
        doc,
        CUTTING_STAPLES_FRUIT,
        columns[1],
        y,
        page.bottom,
        fruitIndex,
      ).nextIndex;
    }

    finishLockedPage(doc, page.box, payload);
  }

  if (vegIndex !== CUTTING_STAPLES_VEGETABLES.length) {
    throw new Error(`Vegetable list truncated: drew ${vegIndex} of ${CUTTING_STAPLES_VEGETABLES.length}`);
  }
  if (fruitIndex !== CUTTING_STAPLES_FRUIT.length) {
    throw new Error(`Fruit list truncated: drew ${fruitIndex} of ${CUTTING_STAPLES_FRUIT.length}`);
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
        .text(String(row[col.key] ?? ''), cx + pad, cy + LAYOUT.tableRowPad, {
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

  page = drawBodyParagraphs(doc, payload, page, payload.welcome.intro, {
    fullHeader: true,
    pageTitle: 'Welcome',
  });
  page = { ...page, y: page.y + LAYOUT.sectionGap };

  const sections = [
    ['Projections', payload.welcome.projections],
    ['Food Plan', payload.welcome.foodPlan],
    ['Servings', payload.welcome.servings],
  ].filter(([, body]) => body);

  sections.forEach(([title, body], index) => {
    page = ensureLockedSpace(
      doc,
      payload,
      page,
      LAYOUT.subsectionSize + LAYOUT.headerGap + measureParagraph(doc, body, page.width),
      { fullHeader: true },
    );
    page = { ...page, y: drawSectionTitle(doc, title, page.x, page.y, page.width) };
    page = drawBodyParagraphs(doc, payload, page, [body], { fullHeader: true, pageTitle: 'Welcome' });
    if (index < sections.length - 1) {
      page = { ...page, y: page.y + LAYOUT.sectionGap };
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

function measureProjectionTimelineTable(doc, opts) {
  const pad = TABLE_CONTAINER.cellPad;
  const colW = opts.width / 3;
  const innerW = colW - pad * 2;
  const keys = opts.keys ?? ['weight', 'timeline', 'bodyFat'];

  return opts.rows.map((row, rowIndex) => {
    const isHeader = rowIndex < (opts.headerRows ?? 1);
    let maxH = LAYOUT.tableRowPad * 2;
    keys.forEach((key) => {
      const style = resolveCenteredTableCellStyle(opts, row, rowIndex, key, { isHeader });
      const h = doc.font(style.font).fontSize(style.fontSize).heightOfString(String(row[key] ?? ''), {
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
      const style = resolveCenteredTableCellStyle(opts, row, rowIndex, key, { isHeader });
      drawCenteredTableCell(doc, row[key], cellX, cy, colW, rh, style);
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
        type: 'radio',
        title: 'JOB',
        selectedId: fp.workPhysical,
        options: QUESTIONNAIRE_JOB_OPTIONS,
      },
      {
        type: 'radio',
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
  /** Match projection table horizontal inset (`TABLE_CONTAINER.cellPad`). */
  cellPad: TABLE_CONTAINER.cellPad,
  /** Match projection table vertical inset (`LAYOUT.tableRowPad`). */
  cellPadV: LAYOUT.tableRowPad,
  /** Match projection table header row (BODYWEIGHT, TIMELINE, …). */
  titleSize: PROJECTION_TABLE_HEAD_SIZE,
  /** Match projection table data rows (184 lbs, Current, …). */
  textSize: PT.subsection,
  /** Space between cell title and content — ~one content line. */
  titleGap: PT.subsection,
  radio: {
    radioRadius: 2.5,
    labelPad: 7,
  },
};

function radioOptionFontSize(doc, cell, innerW) {
  const { textSize } = INPUT_GRID;
  const { labelPad } = INPUT_GRID.radio;
  const slotW = innerW / cell.options.length;
  let size = textSize;
  while (size > 6) {
    let fits = true;
    cell.options.forEach((option) => {
      doc.font(SEMINAR_FONTS.regular).fontSize(size);
      if (labelPad + doc.widthOfString(option.label) > slotW - 2) fits = false;
    });
    if (fits) return size;
    size -= 0.25;
  }
  return 6;
}

function measureRadioOptionRow(doc, cell, innerW) {
  const optionSize = radioOptionFontSize(doc, cell, innerW);
  const { radioRadius } = INPUT_GRID.radio;
  const radioD = radioRadius * 2;
  doc.font(SEMINAR_FONTS.regular).fontSize(optionSize);
  return Math.max(doc.currentLineHeight(), radioD);
}

function drawRadioOptionRow(doc, cell, x, y, innerW) {
  const optionSize = radioOptionFontSize(doc, cell, innerW);
  const { labelPad, radioRadius } = INPUT_GRID.radio;
  const slotW = innerW / cell.options.length;
  const radioD = radioRadius * 2;
  doc.font(SEMINAR_FONTS.regular).fontSize(optionSize);
  const lineH = doc.currentLineHeight();
  const rowH = Math.max(lineH, radioD);
  cell.options.forEach((option, index) => {
    const selected = option.id === cell.selectedId;
    const font = selected ? SEMINAR_FONTS.bold : SEMINAR_FONTS.regular;
    const slotX = x + slotW * index;
    doc.font(font).fontSize(optionSize);
    const labelW = doc.widthOfString(option.label);
    const groupW = labelPad + labelW;
    const startX = slotX + Math.max(0, (slotW - groupW) / 2);
    const textY = y + (rowH - lineH) / 2 + lineH * 0.78;
    const radioY = textY - lineH * 0.38 - radioRadius;
    drawPdfRadioButton(doc, startX, radioY, radioRadius, selected);
    doc
      .font(font)
      .fontSize(optionSize)
      .fillColor(SEMINAR_COLORS.body)
      .text(option.label, startX + labelPad, textY, { lineBreak: false });
  });
}

function metricValueLine(cell) {
  return `${cell.value} ${cell.unit}`;
}

function metricCellTypography() {
  return {
    labelFont: SEMINAR_FONTS.bold,
    labelSize: INPUT_GRID.titleSize,
    valueFont: SEMINAR_FONTS.regular,
    valueSize: INPUT_GRID.textSize,
    labelGap: INPUT_GRID.titleGap,
  };
}

function measureMetricInputCell(doc, cell, innerW) {
  const { labelFont, labelSize, valueFont, valueSize, labelGap } = metricCellTypography(cell);
  doc.font(labelFont).fontSize(labelSize);
  const labelH = doc.heightOfString(cell.label, { width: innerW, align: 'center', lineGap: 0 });
  doc.font(valueFont).fontSize(valueSize);
  const valueH = doc.heightOfString(metricValueLine(cell), { width: innerW, align: 'center', lineGap: 0 });
  return labelH + labelGap + valueH;
}

function measureRadioInputCell(doc, cell, innerW) {
  const { titleSize, titleGap } = INPUT_GRID;
  doc.font(SEMINAR_FONTS.bold).fontSize(titleSize);
  const titleH = doc.heightOfString(cell.title, { width: innerW, align: 'center', lineGap: 0 }) + titleGap;
  return titleH + measureRadioOptionRow(doc, cell, innerW);
}

function measureInputCell(doc, cell, innerW) {
  if (cell.type === 'radio') return measureRadioInputCell(doc, cell, innerW);
  return measureMetricInputCell(doc, cell, innerW);
}

function measureProjectionsInputGrid(doc, fp, width) {
  const { cellPad, cellPadV } = INPUT_GRID;
  const colW = width / 3;
  const innerW = colW - cellPad * 2;
  const rows = buildProjectionsInputGridRows(fp);
  const rowHeights = rows.map((row) => {
    let contentH = 0;
    row.forEach((cell) => {
      contentH = Math.max(contentH, measureInputCell(doc, cell, innerW));
    });
    return cellPadV * 2 + contentH;
  });
  return rowHeights.reduce((sum, h) => sum + h, 0);
}

function drawPdfRadioButton(doc, x, y, radius, selected) {
  const cx = x + radius;
  const cy = y + radius;
  doc
    .strokeColor(SEMINAR_COLORS.body)
    .lineWidth(0.75)
    .circle(cx, cy, radius)
    .stroke();
  if (selected) {
    doc.fillColor(SEMINAR_COLORS.body).circle(cx, cy, radius * 0.5).fill();
  }
}

function drawMetricInputCell(doc, cell, x, y, innerW, cellH) {
  const { cellPad, cellPadV } = INPUT_GRID;
  const { labelFont, labelSize, valueFont, valueSize, labelGap } = metricCellTypography(cell);
  const valueLine = metricValueLine(cell);
  const contentH = measureMetricInputCell(doc, cell, innerW);
  let cy = y + (cellH - contentH) / 2;
  doc
    .font(labelFont)
    .fontSize(labelSize)
    .fillColor(SEMINAR_COLORS.body)
    .text(cell.label, x + cellPad, cy, {
      width: innerW,
      align: 'center',
      lineGap: 0,
    });
  cy += doc.heightOfString(cell.label, { width: innerW, lineGap: 0 }) + labelGap;
  doc
    .font(valueFont)
    .fontSize(valueSize)
    .fillColor(SEMINAR_COLORS.body)
    .text(valueLine, x + cellPad, cy, { width: innerW, align: 'center', lineGap: 0 });
}

function drawRadioInputCell(doc, cell, x, y, innerW, cellH) {
  const { cellPad, titleSize, titleGap } = INPUT_GRID;
  const contentH = measureRadioInputCell(doc, cell, innerW);
  let cy = y + (cellH - contentH) / 2;

  doc
    .font(SEMINAR_FONTS.bold)
    .fontSize(titleSize)
    .fillColor(SEMINAR_COLORS.body)
    .text(cell.title, x + cellPad, cy, { width: innerW, align: 'center', lineGap: 0 });
  cy += doc.heightOfString(cell.title, { width: innerW, lineGap: 0 }) + titleGap;

  drawRadioOptionRow(doc, cell, x + cellPad, cy, innerW);
}

function drawInputCell(doc, cell, x, y, innerW, cellH) {
  if (cell.type === 'radio') {
    drawRadioInputCell(doc, cell, x, y, innerW, cellH);
    return;
  }
  drawMetricInputCell(doc, cell, x, y, innerW, cellH);
}

function drawProjectionsInputGrid(doc, fp, x, y, width) {
  const { cellPad, cellPadV } = INPUT_GRID;
  const colW = width / 3;
  const innerW = colW - cellPad * 2;
  const rows = buildProjectionsInputGridRows(fp);
  const rowHeights = rows.map((row) => {
    let contentH = 0;
    row.forEach((cell) => {
      contentH = Math.max(contentH, measureInputCell(doc, cell, innerW));
    });
    return cellPadV * 2 + contentH;
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
    row.forEach((cell, colIndex) => {
      const cellX = x + colW * colIndex;
      drawInputCell(doc, cell, cellX, rowY, innerW, rowH);
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

  page = drawBodyParagraphs(doc, payload, page, [projections.intro]);

  page = drawFoodPlanInputBlock(doc, payload, page);

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

function drawLeanBodyAnalysisPage(doc, payload) {
  const lba = payload.leanBodyAnalysis;
  let page = startLockedPage(doc, payload, 'Lean Body Analysis');

  const profileLine = `Height: ${lba.heightInches} inches  Sex: ${lba.sex}  Thigh: ${lba.thigh}  Waist: ${lba.waist}  Age: ${lba.age} years of experience`;
  page = drawBodyParagraphs(doc, payload, page, [profileLine]);
  page = { ...page, y: page.y + LAYOUT.sectionGap };

  page = ensureLockedSpace(doc, payload, page, LAYOUT.subsectionSize + LAYOUT.headerGap + 60);
  page = { ...page, y: drawSectionTitle(doc, '--TODAY--', page.x, page.y, page.width) };

  page = { ...page, y: drawCalloutRow(
    doc,
    [
      { label: 'Lean weight', value: `${lba.today.leanLbs} lbs`, detail: `${lba.today.leanPct}% of you` },
      { label: 'Fat weight', value: `${lba.today.fatLbs} lbs`, detail: `${lba.today.fatPct}% of you` },
      { label: 'Total weight', value: `${lba.today.totalLbs} lbs`, detail: 'on the scale today' },
    ],
    page.x,
    page.y,
    page.width,
  ) };

  const aceTableOpts = {
    x: page.x,
    y: page.y,
    width: page.width,
    columns: lba.aceHeaders.map((_, index) => ({
      key: `c${index}`,
      width: 1 / lba.aceHeaders.length,
      align: 'center',
    })),
    rows: [
      Object.fromEntries(lba.aceCategories.map((cat, index) => [`c${index}`, cat.label])),
      Object.fromEntries(lba.aceHeaders.map((label, index) => [`c${index}`, label])),
    ],
    headerRows: 1,
  };
  page = ensureLockedSpace(doc, payload, page, measureLayoutTable(doc, aceTableOpts));
  aceTableOpts.y = page.y;
  page = { ...page, y: drawLayoutTable(doc, aceTableOpts) + LAYOUT.paragraphGap };

  const proseParagraphs = [
    lba.riskMessage,
    lba.footerCopy,
    lba.lbmLead,
    lba.lbmCongrats,
  ].filter(Boolean);
  if (proseParagraphs.length) {
    page = drawBodyParagraphs(doc, payload, page, proseParagraphs);
  }

  const weightTableOpts = {
    x: page.x,
    y: page.y,
    width: page.width,
    columns: lba.weightGoalRanges.map((_, index) => ({
      key: `c${index}`,
      width: 1 / lba.weightGoalRanges.length,
      align: 'center',
    })),
    rows: [
      Object.fromEntries(lba.weightGoalRanges.map((row, index) => [`c${index}`, row.label])),
      Object.fromEntries(lba.weightGoalRanges.map((row, index) => [`c${index}`, row.range])),
    ],
    headerRows: 1,
  };
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
