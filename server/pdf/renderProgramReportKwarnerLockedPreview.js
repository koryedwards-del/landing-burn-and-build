/**
 * Preview-only: KWarner 5-page seminar content + locked personalized frame.
 * Not wired to production API — run scripts/render-kwarner-locked-preview.mjs
 */
import { createPrintPdf } from './creator.js';
import {
  addFramePage,
  drawFramePageFooter,
  frameContentContainer,
  frameContentContainerBottom,
} from './drawFrame.js';
import {
  drawContentPageTitle,
  drawPersonalizationHeader,
} from './drawSeminar.js';
import {
  drawParagraphs,
  drawSubsectionTitle,
  drawTable,
  SEMINAR_PDF,
  SEMINAR_COLORS,
  SEMINAR_FONTS,
} from './drawSeminar.js';
import { validatePrintPayload } from './validate.js';

export const KWARNER_LOCKED_TOTAL_PAGES = 5;

function beginLockedPage(doc, payload, pageTitle) {
  const box = addFramePage(doc);
  const topGoldY = drawPersonalizationHeader(doc, payload, box);
  const container = frameContentContainer(box, topGoldY);
  const bottom = frameContentContainerBottom(box, topGoldY);
  let y = container.top;
  if (pageTitle) {
    y = drawContentPageTitle(doc, pageTitle, box.x, y, box.width);
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
  const page = beginLockedPage(doc, payload, 'Welcome');
  let { y } = page;

  y = drawParagraphs(doc, payload.welcome.intro, page.x, y, page.width);

  y = drawSubsectionTitle(doc, 'Lean Body Analysis', page.x, y, page.width);
  y = drawParagraphs(doc, [payload.welcome.leanBodyAnalysis], page.x, y, page.width);

  y = drawSubsectionTitle(doc, 'History', page.x, y, page.width);
  y = drawParagraphs(doc, [payload.welcome.history], page.x, y, page.width);

  y = drawSubsectionTitle(doc, 'Food Plan', page.x, y, page.width);
  y = drawParagraphs(doc, [payload.welcome.foodPlan], page.x, y, page.width);

  y = drawSubsectionTitle(doc, 'Servings', page.x, y, page.width);
  drawParagraphs(doc, [payload.welcome.servings], page.x, y, page.width);

  finishLockedPage(doc, page.box, payload, 1);
}

function drawLeanBodyAnalysisPage(doc, payload) {
  const lba = payload.leanBodyAnalysis;
  const page = beginLockedPage(doc, payload, 'Lean Body Analysis');
  let { y } = page;

  doc
    .font(SEMINAR_FONTS.regular)
    .fontSize(SEMINAR_PDF.bodySize)
    .fillColor(SEMINAR_COLORS.body)
    .text(
      `Height: ${lba.heightInches} inches  Sex: ${lba.sex}  Thigh: ${lba.thigh}  Waist: ${lba.waist}  Age: ${lba.age} years of experience`,
      page.x,
      y,
      { width: page.width, lineGap: 0 },
    );

  y = doc.y + SEMINAR_PDF.sectionGap;
  y = drawSubsectionTitle(doc, '--TODAY--', page.x, y, page.width);

  y = drawTable(doc, {
    x: page.x,
    y,
    width: page.width,
    columns: [
      { key: 'label', width: 0.2 },
      { key: 'pct', width: 0.2, align: 'right' },
      { key: 'lbs', width: 0.2, align: 'right' },
    ],
    rows: [
      { label: 'LEAN', pct: `${lba.today.leanPct} %`, lbs: `${lba.today.leanLbs} lbs.` },
      { label: 'FAT', pct: `${lba.today.fatPct} %`, lbs: `${lba.today.fatLbs} lbs.` },
      { label: 'TOTAL', pct: `${lba.today.totalPct} %`, lbs: `${lba.today.totalLbs} lbs.` },
    ],
    headerRows: 0,
  }) + SEMINAR_PDF.paragraphGap;

  y = drawTable(doc, {
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
  }) + SEMINAR_PDF.paragraphGap;

  if (lba.riskMessage) {
    y = drawParagraphs(doc, [lba.riskMessage], page.x, y, page.width);
  }

  y = drawParagraphs(doc, [lba.footerCopy], page.x, y, page.width);

  if (lba.lbmLead) {
    y = drawParagraphs(doc, [lba.lbmLead], page.x, y, page.width);
  }
  if (lba.lbmCongrats) {
    y = drawParagraphs(doc, [lba.lbmCongrats], page.x, y, page.width);
  }

  y = drawTable(doc, {
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
  }) + SEMINAR_PDF.paragraphGap;

  drawParagraphs(doc, [lba.monitorCopy], page.x, y, page.width);
  finishLockedPage(doc, page.box, payload, 2);
}

function drawHistoryPage(doc, payload) {
  const page = beginLockedPage(doc, payload, 'Body Composition History');
  drawTable(doc, {
    x: page.x,
    y: page.y,
    width: page.width,
    columns: [
      { key: 'testDate', width: 0.14 },
      { key: 'thigh', width: 0.1 },
      { key: 'waist', width: 0.1 },
      { key: 'weight', width: 0.12 },
      { key: 'lean', width: 0.12 },
      { key: 'fat', width: 0.12 },
      { key: 'percent', width: 0.12 },
      { key: 'activity', width: 0.18 },
    ],
    rows: [
      {
        testDate: 'TEST\nDATE',
        thigh: 'THIGH',
        waist: 'WAIST',
        weight: 'WEIGHT',
        lean: 'LEAN',
        fat: 'FAT',
        percent: 'PERCENT',
        activity: 'ACTIVITY',
      },
      ...payload.history.rows,
    ],
    headerRows: 1,
  });
  finishLockedPage(doc, page.box, payload, 3);
}

function drawFoodPlanPage(doc, payload) {
  const fp = payload.foodPlan;
  const page = beginLockedPage(doc, payload, 'Food Plan');
  let { y } = page;

  const intro = `The following food program contains a sophisticated calculation that is based on your individual lean body mass (LBM), and on your activities. This is the most individualized food program available for losing fat. In eight weeks, you could safely lose ${fp.fatLostLbs} pounds of fat. On your information sheet, you indicated you plan to exercise a total of ${fp.introHours.total} hour(s) per week. ${fp.introHours.wt} hour(s) of weight training, ${fp.introHours.cardio} hour(s) of cardiovascular activities, ${fp.introHours.fatBurn} hour(s) of fat-burning activities`;
  y = drawParagraphs(doc, [intro], page.x, y, page.width);

  if (fp.goal) {
    y = drawTable(doc, {
      x: page.x,
      y,
      width: page.width,
      columns: [
        { key: 'label', width: 0.12 },
        { key: 'todayPct', width: 0.14, align: 'right' },
        { key: 'todayLbs', width: 0.14, align: 'right' },
        { key: 'mid', width: 0.18, align: 'center' },
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
    }) + SEMINAR_PDF.paragraphGap;
  }

  const weekly = `You project to lose an average of ${fp.weeklyFatLossLbs} pounds of fat per week. In addition, you could gain lean weight. Gaining lean weight will increase your strength and energy and offset your fat loss.`;
  y = drawParagraphs(doc, [weekly], page.x, y, page.width);
  y = drawParagraphs(doc, [fp.macroIntro], page.x, y, page.width);

  drawTable(doc, {
    x: page.x,
    y,
    width: page.width,
    columns: [
      { key: 'label', width: 0.22 },
      { key: 'proteinG', width: 0.08, align: 'right' },
      { key: 'proteinCal', width: 0.1, align: 'right' },
      { key: 'carbsG', width: 0.08, align: 'right' },
      { key: 'carbsCal', width: 0.1, align: 'right' },
      { key: 'fatsG', width: 0.08, align: 'right' },
      { key: 'fatsCal', width: 0.1, align: 'right' },
      { key: 'totalCal', width: 0.1, align: 'right' },
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
  finishLockedPage(doc, page.box, payload, 4);
}

function drawServingsPage(doc, payload) {
  const servings = payload.servings;
  const page = beginLockedPage(doc, payload, 'Servings');
  let { y } = page;

  y = drawParagraphs(doc, [servings.note], page.x, y, page.width);

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

  drawTable(doc, {
    x: page.x,
    y,
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
  finishLockedPage(doc, page.box, payload, 5);
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
  drawHistoryPage(doc, payload);
  drawFoodPlanPage(doc, payload);
  drawServingsPage(doc, payload);

  const buffer = await creator.finish();
  const pages = (buffer.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  if (pages !== KWARNER_LOCKED_TOTAL_PAGES) {
    throw new Error(`Preview PDF expected ${KWARNER_LOCKED_TOTAL_PAGES} pages, got ${pages}`);
  }
  return buffer;
}
