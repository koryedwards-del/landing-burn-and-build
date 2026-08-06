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
  frameContentContainerTight,
} from './drawFrame.js';
import { drawPersonalizationHeader } from './drawSeminar.js';
import {
  SEMINAR_COLORS,
  SEMINAR_FONTS,
} from './drawSeminar.js';
import { validatePrintPayload } from './validate.js';
import { PRINT_TEMPLATE_TYPOGRAPHY as PT } from '../../js/printTemplateTypography.js';

export const KWARNER_LOCKED_TOTAL_PAGES = 4;

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

function drawBodyParagraphs(doc, paragraphs, x, y, width) {
  let cy = y;
  (paragraphs || []).forEach((paragraph) => {
    if (!paragraph) return;
    doc
      .font(SEMINAR_FONTS.regular)
      .fontSize(LAYOUT.bodySize)
      .fillColor(SEMINAR_COLORS.body)
      .text(String(paragraph), x, cy, {
        width,
        lineGap: LAYOUT.lineGap,
        align: 'left',
      });
    cy = doc.y + LAYOUT.paragraphGap;
  });
  return cy;
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

  const container = frameContentContainerTight(box, topGoldY, LAYOUT.contentPad);
  const bottom = frameContentContainerBottom(box, topGoldY);
  let y = container.top;
  if (pageTitle) {
    y = drawFramePageTitle(doc, pageTitle, box.x, y, box.width, { size: PT.pageTitle });
  }
  return { box, x: box.x, y, width: box.width, bottom };
}

function finishLockedPage(doc, box, payload, page) {
  drawFramePageFooter(doc, box, {
    page,
    total: KWARNER_LOCKED_TOTAL_PAGES,
    contact: payload.header,
  });
}

function drawWelcomePage(doc, payload) {
  const page = beginLockedPage(doc, payload, 'Welcome', { compactHeader: false });
  let { y } = page;

  y = drawBodyParagraphs(doc, payload.welcome.intro, page.x, y, page.width);
  y += LAYOUT.sectionGap;

  const sections = [
    ['Lean Body Analysis', payload.welcome.leanBodyAnalysis],
    ['Food Plan', payload.welcome.foodPlan],
    ['Servings', payload.welcome.servings],
  ].filter(([, body]) => body);

  sections.forEach(([title, body], index) => {
    y = drawSectionTitle(doc, title, page.x, y, page.width);
    y = drawBodyParagraphs(doc, [body], page.x, y, page.width);
    if (index < sections.length - 1) {
      y += LAYOUT.sectionGap;
    }
  });

  finishLockedPage(doc, page.box, payload, 1);
}

function drawLeanBodyAnalysisPage(doc, payload) {
  const lba = payload.leanBodyAnalysis;
  const page = beginLockedPage(doc, payload, 'Lean Body Analysis', { compactHeader: true });
  let { y } = page;

  doc
    .font(SEMINAR_FONTS.regular)
    .fontSize(LAYOUT.bodySize)
    .fillColor(SEMINAR_COLORS.body)
    .text(
      `Height: ${lba.heightInches} inches  Sex: ${lba.sex}  Thigh: ${lba.thigh}  Waist: ${lba.waist}  Age: ${lba.age} years of experience`,
      page.x,
      y,
      { width: page.width, lineGap: LAYOUT.lineGap },
    );

  y = doc.y + LAYOUT.sectionGap;
  y = drawSectionTitle(doc, '--TODAY--', page.x, y, page.width);

  y = drawLayoutTable(doc, {
    x: page.x,
    y,
    width: page.width,
    columns: [
      { key: 'label', width: 0.34 },
      { key: 'pct', width: 0.33, align: 'right' },
      { key: 'lbs', width: 0.33, align: 'right' },
    ],
    rows: [
      { label: 'LEAN', pct: `${lba.today.leanPct} %`, lbs: `${lba.today.leanLbs} lbs.` },
      { label: 'FAT', pct: `${lba.today.fatPct} %`, lbs: `${lba.today.fatLbs} lbs.` },
      { label: 'TOTAL', pct: `${lba.today.totalPct} %`, lbs: `${lba.today.totalLbs} lbs.` },
    ],
    headerRows: 0,
  }) + LAYOUT.paragraphGap;

  y = drawLayoutTable(doc, {
    x: page.x,
    y,
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
  }) + LAYOUT.paragraphGap;

  if (lba.riskMessage) {
    y = drawBodyParagraphs(doc, [lba.riskMessage], page.x, y, page.width);
  }

  y = drawBodyParagraphs(doc, [lba.footerCopy], page.x, y, page.width);

  if (lba.lbmLead) {
    y = drawBodyParagraphs(doc, [lba.lbmLead], page.x, y, page.width);
  }
  if (lba.lbmCongrats) {
    y = drawBodyParagraphs(doc, [lba.lbmCongrats], page.x, y, page.width);
  }

  y = drawLayoutTable(doc, {
    x: page.x,
    y,
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
  }) + LAYOUT.paragraphGap;

  drawBodyParagraphs(doc, [lba.monitorCopy], page.x, y, page.width);
  finishLockedPage(doc, page.box, payload, 2);
}

function drawFoodPlanPage(doc, payload) {
  const fp = payload.foodPlan;
  const page = beginLockedPage(doc, payload, 'Food Plan', { compactHeader: true });
  let { y } = page;

  const intro = `The following food program contains a sophisticated calculation that is based on your individual lean body mass (LBM), and on your activities. This is the most individualized food program available for losing fat. In eight weeks, you could safely lose ${fp.fatLostLbs} pounds of fat. On your information sheet, you indicated you plan to exercise a total of ${fp.introHours.total} hour(s) per week. ${fp.introHours.wt} hour(s) of weight training, ${fp.introHours.cardio} hour(s) of cardiovascular activities, ${fp.introHours.fatBurn} hour(s) of fat-burning activities`;
  y = drawBodyParagraphs(doc, [intro], page.x, y, page.width);

  if (fp.goal) {
    y = drawLayoutTable(doc, {
      x: page.x,
      y,
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
    }) + LAYOUT.paragraphGap;
  }

  const weekly = `You project to lose an average of ${fp.weeklyFatLossLbs} pounds of fat per week. In addition, you could gain lean weight. Gaining lean weight will increase your strength and energy and offset your fat loss.`;
  y = drawBodyParagraphs(doc, [weekly], page.x, y, page.width);
  y = drawBodyParagraphs(doc, [fp.macroIntro], page.x, y, page.width);

  drawLayoutTable(doc, {
    x: page.x,
    y,
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
  });
  finishLockedPage(doc, page.box, payload, 3);
}

function drawServingsPage(doc, payload) {
  const servings = payload.servings;
  const page = beginLockedPage(doc, payload, 'Servings', { compactHeader: true });
  let { y } = page;

  y = drawBodyParagraphs(doc, [servings.note], page.x, y, page.width);

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

  drawLayoutTable(doc, {
    x: page.x,
    y,
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
  });
  finishLockedPage(doc, page.box, payload, 4);
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

  const buffer = await creator.finish({ stampPageNumbers: false });
  const pages = (buffer.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  if (pages !== KWARNER_LOCKED_TOTAL_PAGES) {
    throw new Error(`Preview PDF expected ${KWARNER_LOCKED_TOTAL_PAGES} pages, got ${pages}`);
  }
  return buffer;
}
