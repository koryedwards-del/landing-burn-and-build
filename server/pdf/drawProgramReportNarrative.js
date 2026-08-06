import {
  addFramePage,
  drawFrameFooter,
  drawFramePageTitle,
  drawGoldDivider,
  frameContentContainer,
  frameContentContainerBottom,
  PDF_FRAME_COLORS,
  PDF_FRAME_FONTS,
} from './drawFrame.js';
import {
  drawParagraphs,
  drawPersonalizationHeader,
  drawStartHereBox,
  drawSubsectionTitle,
  drawTable,
  SEMINAR_COLORS,
  SEMINAR_FONTS,
  SEMINAR_PDF,
} from './drawSeminar.js';

function lessonPageLayout(doc, payload, pageTitle, { showTitle = true } = {}) {
  const box = addFramePage(doc);
  const topGoldY = drawPersonalizationHeader(doc, payload, box);
  const container = frameContentContainer(box, topGoldY);
  const bottom = frameContentContainerBottom(box, topGoldY);
  let y = container.top;
  if (showTitle && pageTitle) {
    y = drawFramePageTitle(doc, pageTitle, box.x, y, box.width);
  }
  return { box, x: box.x, y, width: box.width, bottom };
}

function finishLessonPage(doc, page, payload) {
  drawFrameFooter(doc, page.box, payload.header);
}

function ensureSpace(doc, payload, page, needed, pageTitle) {
  if (page.y + needed <= page.bottom) return page;
  finishLessonPage(doc, page, payload);
  return lessonPageLayout(doc, payload, pageTitle, { showTitle: false });
}

function measureParagraphs(doc, paragraphs, width) {
  doc.font(SEMINAR_FONTS.regular).fontSize(SEMINAR_PDF.bodySize);
  return (paragraphs || []).reduce((sum, paragraph) => {
    if (!paragraph) return sum;
    return sum + doc.heightOfString(String(paragraph), {
      width,
      lineGap: SEMINAR_PDF.lineGap,
    }) + SEMINAR_PDF.paragraphGap;
  }, 0);
}

function measureProseBlock(doc, block, width) {
  doc.font(SEMINAR_FONTS.bold).fontSize(SEMINAR_PDF.subsectionSize);
  let h = doc.heightOfString(String(block.title || ''), { width, lineGap: 0 }) + SEMINAR_PDF.headerGap;
  doc.font(SEMINAR_FONTS.regular).fontSize(SEMINAR_PDF.bodySize);
  h += measureParagraphs(doc, block.paragraphs, width);
  return h + 4;
}

function drawProseBlock(doc, block, x, y, width) {
  y = drawSubsectionTitle(doc, block.title, x, y, width);
  return drawParagraphs(doc, block.paragraphs, x, y, width);
}

export function measureCalloutRow(doc, callouts, width) {
  const colW = width / Math.max(callouts?.length || 1, 1);
  const pad = 8;
  let maxH = 52;
  (callouts || []).forEach((item) => {
    doc.font(PDF_FRAME_FONTS.bold).fontSize(8);
    const labelH = doc.heightOfString(String(item.label || ''), { width: colW - pad * 2, lineGap: 0 });
    doc.font(PDF_FRAME_FONTS.bold).fontSize(14);
    const valueH = doc.heightOfString(String(item.value || ''), { width: colW - pad * 2, lineGap: 0 });
    doc.font(PDF_FRAME_FONTS.regular).fontSize(8);
    const detailH = doc.heightOfString(String(item.detail || ''), { width: colW - pad * 2, lineGap: 0 });
    maxH = Math.max(maxH, pad * 2 + labelH + valueH + detailH + 6);
  });
  return maxH + SEMINAR_PDF.sectionGap;
}

export function drawCalloutRow(doc, callouts, x, y, width) {
  const items = callouts || [];
  if (!items.length) return y;
  const colW = width / items.length;
  const pad = 8;
  const rowH = measureCalloutRow(doc, items, width) - SEMINAR_PDF.sectionGap;

  items.forEach((item, index) => {
    const colX = x + index * colW;
    doc.save();
    doc.roundedRect(colX + 2, y, colW - 4, rowH, 4).fill('#f8f8f8');
    doc.restore();
    doc
      .strokeColor(PDF_FRAME_COLORS.gold)
      .lineWidth(1)
      .roundedRect(colX + 2, y, colW - 4, rowH, 4)
      .stroke();

    let cy = y + pad;
    doc
      .font(PDF_FRAME_FONTS.bold)
      .fontSize(8)
      .fillColor(SEMINAR_COLORS.muted)
      .text(String(item.label || ''), colX + pad, cy, { width: colW - pad * 2, align: 'center', lineGap: 0 });
    cy = doc.y + 4;
    doc
      .font(PDF_FRAME_FONTS.bold)
      .fontSize(14)
      .fillColor(SEMINAR_COLORS.body)
      .text(String(item.value || ''), colX + pad, cy, { width: colW - pad * 2, align: 'center', lineGap: 0 });
    cy = doc.y + 2;
    doc
      .font(PDF_FRAME_FONTS.regular)
      .fontSize(8)
      .fillColor(SEMINAR_COLORS.muted)
      .text(String(item.detail || ''), colX + pad, cy, { width: colW - pad * 2, align: 'center', lineGap: 0 });
  });

  return y + rowH + SEMINAR_PDF.sectionGap;
}

