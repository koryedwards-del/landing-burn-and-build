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

export const KWARNER_LOCKED_MIN_PAGES = 4;

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

/** Tables only — gold border, light fill. */
const TABLE_CONTAINER = Object.freeze({
  fill: '#f8f8f8',
  stroke: PDF_FRAME_COLORS.gold,
  radius: 4,
  inset: 2,
  cellPad: 8,
});

function layoutTableRowHeights(doc, opts) {
  const columns = opts.columns;
  const tableW = opts.width;
  const colWidths = columns.map((col) => col.width * tableW);
  const headerRows = opts.headerRows ?? 1;

  return opts.rows.map((row, rowIndex) => {
    const isHeader = rowIndex < headerRows;
    let maxH = LAYOUT.tableBodySize + LAYOUT.tableRowPad * 2;
    columns.forEach((col, index) => {
      const cell = row[col.key] ?? '';
      const font = isHeader ? SEMINAR_FONTS.bold : SEMINAR_FONTS.regular;
      const size = isHeader ? LAYOUT.tableHeadSize : LAYOUT.tableBodySize;
      const h = doc.font(font).fontSize(size).heightOfString(String(cell), {
        width: colWidths[index] - TABLE_CONTAINER.cellPad * 2,
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

  doc.save();
  doc.roundedRect(tableX, tableY, tableW, totalH, TABLE_CONTAINER.radius).fill(TABLE_CONTAINER.fill);
  doc.restore();
  doc
    .strokeColor(TABLE_CONTAINER.stroke)
    .lineWidth(1.25)
    .roundedRect(tableX, tableY, tableW, totalH, TABLE_CONTAINER.radius)
    .stroke();

  let cy = tableY;
  opts.rows.forEach((row, rowIndex) => {
    const isHeader = rowIndex < headerRows;
    const rh = rowHeights[rowIndex];
    let cx = tableX;
    columns.forEach((col, index) => {
      const w = colWidths[index];
      doc
        .font(isHeader ? SEMINAR_FONTS.bold : SEMINAR_FONTS.regular)
        .fontSize(isHeader ? LAYOUT.tableHeadSize : LAYOUT.tableBodySize)
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
    ['Lean Body Analysis', payload.welcome.leanBodyAnalysis],
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

function drawFoodPlanPage(doc, payload) {
  const fp = payload.foodPlan;
  let page = startLockedPage(doc, payload, 'Food Plan');

  const intro = `The following food program contains a sophisticated calculation that is based on your individual lean body mass (LBM), and on your activities. This is the most individualized food program available for losing fat. In eight weeks, you could safely lose ${fp.fatLostLbs} pounds of fat. On your information sheet, you indicated you plan to exercise a total of ${fp.introHours.total} hour(s) per week. ${fp.introHours.wt} hour(s) of weight training, ${fp.introHours.cardio} hour(s) of cardiovascular activities, ${fp.introHours.fatBurn} hour(s) of fat-burning activities`;
  page = drawBodyParagraphs(doc, payload, page, [intro]);

  if (fp.goal) {
    const goalTableOpts = {
      x: page.x,
      y: page.y,
      width: page.width,
      columns: [
        { key: 'label', width: 0.14 },
        { key: 'todayPct', width: 0.14, align: 'right' },
        { key: 'todayLbs', width: 0.14, align: 'right' },
        { key: 'mid', width: 0.16, align: 'center' },
        { key: 'goalPct', width: 0.14, align: 'right' },
        { key: 'goalLbs', width: 0.14, align: 'right' },
      ],
      rows: [
        {
          label: '',
          todayPct: 'TODAY',
          todayLbs: '',
          mid: '',
          goalPct: 'EIGHT WEEK GOAL',
          goalLbs: '',
        },
        {
          label: 'LEAN',
          todayPct: `${fp.today.leanPct}%`,
          todayLbs: `${fp.today.leanLbs} lbs.`,
          mid: '',
          goalPct: fp.goal.leanPct,
          goalLbs: fp.goal.leanLbs,
        },
        {
          label: 'FAT',
          todayPct: `${fp.today.fatPct}%`,
          todayLbs: `${fp.today.fatLbs} lbs.`,
          mid: `-${fp.fatLostLbs} lbs. of fat`,
          goalPct: fp.goal.fatPct,
          goalLbs: fp.goal.fatLbs,
        },
        {
          label: 'TOTAL',
          todayPct: `${fp.today.totalPct}%`,
          todayLbs: `${fp.today.totalLbs} lbs.`,
          mid: '',
          goalPct: fp.goal.totalPct,
          goalLbs: fp.goal.totalLbs,
        },
      ],
      headerRows: 1,
    };
    page = ensureLockedSpace(doc, payload, page, measureLayoutTable(doc, goalTableOpts));
    goalTableOpts.y = page.y;
    page = { ...page, y: drawLayoutTable(doc, goalTableOpts) + LAYOUT.paragraphGap };
  }

  const weekly = `You project to lose an average of ${fp.weeklyFatLossLbs} pounds of fat per week. In addition, you could gain lean weight. Gaining lean weight will increase your strength and energy and offset your fat loss.`;
  page = drawBodyParagraphs(doc, payload, page, [weekly, fp.macroIntro].filter(Boolean));

  const macroTableOpts = {
    x: page.x,
    y: page.y,
    width: page.width,
    columns: [
      { key: 'label', width: 0.24 },
      { key: 'proteinG', width: 0.09, align: 'right' },
      { key: 'proteinCal', width: 0.11, align: 'right' },
      { key: 'carbsG', width: 0.09, align: 'right' },
      { key: 'carbsCal', width: 0.11, align: 'right' },
      { key: 'fatsG', width: 0.09, align: 'right' },
      { key: 'fatsCal', width: 0.11, align: 'right' },
      { key: 'totalCal', width: 0.11, align: 'right' },
    ],
    rows: [
      {
        label: '',
        proteinG: 'grams',
        proteinCal: 'calories',
        carbsG: 'grams',
        carbsCal: 'calories',
        fatsG: 'grams',
        fatsCal: 'calories',
        totalCal: 'calories',
      },
      {
        label: '',
        proteinG: 'PROTEIN',
        proteinCal: '',
        carbsG: 'CARBS',
        carbsCal: '',
        fatsG: 'FATS',
        fatsCal: '',
        totalCal: 'TOTAL',
      },
      ...fp.macroRows.map((row) => ({
        label: row.label,
        proteinG: String(row.proteinG),
        proteinCal: row.proteinCal,
        carbsG: String(row.carbsG),
        carbsCal: row.carbsCal,
        fatsG: String(row.fatsG),
        fatsCal: row.fatsCal,
        totalCal: row.totalCal,
      })),
    ],
    headerRows: 2,
  };
  page = ensureLockedSpace(doc, payload, page, measureLayoutTable(doc, macroTableOpts));
  macroTableOpts.y = page.y;
  drawLayoutTable(doc, macroTableOpts);
  finishLockedPage(doc, page.box, payload);
}

function drawServingsPage(doc, payload) {
  const servings = payload.servings;
  let page = startLockedPage(doc, payload, 'Servings');

  page = drawBodyParagraphs(doc, payload, page, [servings.note]);

  const gridRows = servings.gridRows.map((row) => ({
    label: row.label,
    daily: row.daily,
    breakfast: row.breakfast,
    snack1: row.snack1,
    lunch: row.lunch,
    snack2: row.snack2,
    dinner: row.dinner,
    snack3: row.snack3,
  }));

  const extraRows = servings.extraFats.map((line, index) => ({
    label: index === 0 ? 'Extra Fats' : '',
    daily: line.value,
    breakfast: line.note,
    snack1: '',
    lunch: '',
    snack2: '',
    dinner: '',
    snack3: '',
  }));

  const servingsTableOpts = {
    x: page.x,
    y: page.y,
    width: page.width,
    columns: [
      { key: 'label', width: 0.18 },
      { key: 'daily', width: 0.1, align: 'center' },
      { key: 'breakfast', width: 0.12, align: 'center' },
      { key: 'snack1', width: 0.1, align: 'center' },
      { key: 'lunch', width: 0.1, align: 'center' },
      { key: 'snack2', width: 0.1, align: 'center' },
      { key: 'dinner', width: 0.12, align: 'center' },
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
  };
  page = ensureLockedSpace(doc, payload, page, measureLayoutTable(doc, servingsTableOpts));
  servingsTableOpts.y = page.y;
  drawLayoutTable(doc, servingsTableOpts);
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
  drawFoodPlanPage(doc, payload);
  drawServingsPage(doc, payload);

  stampPinnedProgramFooters(doc, payload.header);

  const buffer = await creator.finish({ stampPageNumbers: false });
  const pages = (buffer.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  if (pages < KWARNER_LOCKED_MIN_PAGES) {
    throw new Error(`Preview PDF expected at least ${KWARNER_LOCKED_MIN_PAGES} pages, got ${pages}`);
  }
  return buffer;
}
