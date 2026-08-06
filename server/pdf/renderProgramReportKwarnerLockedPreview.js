/**
 * Preview-only: KWarner 5-page seminar content + locked personalized frame.
 * Not wired to production API — run scripts/render-kwarner-locked-preview.mjs
 */
import { createPrintPdf } from './creator.js';
import {
  addFramePage,
  drawCompactPersonalizedHeader,
  drawFramePageFooter,
  drawFramePageTitle,
  frameContentContainerBottom,
  framePageTitleStartY,
} from './drawFrame.js';
import { drawPersonalizationHeader } from './drawSeminar.js';
import {
  SEMINAR_COLORS,
  SEMINAR_FONTS,
} from './drawSeminar.js';
import { validatePrintPayload } from './validate.js';
import { PRINT_TEMPLATE_TYPOGRAPHY as PT } from '../../js/printTemplateTypography.js';
import { drawCalloutRow, drawContentBox, measureContentBox } from './drawProgramReportNarrative.js';

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

const BOX_TYPO = {
  titleSize: LAYOUT.subsectionSize,
  bodySize: LAYOUT.bodySize,
  lineGap: LAYOUT.lineGap,
  paragraphGap: LAYOUT.paragraphGap,
  sectionGap: LAYOUT.sectionGap,
};

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
  const colWidths = columns.map((col) => col.width * opts.width);
  const rowHeight = (row, isHeader) => {
    let maxH = LAYOUT.tableBodySize + LAYOUT.tableRowPad * 2;
    columns.forEach((col, index) => {
      const cell = row[col.key] ?? '';
      const font = isHeader ? SEMINAR_FONTS.bold : SEMINAR_FONTS.regular;
      const size = isHeader ? LAYOUT.tableHeadSize : LAYOUT.tableBodySize;
      const h = doc.font(font).fontSize(size).heightOfString(String(cell), {
        width: colWidths[index] - 8,
        lineGap: 0,
      });
      maxH = Math.max(maxH, h + LAYOUT.tableRowPad * 2);
    });
    return maxH;
  };

  let cy = opts.y;
  opts.rows.forEach((row, rowIndex) => {
    const isHeader = rowIndex < (opts.headerRows ?? 1);
    const rh = rowHeight(row, isHeader);
    let cx = opts.x;
    columns.forEach((col, index) => {
      const w = colWidths[index];
      if (isHeader) {
        doc.save();
        doc.rect(cx, cy, w, rh).fill(SEMINAR_COLORS.tableHead);
        doc.restore();
      }
      doc
        .rect(cx, cy, w, rh)
        .strokeColor(SEMINAR_COLORS.rule)
        .lineWidth(0.5)
        .stroke();
      doc
        .font(isHeader ? SEMINAR_FONTS.bold : SEMINAR_FONTS.regular)
        .fontSize(isHeader ? LAYOUT.tableHeadSize : LAYOUT.tableBodySize)
        .fillColor(SEMINAR_COLORS.body)
        .text(String(row[col.key] ?? ''), cx + 4, cy + LAYOUT.tableRowPad, {
          width: w - 8,
          lineGap: 0,
          align: col.align || 'left',
        });
      cx += w;
    });
    cy += rh;
  });

  return cy;
}

function beginLockedPage(doc, payload, pageTitle, { compactHeader = false } = {}) {
  const box = addFramePage(doc);
  const topGoldY = compactHeader
    ? drawCompactPersonalizedHeader(doc, box, {
      clientName: payload.clientName,
      preparedDateLong: payload.preparedDateLong,
      preparedDate: payload.preparedDate,
      contact: payload.header,
    })
    : drawPersonalizationHeader(doc, payload, box);

  const bottom = frameContentContainerBottom(box, topGoldY);
  let y = framePageTitleStartY(topGoldY);
  if (pageTitle) {
    y = drawFramePageTitle(doc, pageTitle, box.x, y, box.width, {
      size: PT.pageTitle,
      gapAfter: PT.titleBottomGap,
    });
  }
  return { box, x: box.x, y, width: box.width, bottom };
}