function contentBoxTypography(opts = {}) {
  return {
    pad: opts.pad ?? 10,
    titleSize: opts.titleSize ?? SEMINAR_PDF.subsectionSize,
    bodySize: opts.bodySize ?? SEMINAR_PDF.bodySize,
    lineGap: opts.lineGap ?? SEMINAR_PDF.lineGap,
    paragraphGap: opts.paragraphGap ?? SEMINAR_PDF.paragraphGap,
    sectionGap: opts.sectionGap ?? SEMINAR_PDF.sectionGap,
  };
}

/** Titled prose inside a gold-bordered container — easier to scan than flat paragraphs. */
export function measureContentBox(doc, block, width, opts = {}) {
  const typography = contentBoxTypography(opts);
  const innerW = width - typography.pad * 2 - 4;
  let h = typography.pad;
  if (block?.title) {
    doc.font(SEMINAR_FONTS.bold).fontSize(typography.titleSize);
    h += doc.heightOfString(String(block.title), { width: innerW, lineGap: 0 }) + 8;
  }
  doc.font(SEMINAR_FONTS.regular).fontSize(typography.bodySize);
  const paragraphs = block?.paragraphs || [];
  paragraphs.forEach((paragraph, index) => {
    if (!paragraph) return;
    h += doc.heightOfString(String(paragraph), { width: innerW, lineGap: typography.lineGap });
    if (index < paragraphs.length - 1) h += typography.paragraphGap;
  });
  h += typography.pad;
  return h + typography.sectionGap;
}

export function drawContentBox(doc, block, x, y, width, opts = {}) {
  if (!block?.paragraphs?.length && !block?.title) return y;
  const typography = contentBoxTypography(opts);
  const boxH = measureContentBox(doc, block, width, opts) - typography.sectionGap;
  const innerW = width - typography.pad * 2 - 4;
  const inset = 2;

  doc.save();
  doc.roundedRect(x + inset, y, width - inset * 2, boxH, 4).fill('#f8f8f8');
  doc.restore();
  doc
    .strokeColor(PDF_FRAME_COLORS.gold)
    .lineWidth(1)
    .roundedRect(x + inset, y, width - inset * 2, boxH, 4)
    .stroke();

  let cy = y + typography.pad;
  if (block.title) {
    doc
      .font(SEMINAR_FONTS.bold)
      .fontSize(typography.titleSize)
      .fillColor(SEMINAR_COLORS.body)
      .text(String(block.title), x + typography.pad, cy, { width: innerW, lineGap: 0 });
    cy = doc.y + 8;
  }

  (block.paragraphs || []).forEach((paragraph) => {
    if (!paragraph) return;
    doc
      .font(SEMINAR_FONTS.regular)
      .fontSize(typography.bodySize)
      .fillColor(SEMINAR_COLORS.body)
      .text(String(paragraph), x + typography.pad, cy, {
        width: innerW,
        lineGap: typography.lineGap,
        align: 'left',
      });
    cy = doc.y + typography.paragraphGap;
  });

  return y + boxH + typography.sectionGap;
}

/** Guided lesson — intro, optional callouts, prose blocks; unified frame with pagination. */
export function drawGuidedLesson(doc, payload, section) {
  if (!section) return;

  const pageTitle = section.pageTitle || '';
  let page = lessonPageLayout(doc, payload, pageTitle, { showTitle: true });

  const introHeight = measureParagraphs(doc, section.intro, page.width);
  page = ensureSpace(doc, payload, page, introHeight, pageTitle);
  page.y = drawParagraphs(doc, section.intro, page.x, page.y, page.width);

  if (section.callouts?.length) {
    const calloutH = measureCalloutRow(doc, section.callouts, page.width);
    page = ensureSpace(doc, payload, page, calloutH, pageTitle);
    page.y = drawCalloutRow(doc, section.callouts, page.x, page.y, page.width);
  }

  (section.blocks || []).forEach((block) => {
    const blockH = measureProseBlock(doc, block, page.width);
    page = ensureSpace(doc, payload, page, blockH, pageTitle);
    page.y = drawProseBlock(doc, block, page.x, page.y, page.width);
  });

  if (section.closing?.length) {
    const closingH = measureParagraphs(doc, section.closing, page.width);
    page = ensureSpace(doc, payload, page, closingH, pageTitle);
    page.y = drawParagraphs(doc, section.closing, page.x, page.y, page.width);
  }

  finishLessonPage(doc, page, payload);
}

