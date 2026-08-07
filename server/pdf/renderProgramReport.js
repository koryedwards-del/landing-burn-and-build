import { createPrintPdf } from './creator.js';
import { drawFramePageFooter } from './drawFrame.js';
import {
  SEMINAR_TOTAL_PAGES,
  addSeminarPage,
  addSeminarTemplatePage,
  drawGettingStartedPage,
  drawNumberedSteps,
  drawParagraphs,
  drawSeminarHeader,
  drawStepsToSuccessHeader,
  drawSubsectionTitle,
  drawTable,
  drawMacroSignalTable,
  SEMINAR_PDF,
  SEMINAR_COLORS,
  SEMINAR_FONTS,
} from './drawSeminar.js';
import { validatePrintPayload } from './validate.js';

function finishProgramReportPage(doc, box, payload, page) {
  drawFramePageFooter(doc, box, {
    page,
    total: SEMINAR_TOTAL_PAGES,
    contact: payload.header,
  });
}

function drawGettingStartedPdfPage(creator, payload, page) {
  const doc = creator.doc;
  const box = addSeminarTemplatePage(doc);
  drawGettingStartedPage(doc, payload, box);
  finishProgramReportPage(doc, box, payload, page);
}

function drawStepsToSuccessPage(creator, payload, page) {
  const doc = creator.doc;
  const box = addSeminarPage(doc);
  const steps = payload.stepsToSuccess;

  let y = drawStepsToSuccessHeader(doc, payload, box);
  y = drawParagraphs(doc, steps.intro, box.x, y, box.width);
  y = drawNumberedSteps(doc, steps.steps, box.x, y, box.width);

  if (steps.footer) {
    y += 8;
    doc
      .strokeColor(SEMINAR_COLORS.rule)
      .lineWidth(0.5)
      .moveTo(box.x, y)
      .lineTo(box.x + box.width, y)
      .stroke();
    y += SEMINAR_PDF.paragraphGap;
    drawParagraphs(doc, [steps.footer], box.x, y, box.width);
  }

  finishProgramReportPage(doc, box, payload, page);
}

function drawLegacyWelcomePage(creator, payload, page) {
  const doc = creator.doc;
  const box = addSeminarPage(doc);
  const welcome = payload.welcome;
  let y = drawSeminarHeader(doc, payload, 'Welcome', box);

  y = drawParagraphs(doc, welcome.intro, box.x, y, box.width);

  if (welcome.leanBodyAnalysis) {
    y = drawSubsectionTitle(doc, 'Lean Body Analysis', box.x, y, box.width);
    y = drawParagraphs(doc, [welcome.leanBodyAnalysis], box.x, y, box.width);
  }
  if (welcome.history) {
    y = drawSubsectionTitle(doc, 'History', box.x, y, box.width);
    y = drawParagraphs(doc, [welcome.history], box.x, y, box.width);
  }
  if (welcome.foodPlan) {
    y = drawSubsectionTitle(doc, 'Food Plan', box.x, y, box.width);
    y = drawParagraphs(doc, [welcome.foodPlan], box.x, y, box.width);
  }
  if (welcome.servings) {
    y = drawSubsectionTitle(doc, 'Servings', box.x, y, box.width);
    drawParagraphs(doc, [welcome.servings], box.x, y, box.width);
  }

  finishProgramReportPage(doc, box, payload, page);
}

function drawProgramReportOpeningPages(creator, payload) {
  if (payload.gettingStarted) {
    drawGettingStartedPdfPage(creator, payload, 1);
    drawStepsToSuccessPage(creator, payload, 2);
    return;
  }
  if (payload.stepsToSuccess?.steps?.length) {
    drawStepsToSuccessPage(creator, payload, 1);
    return;
  }
  drawLegacyWelcomePage(creator, payload, 1);
}