function finishLockedPage(doc, box, payload) {
  drawFramePageFooter(doc, box, { contact: payload.header });
}

function startLockedPage(doc, payload, pageTitle, { compactHeader = false } = {}) {
  return beginLockedPage(doc, payload, pageTitle, { compactHeader });
}

function ensureLockedSpace(doc, payload, page, needed, { compactHeader, pageTitle } = {}) {
  if (page.y + needed <= page.bottom) return page;
  finishLockedPage(doc, page.box, payload);
  const next = startLockedPage(doc, payload, pageTitle || null, { compactHeader: compactHeader ?? false });
  return next;
}

function drawWelcomePage(doc, payload) {
  let page = startLockedPage(doc, payload, 'Welcome', { compactHeader: false });

  const introBlock = { title: 'Your program', paragraphs: payload.welcome.intro.filter(Boolean) };
  page = ensureLockedSpace(doc, payload, page, measureContentBox(doc, introBlock, page.width, BOX_TYPO), {
    compactHeader: false,
    pageTitle: 'Welcome',
  });
  page.y = drawContentBox(doc, introBlock, page.x, page.y, page.width, BOX_TYPO);

  const sections = [
    ['Lean Body Analysis', payload.welcome.leanBodyAnalysis],
    ['Food Plan', payload.welcome.foodPlan],
    ['Servings', payload.welcome.servings],
  ].filter(([, body]) => body);

  sections.forEach(([title, body]) => {
    const block = { title, paragraphs: [body] };
    page = ensureLockedSpace(doc, payload, page, measureContentBox(doc, block, page.width, BOX_TYPO), {
      compactHeader: false,
      pageTitle: 'Welcome',
    });
    page.y = drawContentBox(doc, block, page.x, page.y, page.width, BOX_TYPO);
  });

  finishLockedPage(doc, page.box, payload);
}

function measureLayoutTable(doc, opts) {
  const columns = opts.columns;
  const colWidths = columns.map((col) => col.width * opts.width);
  let total = 0;
  opts.rows.forEach((row, rowIndex) => {
    const isHeader = rowIndex < (opts.headerRows ?? 1);
    let maxH = LAYOUT.tableBodySize + LAYOUT.tableRowPad * 2;
    columns.forEach((col, index) => {
      const cell = row[col.key] ?? '';
      const font = isHeader ? SEMINAR_FONTS.bold : SEMINAR_FONTS.regular;
      const size = isHeader ? LAYOUT.tableHeadSize : LAYOUT.tableBodySize;
      const h = doc.font(font).fontSize(size).heightOfString(String(cell), {
        width: colWidths[index] - 8,
        lineGap: 0,
      });
      maxH = Math.max(maxH, h + LAYOUT.tableRowPad * 2);
    });
    total += maxH;
  });
  return total;
}