function measureServingsGrid(doc, gridRows, extraFats, width) {
  const headerRows = 1;
  const rows = [
    { label: '', daily: 'Daily', breakfast: 'Breakfast', snack1: 'Snack', lunch: 'Lunch', snack2: 'Snack', dinner: 'Dinner', snack3: 'Snack' },
    ...gridRows,
    ...extraFats.map((line, index) => ({
      label: index === 0 ? 'Extra Fats' : '',
      daily: line.value,
      breakfast: line.note,
      snack1: '',
      lunch: '',
      snack2: '',
      dinner: '',
      snack3: '',
    })),
  ];
  const colWidths = [0.16, 0.1, 0.12, 0.1, 0.1, 0.1, 0.1, 0.1].map((f) => f * width);
  let h = 0;
  rows.forEach((row, rowIndex) => {
    const isHeader = rowIndex < headerRows;
    let maxH = SEMINAR_PDF.tableBodySize + SEMINAR_PDF.tableRowPad * 2;
    ['label', 'daily', 'breakfast', 'snack1', 'lunch', 'snack2', 'dinner', 'snack3'].forEach((key, index) => {
      const font = isHeader ? SEMINAR_FONTS.bold : SEMINAR_FONTS.regular;
      const size = isHeader ? SEMINAR_PDF.tableHeadSize : SEMINAR_PDF.tableBodySize;
      doc.font(font).fontSize(size);
      const cellH = doc.heightOfString(String(row[key] ?? ''), { width: colWidths[index] - 8, lineGap: 0 });
      maxH = Math.max(maxH, cellH + SEMINAR_PDF.tableRowPad * 2);
    });
    h += maxH;
  });
  return h + 12;
}

/** Servings lesson — guided intro + daily grid (the action layer). */
export function drawServingsLesson(doc, payload, section) {
  if (!section) return;

  const pageTitle = section.pageTitle || 'Your Daily Servings';
  let page = lessonPageLayout(doc, payload, pageTitle, { showTitle: true });

  const introHeight = measureParagraphs(doc, section.intro, page.width);
  page = ensureSpace(doc, payload, page, introHeight, pageTitle);
  page.y = drawParagraphs(doc, section.intro, page.x, page.y, page.width);

  (section.blocks || []).forEach((block) => {
    const blockH = measureProseBlock(doc, block, page.width);
    page = ensureSpace(doc, payload, page, blockH, pageTitle);
    page.y = drawProseBlock(doc, block, page.x, page.y, page.width);
  });

  if (section.note) {
    const noteH = measureParagraphs(doc, [section.note], page.width);
    page = ensureSpace(doc, payload, page, noteH, pageTitle);
    page.y = drawParagraphs(doc, [section.note], page.x, page.y, page.width);
  }

  const gridRows = (section.gridRows || []).map((row) => ({
    label: row.label,
    daily: row.daily,
    breakfast: row.breakfast,
    snack1: row.snack1,
    lunch: row.lunch,
    snack2: row.snack2,
    dinner: row.dinner,
    snack3: row.snack3,
  }));
  const extraRows = (section.extraFats || []).map((line, index) => ({
    label: index === 0 ? 'Extra Fats' : '',
    daily: line.value,
    breakfast: line.note,
    snack1: '',
    lunch: '',
    snack2: '',
    dinner: '',
    snack3: '',
  }));

  const gridH = measureServingsGrid(doc, gridRows, section.extraFats || [], page.width);
  page = ensureSpace(doc, payload, page, gridH + 8, pageTitle);

  page.y += 4;
  drawGoldDivider(doc, page.x, page.y, page.width);
  page.y += 8;

  drawTable(doc, {
    x: page.x,
    y: page.y,
    width: page.width,
    columns: [
      { key: 'label', width: 0.16 },
      { key: 'daily', width: 0.1, align: 'center' },
      { key: 'breakfast', width: 0.12, align: 'center' },
      { key: 'snack1', width: 0.1, align: 'center' },
      { key: 'lunch', width: 0.1, align: 'center' },
      { key: 'snack2', width: 0.1, align: 'center' },
      { key: 'dinner', width: 0.1, align: 'center' },
      { key: 'snack3', width: 0.1, align: 'center' },
    ],
    rows: [
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
      ...extraRows,
    ],
    headerRows: 1,
  });

  finishLessonPage(doc, page, payload);
}