function drawLeanBodyAnalysisPage(creator, payload, page) {
  const doc = creator.doc;
  const lba = payload.leanBodyAnalysis;
  const box = addSeminarPage(doc);
  let y = drawSeminarHeader(doc, payload, 'Lean Body Analysis', box);

  doc
    .font(SEMINAR_FONTS.regular)
    .fontSize(SEMINAR_PDF.bodySize)
    .fillColor(SEMINAR_COLORS.body)
    .text(
      `Height: ${lba.heightInches} inches  Sex: ${lba.sex}  Thigh: ${lba.thigh}  Waist: ${lba.waist}  Age: ${lba.age} years of experience`,
      box.x,
      y,
      { width: box.width, lineGap: 0 },
    );

  y = doc.y + SEMINAR_PDF.sectionGap;
  y = drawSubsectionTitle(doc, '--TODAY--', box.x, y, box.width);

  y = drawTable(doc, {
    x: box.x,
    y,
    width: box.width,
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
    x: box.x,
    y,
    width: box.width,
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
    y = drawParagraphs(doc, [lba.riskMessage], box.x, y, box.width);
  }

  y = drawParagraphs(doc, [lba.footerCopy], box.x, y, box.width);

  if (lba.lbmLead) {
    y = drawParagraphs(doc, [lba.lbmLead], box.x, y, box.width);
  }
  if (lba.lbmCongrats) {
    y = drawParagraphs(doc, [lba.lbmCongrats], box.x, y, box.width);
  }

  y = drawTable(doc, {
    x: box.x,
    y,
    width: box.width,
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

  drawParagraphs(doc, [lba.monitorCopy], box.x, y, box.width);
  finishProgramReportPage(doc, box, payload, page);
}

function drawHistoryPage(creator, payload, page) {
  const doc = creator.doc;
  const box = addSeminarPage(doc);
  const y = drawSeminarHeader(doc, payload, 'Body Composition History', box);

  drawTable(doc, {
    x: box.x,
    y,
    width: box.width,
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

  finishProgramReportPage(doc, box, payload, page);
}

function drawFoodPlanPage(creator, payload, page) {
  const doc = creator.doc;
  const fp = payload.foodPlan;
  const box = addSeminarPage(doc);
  let y = drawSeminarHeader(doc, payload, 'Food Plan', box);

  const intro = `The following food program contains a sophisticated calculation that is based on your individual lean body mass (LBM), and on your activities. This is the most individualized food program available for losing fat. In eight weeks, you could safely lose ${fp.fatLostLbs} pounds of fat. On your information sheet, you indicated you plan to exercise a total of ${fp.introHours.total} hour(s) per week. ${fp.introHours.wt} hour(s) of weight training, ${fp.introHours.cardio} hour(s) of cardiovascular activities, ${fp.introHours.fatBurn} hour(s) of fat-burning activities`;
  y = drawParagraphs(doc, [intro], box.x, y, box.width);

  if (fp.goal) {
    y = drawTable(doc, {
      x: box.x,
      y,
      width: box.width,
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
  y = drawParagraphs(doc, [weekly], box.x, y, box.width);

  finishProgramReportPage(doc, box, payload, page);
}

function drawServingsPage(creator, payload, page) {
  const doc = creator.doc;
  const servings = payload.servings;
  const fp = payload.foodPlan;
  const box = addSeminarPage(doc);
  let y = drawSeminarHeader(doc, payload, 'Servings', box);

  y = drawParagraphs(doc, [fp.macroSignalIntro], box.x, y, box.width);
  y = drawMacroSignalTable(doc, {
    x: box.x,
    y,
    width: box.width,
    rows: fp.macroSignalRows,
  }) + SEMINAR_PDF.paragraphGap;

  y = drawParagraphs(doc, [servings.note], box.x, y, box.width);

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
    x: box.x,
    y,
    width: box.width,
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

  finishProgramReportPage(doc, box, payload, page);
}

export async function renderProgramReportPdf(payload, { title } = {}) {
  validatePrintPayload('programreport', payload);

  const creator = createPrintPdf({
    title: title || payload.title || 'Program Report',
    author: 'Burn & Build Diet',
  });

  drawProgramReportOpeningPages(creator, payload);
  drawLeanBodyAnalysisPage(creator, payload, 3);
  drawHistoryPage(creator, payload, 4);
  drawFoodPlanPage(creator, payload, 5);
  drawServingsPage(creator, payload, 6);

  const buffer = await creator.finish();
  const pages = (buffer.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  if (pages !== SEMINAR_TOTAL_PAGES) {
    throw new Error(`Program report PDF expected ${SEMINAR_TOTAL_PAGES} pages, got ${pages}`);
  }
  return buffer;
}