function drawLeanBodyAnalysisPage(doc, payload) {
  const lba = payload.leanBodyAnalysis;
  let page = startLockedPage(doc, payload, 'Lean Body Analysis', { compactHeader: true });

  const profileBlock = {
    title: 'Test profile',
    paragraphs: [
      `Height: ${lba.heightInches} inches · Sex: ${lba.sex} · Thigh: ${lba.thigh} · Waist: ${lba.waist} · Age: ${lba.age}`,
    ],
  };
  page = ensureLockedSpace(doc, payload, page, measureContentBox(doc, profileBlock, page.width, BOX_TYPO), {
    compactHeader: true,
    pageTitle: 'Lean Body Analysis',
  });
  page.y = drawContentBox(doc, profileBlock, page.x, page.y, page.width, BOX_TYPO);

  page = ensureLockedSpace(doc, payload, page, LAYOUT.subsectionSize + LAYOUT.headerGap + 60, {
    compactHeader: true,
    pageTitle: 'Lean Body Analysis',
  });
  page.y = drawSectionTitle(doc, '--TODAY--', page.x, page.y, page.width);

  page.y = drawCalloutRow(
    doc,
    [
      { label: 'Lean weight', value: `${lba.today.leanLbs} lbs`, detail: `${lba.today.leanPct}% of you` },
      { label: 'Fat weight', value: `${lba.today.fatLbs} lbs`, detail: `${lba.today.fatPct}% of you` },
      { label: 'Total weight', value: `${lba.today.totalLbs} lbs`, detail: 'on the scale today' },
    ],
    page.x,
    page.y,
    page.width,
  );

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
  const aceBlockH = LAYOUT.subsectionSize + LAYOUT.headerGap + measureLayoutTable(doc, aceTableOpts);
  page = ensureLockedSpace(doc, payload, page, aceBlockH, {
    compactHeader: true,
    pageTitle: 'Lean Body Analysis',
  });
  page.y = drawSectionTitle(doc, 'ACE body fat categories', page.x, page.y, page.width);
  aceTableOpts.y = page.y;
  page.y = drawLayoutTable(doc, aceTableOpts) + LAYOUT.paragraphGap;

  const standParagraphs = [lba.riskMessage, lba.footerCopy].filter(Boolean);
  if (standParagraphs.length) {
    const standBlock = { title: 'Where you stand', paragraphs: standParagraphs };
    page = ensureLockedSpace(doc, payload, page, measureContentBox(doc, standBlock, page.width, BOX_TYPO), {
      compactHeader: true,
      pageTitle: 'Lean Body Analysis',
    });
    page.y = drawContentBox(doc, standBlock, page.x, page.y, page.width, BOX_TYPO);
  }

  const lbmParagraphs = [lba.lbmLead, lba.lbmCongrats].filter(Boolean);
  if (lbmParagraphs.length) {
    const lbmBlock = { title: 'Lean body mass', paragraphs: lbmParagraphs };
    page = ensureLockedSpace(doc, payload, page, measureContentBox(doc, lbmBlock, page.width, BOX_TYPO), {
      compactHeader: true,
      pageTitle: 'Lean Body Analysis',
    });
    page.y = drawContentBox(doc, lbmBlock, page.x, page.y, page.width, BOX_TYPO);
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
  const weightBlockH = LAYOUT.subsectionSize + LAYOUT.headerGap + measureLayoutTable(doc, weightTableOpts);
  page = ensureLockedSpace(doc, payload, page, weightBlockH, {
    compactHeader: true,
    pageTitle: 'Lean Body Analysis',
  });
  page.y = drawSectionTitle(doc, 'Weight goals for your lean mass', page.x, page.y, page.width);
  weightTableOpts.y = page.y;
  page.y = drawLayoutTable(doc, weightTableOpts) + LAYOUT.paragraphGap;

  const monitorBlock = { title: 'Stay on track', paragraphs: [lba.monitorCopy] };
  page = ensureLockedSpace(doc, payload, page, measureContentBox(doc, monitorBlock, page.width, BOX_TYPO), {
    compactHeader: true,
    pageTitle: 'Lean Body Analysis',
  });
  drawContentBox(doc, monitorBlock, page.x, page.y, page.width, BOX_TYPO);
  finishLockedPage(doc, page.box, payload);
}

function drawFoodPlanPage(doc, payload) {
  const fp = payload.foodPlan;
  let page = startLockedPage(doc, payload, 'Food Plan', { compactHeader: true });

  const intro = `The following food program contains a sophisticated calculation that is based on your individual lean body mass (LBM), and on your activities. This is the most individualized food program available for losing fat. In eight weeks, you could safely lose ${fp.fatLostLbs} pounds of fat. On your information sheet, you indicated you plan to exercise a total of ${fp.introHours.total} hour(s) per week. ${fp.introHours.wt} hour(s) of weight training, ${fp.introHours.cardio} hour(s) of cardiovascular activities, ${fp.introHours.fatBurn} hour(s) of fat-burning activities`;
  const introBlock = { title: 'Your custom diet', paragraphs: [intro] };
  page = ensureLockedSpace(doc, payload, page, measureContentBox(doc, introBlock, page.width, BOX_TYPO), {
    compactHeader: true,
    pageTitle: 'Food Plan',
  });
  page.y = drawContentBox(doc, introBlock, page.x, page.y, page.width, BOX_TYPO);

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
    const goalBlockH = LAYOUT.subsectionSize + LAYOUT.headerGap + measureLayoutTable(doc, goalTableOpts);
    page = ensureLockedSpace(doc, payload, page, goalBlockH, {
      compactHeader: true,
      pageTitle: 'Food Plan',
    });
    page.y = drawSectionTitle(doc, 'Eight-week projection', page.x, page.y, page.width);
    goalTableOpts.y = page.y;
    page.y = drawLayoutTable(doc, goalTableOpts) + LAYOUT.paragraphGap;
  }

  const weekly = `You project to lose an average of ${fp.weeklyFatLossLbs} pounds of fat per week. In addition, you could gain lean weight. Gaining lean weight will increase your strength and energy and offset your fat loss.`;
  const expectBlock = {
    title: 'What to expect',
    paragraphs: [weekly, fp.macroIntro].filter(Boolean),
  };
  page = ensureLockedSpace(doc, payload, page, measureContentBox(doc, expectBlock, page.width, BOX_TYPO), {
    compactHeader: true,
    pageTitle: 'Food Plan',
  });
  page.y = drawContentBox(doc, expectBlock, page.x, page.y, page.width, BOX_TYPO);

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
  const macroBlockH = LAYOUT.subsectionSize + LAYOUT.headerGap + measureLayoutTable(doc, macroTableOpts);
  page = ensureLockedSpace(doc, payload, page, macroBlockH, {
    compactHeader: true,
    pageTitle: 'Food Plan',
  });
  page.y = drawSectionTitle(doc, 'Daily macros', page.x, page.y, page.width);
  macroTableOpts.y = page.y;
  drawLayoutTable(doc, macroTableOpts);
  finishLockedPage(doc, page.box, payload);
}

function drawServingsPage(doc, payload) {
  const servings = payload.servings;
  let page = startLockedPage(doc, payload, 'Servings', { compactHeader: true });

  const noteBlock = { title: 'How to use this page', paragraphs: [servings.note] };
  page = ensureLockedSpace(doc, payload, page, measureContentBox(doc, noteBlock, page.width, BOX_TYPO), {
    compactHeader: true,
    pageTitle: 'Servings',
  });
  page.y = drawContentBox(doc, noteBlock, page.x, page.y, page.width, BOX_TYPO);

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
  page = ensureLockedSpace(doc, payload, page, measureLayoutTable(doc, servingsTableOpts), {
    compactHeader: true,
    pageTitle: 'Servings',
  });
  servingsTableOpts.y = page.y;
  drawLayoutTable(doc, servingsTableOpts);
  finishLockedPage(doc, page.box, payload);
}

export async function renderProgramReportKwarnerLockedPreview(payload, { title } = {}) {
  validatePrintPayload('programreport', payload);

  const creator = createPrintPdf({
    title: title || payload.title || 'Program Report',
    author: 'Burn & Build Diet',
  });

  const doc = creator.doc;
  drawWelcomePage(doc, payload);
  drawLeanBodyAnalysisPage(doc, payload);
  drawFoodPlanPage(doc, payload);
  drawServingsPage(doc, payload);

  const buffer = await creator.finish({ stampPageNumbers: true });
  const pages = (buffer.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  if (pages < KWARNER_LOCKED_MIN_PAGES) {
    throw new Error(`Preview PDF expected at least ${KWARNER_LOCKED_MIN_PAGES} pages, got ${pages}`);
  }
  return buffer;
}
