/** Golden sample fixtures — regression check for burnEngine.js + printout calcs */
import { computePlan, PROJECTION_BF_FLOOR } from '../js/burnEngine.js';
import {
  computeDietEightWeekProjection,
  computeDietProjectionTimeline,
  computeTodayBodyComposition,
  desirableLeanBodyMassLbs,
} from '../js/bodyCompositionData.js';
import { buildProgramPackage } from '../js/programPackageData.js';
import { servingsGridRows } from '../js/servingsPrintout.js';
import {
  GOLDEN_SAMPLE_FORM,
  GOLDEN_SAMPLE_GOLDEN,
  GOLDEN_SAMPLE_INTAKE,
} from '../js/printoutVerifyFixtures.js';
import {
  scaleStapleRows,
  menuPlanServingCount,
  scaleStapleServingLabel,
  stapleCategoryServings,
} from '../js/stapleServingPrintout.js';
import { CUTTING_STAPLES_PROTEIN_DAIRY } from '../data/cuttingStaplesPrintout.js';
import { formatProgramDateLong, programPreparedDate } from '../js/programClientDataHelpers.js';
import { buildSampleDietPrintoutPayload } from '../js/sampleDietPrintoutData.js';
import { buildGoldenSamplePackage } from '../js/printoutVerifyFixtures.js';
import { buildSampleDayMenu } from '../js/sampleDayMenuPrintoutData.js';
import { SAMPLE_DIET_WELCOME } from '../js/sampleDietPrintoutCopyData.js';

const rnd = (x) => Math.round(x);

function verifyCase(name, intake, pdf) {
  const plan = computePlan(intake);
  const f = plan.formula;
  const proj = computeDietEightWeekProjection({
    weightLbs: intake.weight,
    leanBodyMass: intake.lbm,
    bodyFatPercent: intake.bf,
    maintainTotalCalories: f.T7,
    reduceTotalCalories: f.T1,
    gender: intake.gender,
  });
  const today = computeTodayBodyComposition({
    totalWeight: intake.weight,
    leanBodyMass: intake.lbm,
    fatPercent: intake.bf,
  });
  const desirable = desirableLeanBodyMassLbs(intake.gender, intake.heightIn);
  const errors = [];

  const expect = (label, actual, expected) => {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      errors.push(`${label}: got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`);
    }
  };

  expect('protein', plan.servings.protein, pdf.servings[0]);
  expect('grains', plan.servings.grainsStarches, pdf.servings[1]);
  expect('fruits', plan.servings.fruits, pdf.servings[2]);
  expect('extra fats', plan.servings.fatMaintain, pdf.servings[3]);
  expect('maintain', [rnd(f.QA), rnd(f.C1 / 4), rnd(f.FD / 9), rnd(f.T7)], pdf.maintain);
  expect('reduce', [rnd(f.QA), rnd(f.C1 / 4), rnd(f.FG / 9), rnd(f.T1)], pdf.reduce);
  expect('RMR', [rnd(f.QB), rnd(f.C2 / 4), rnd(f.FH / 9), rnd(f.T2)], pdf.rmr);
  expect('workday', [rnd(f.QC), rnd(f.C3 / 4), rnd(f.FJ / 9), rnd(f.T3)], pdf.workday);
  expect('weight tr', [rnd(f.QD), rnd(f.C4 / 4), rnd(f.FK / 9), rnd(f.T4)], pdf.weight);
  expect('cardio', [rnd(f.QE), rnd(f.C5 / 4), rnd(f.FL / 9), rnd(f.T5)], pdf.cardio);
  expect('fat burn', [rnd(f.QF), rnd(f.C6 / 4), rnd(f.FM / 9), rnd(f.T6)], pdf.fatburn);
  expect('lean%', today.leanPct, pdf.today[0]);
  expect('fat%', today.fatPct, pdf.today[1]);
  expect('lean lbs', today.leanLbs, pdf.today[2]);
  expect('fat lbs', today.fatLbs, pdf.today[3]);
  expect('total lbs', today.totalLbs, pdf.today[4]);
  expect('fat lost', proj.fatLostLbs, pdf.proj[0]);
  expect('weekly', proj.weeklyFatLossLbs, pdf.proj[1]);
  expect('end fat', proj.endFatLbs, pdf.proj[2]);
  expect('end weight', proj.endWeight, pdf.proj[3]);
  expect('end bf%', proj.endBf, pdf.proj[4]);
  expect('end lean%', proj.endLeanPct, pdf.proj[5]);
  expect('desirable LBM', Math.round(desirable), pdf.desirable);
  if (pdf.capped != null && proj.cappedByFloor !== pdf.capped) {
    errors.push(`capped: got ${proj.cappedByFloor}, want ${pdf.capped}`);
  }

  if (pdf.timeline) {
    const timeline = computeDietProjectionTimeline({
      gender: intake.gender,
      weightLbs: intake.weight,
      leanBodyMass: intake.lbm,
      bodyFatPercent: intake.bf,
      maintainTotalCalories: f.T7,
      reduceTotalCalories: f.T1,
    });
    if (!timeline.valid) {
      errors.push('timeline: invalid');
    } else {
      expect('timeline rows', timeline.rows.map((row) => [
        row.timeline,
        row.bodyFatDisplay,
        row.weightDisplay,
        row.badge,
      ]), pdf.timeline);
      for (const row of timeline.rows) {
        if (row.isCurrent || row.isShowtime) continue;
        const floor = intake.gender === 'female'
          ? PROJECTION_BF_FLOOR.female
          : PROJECTION_BF_FLOOR.male;
        if (row.bodyFat < floor) {
          errors.push(`timeline guardrail: ${row.timeline} body fat ${row.bodyFat}% below floor`);
        }
      }
    }
  }

  if (errors.length) {
    console.error(`FAIL ${name}`);
    errors.forEach((e) => console.error(`  ${e}`));
    return false;
  }
  console.log(`OK ${name}`);
  return true;
}

function verifyGoldenSamplePackage() {
  const pkg = buildProgramPackage(GOLDEN_SAMPLE_FORM);
  const errors = [];
  const expect = (label, actual, expected) => {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      errors.push(`${label}: got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`);
    }
  };

  expect('leanBodyMass', pkg.intake.leanBodyMass, GOLDEN_SAMPLE_INTAKE.lbm);
  expect('workIntensity', pkg.intake.workIntensity, GOLDEN_SAMPLE_INTAKE.intensity);
  expect('weightTrainingHours', pkg.intake.weightTrainingHours, GOLDEN_SAMPLE_INTAKE.weightTrainingHours);
  expect('cardioHours', pkg.intake.cardioHours, GOLDEN_SAMPLE_INTAKE.cardioHours);
  expect('fatBurningHours', pkg.intake.fatBurningHours, GOLDEN_SAMPLE_INTAKE.fatBurningHours);

  const f = pkg.plan.formula;
  expect('maintain total', rnd(f.T7), GOLDEN_SAMPLE_GOLDEN.maintain[3]);
  expect('reduce total', rnd(f.T1), GOLDEN_SAMPLE_GOLDEN.reduce[3]);
  expect('protein servings', pkg.plan.servings.protein, GOLDEN_SAMPLE_GOLDEN.servings[0]);

  if (errors.length) {
    console.error('FAIL golden sample package');
    errors.forEach((e) => console.error(`  ${e}`));
    return false;
  }
  console.log('OK golden sample package');
  return true;
}

function verifyGoldenSampleServingsGrid() {
  const pkg = buildProgramPackage(GOLDEN_SAMPLE_FORM);
  const rows = servingsGridRows(pkg);
  const errors = [];
  const expect = (label, actual, expected) => {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      errors.push(`${label}: got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`);
    }
  };

  const protein = rows.find((row) => row.label === 'Protein');
  expect('golden sample protein row', protein, {
    label: 'Protein',
    daily: '9',
    breakfast: '3',
    snack1: '',
    lunch: '3',
    snack2: '',
    dinner: '3',
    snack3: '',
  });

  const fruits = rows.find((row) => row.label === 'Fruits');
  expect('golden sample fruit row', fruits, {
    label: 'Fruits',
    daily: '3',
    breakfast: '',
    snack1: '1',
    lunch: '',
    snack2: '1',
    dinner: '',
    snack3: '1',
  });

  const pkgTen = buildProgramPackage(GOLDEN_SAMPLE_FORM);
  pkgTen.plan = { servings: { protein: 10, grainsStarches: 11, vegetables: 1, fruits: 4 } };
  const divided = servingsGridRows(pkgTen);
  const proteinTen = divided.find((row) => row.label === 'Protein');
  expect('protein 10 daily thirds', proteinTen, {
    label: 'Protein',
    daily: '10',
    breakfast: '3.3',
    snack1: '',
    lunch: '3.3',
    snack2: '',
    dinner: '3.3',
    snack3: '',
  });
  const grainsEleven = divided.find((row) => row.label === 'Grains/Starches');
  expect('grains 11 daily thirds', grainsEleven?.breakfast, '3.7');
  expect('grains 11 daily thirds lunch', grainsEleven?.lunch, '3.7');
  const fruitsFour = divided.find((row) => row.label === 'Fruits');
  expect('fruits 4 daily thirds', fruitsFour?.snack1, '1.3');
  expect('fruits 4 daily thirds snack2', fruitsFour?.snack2, '1.3');
  expect('fruits 4 daily thirds snack3', fruitsFour?.snack3, '1.3');

  for (const row of rows) {
    for (const [key, value] of Object.entries(row)) {
      if (key === 'label' || value === '') continue;
      if (/^\d+\.\d{2,}/.test(String(value))) {
        errors.push(`${row.label}.${key}: over-precise decimal "${value}"`);
      }
    }
  }

  if (errors.length) {
    console.error('FAIL golden sample servings grid');
    errors.forEach((e) => console.error(`  ${e}`));
    return false;
  }
  console.log('OK golden sample servings grid');
  return true;
}

function verifyStapleServingScale() {
  const errors = [];
  const expect = (label, actual, expected) => {
    if (actual !== expected) errors.push(`${label}: got ${actual}, want ${expected}`);
  };

  expect('scaleStapleServingLabel 3×26g', scaleStapleServingLabel('26g', 3), '78g');
  expect('scaleStapleServingLabel 3×2 whites', scaleStapleServingLabel('2 whites', 3), '6 whites');
  expect(
    'scaleStapleServingLabel 5× eggs',
    scaleStapleServingLabel('1 whole egg (yolks optional) / 1 egg white', 5),
    '5 whole eggs (yolks optional) / 5 egg whites',
  );
  expect(
    'scaleStapleServingLabel rounds eggs up',
    scaleStapleServingLabel('1 whole egg (yolks optional) / 1 egg white', 3.7),
    '4 whole eggs (yolks optional) / 4 egg whites',
  );
  expect(
    'scaleStapleServingLabel rounds eggs down',
    scaleStapleServingLabel('1 whole egg (yolks optional) / 1 egg white', 3.4),
    '3 whole eggs (yolks optional) / 3 egg whites',
  );
  expect('stapleCategoryServings protein 15 meal slot', stapleCategoryServings({ protein: 15 }, 'protein'), 5);

  const plan = { protein: 9, grainsStarches: 9, vegetables: 1, fruits: 3 };
  expect('protein meal servings', stapleCategoryServings(plan, 'protein'), 3);
  const chicken = scaleStapleRows(
    CUTTING_STAPLES_PROTEIN_DAIRY,
    stapleCategoryServings(plan, 'protein'),
  ).find((row) => row.name === 'Chicken breast');
  expect('golden sample chicken food list', chicken?.serving, '78g');
  const eggs = scaleStapleRows(
    CUTTING_STAPLES_PROTEIN_DAIRY,
    stapleCategoryServings(plan, 'protein'),
  ).find((row) => row.name === 'Eggs');
  expect('golden sample eggs food list', eggs?.serving, '3 whole eggs (yolks optional) / 3 egg whites');

  const plan15 = { protein: 15, grainsStarches: 9, vegetables: 1, fruits: 3 };
  const eggsFive = scaleStapleRows(
    CUTTING_STAPLES_PROTEIN_DAIRY,
    stapleCategoryServings(plan15, 'protein'),
  ).find((row) => row.name === 'Eggs');
  expect('protein 15 eggs food list', eggsFive?.serving, '5 whole eggs (yolks optional) / 5 egg whites');

  if (errors.length) {
    console.error('FAIL staple serving scale');
    errors.forEach((e) => console.error(`  ${e}`));
    return false;
  }
  console.log('OK staple serving scale');
  return true;
}

function verifyProgramDates() {
  const errors = [];
  const expect = (label, actual, expected) => {
    if (actual !== expected) errors.push(`${label}: got ${actual}, want ${expected}`);
  };

  const pkg = {
    program: {
      foodPlanCreatedDate: '2026-08-27',
      issuedAt: '2026-08-28T02:00:00.000Z',
      clientTimezone: 'America/Los_Angeles',
    },
  };
  expect('programPreparedDate prefers local created date', programPreparedDate(pkg), '2026-08-27');
  expect('formatProgramDateLong from date key', formatProgramDateLong('2026-08-27'), 'August 27, 2026');

  const tzOnly = {
    program: {
      issuedAt: '2026-08-28T02:00:00.000Z',
      clientTimezone: 'America/Los_Angeles',
    },
  };
  expect('programPreparedDate uses client timezone', programPreparedDate(tzOnly), '2026-08-27');

  const payload = buildSampleDietPrintoutPayload(buildGoldenSamplePackage());
  expect('payload preparedDate', payload.preparedDate, '2024-01-15');
  expect('payload preparedDateLong matches preparedDate', payload.preparedDateLong, 'January 15, 2024');

  if (errors.length) {
    console.error('FAIL program dates');
    errors.forEach((e) => console.error(`  ${e}`));
    return false;
  }
  console.log('OK program dates');
  return true;
}

function verifySampleDayMenuScale() {
  const errors = [];
  const expect = (label, actual, expected) => {
    if (actual !== expected) errors.push(`${label}: got ${actual}, want ${expected}`);
  };

  const pkg = buildGoldenSamplePackage();
  const menu = buildSampleDayMenu(pkg);

  const breakfast = menu.sections.find((section) => section.title === 'Breakfast');
  expect('menu breakfast eggs', breakfast?.rows[0]?.servingSize, '3 whole eggs (yolks optional) / 3 egg whites');
  expect('menu breakfast oatmeal', breakfast?.rows[1]?.servingSize, '63g');

  const snack1 = menu.sections[1]?.rows[0];
  expect('menu snack1 apples', snack1?.servingSize, '130g');

  const lunch = menu.sections.find((section) => section.title === 'Lunch');
  expect('menu lunch chicken', lunch?.rows[0]?.servingSize, '78g');
  expect('menu lunch rice', lunch?.rows[1]?.servingSize, '150g');

  const dinner = menu.sections.find((section) => section.title === 'Dinner');
  expect('menu dinner sirloin', dinner?.rows[0]?.servingSize, '81g');
  expect('menu dinner sweet potato', dinner?.rows[1]?.servingSize, '204g');
  expect('menu dinner broccoli', dinner?.rows[2]?.servingSize, '139g');

  const pkgFour = buildGoldenSamplePackage();
  pkgFour.plan.servings.fruits = 4;
  const menuFour = buildSampleDayMenu(pkgFour);
  const snack1Four = menuFour.sections[1]?.rows[0];
  const snack2Four = menuFour.sections[3]?.rows[0];
  const snack3Four = menuFour.sections[5]?.rows[0];
  expect('menu snack1 apples daily 4', snack1Four?.servingSize, '173g');
  expect('menu snack2 apples daily 4', snack2Four?.servingSize, '173g');
  expect('menu snack3 apples daily 4', snack3Four?.servingSize, '173g');

  const pkgTen = buildGoldenSamplePackage();
  pkgTen.plan.servings.protein = 10;
  const menuTen = buildSampleDayMenu(pkgTen);
  const breakfastTen = menuTen.sections.find((section) => section.title === 'Breakfast');
  const lunchTen = menuTen.sections.find((section) => section.title === 'Lunch');
  expect('menu breakfast eggs daily 10', breakfastTen?.rows[0]?.servingSize, '3 whole eggs (yolks optional) / 3 egg whites');
  expect('menu lunch chicken daily 10', lunchTen?.rows[0]?.servingSize, '87g');
  expect('menuPlanServingCount protein 10', menuPlanServingCount(pkgTen.plan.servings, 'protein'), 10 / 3);

  if (errors.length) {
    console.error('FAIL sample day menu scale');
    errors.forEach((e) => console.error(`  ${e}`));
    return false;
  }
  console.log('OK sample day menu scale');
  return true;
}

function verifyWelcomePageRefs() {
  const errors = [];
  const expectIncludes = (label, text, needle) => {
    if (!String(text).includes(needle)) errors.push(`${label}: missing "${needle}"`);
  };
  const expectExcludes = (label, text, needle) => {
    if (String(text).includes(needle)) errors.push(`${label}: should not include "${needle}"`);
  };

  expectIncludes('foodPlan page', SAMPLE_DIET_WELCOME.foodPlan, 'Page three');
  expectExcludes('foodPlan page', SAMPLE_DIET_WELCOME.foodPlan, 'Page four');
  expectIncludes('servings page', SAMPLE_DIET_WELCOME.servings, 'Page four');
  expectIncludes('servings table ref', SAMPLE_DIET_WELCOME.servings, 'page three');
  expectExcludes('servings page', SAMPLE_DIET_WELCOME.servings, 'Page five');
  expectIncludes('foodList pages', SAMPLE_DIET_WELCOME.foodList, 'Pages five and six');
  expectIncludes('menuPlan page', SAMPLE_DIET_WELCOME.menuPlan, 'Page seven');
  expectIncludes('questionnaire page', SAMPLE_DIET_WELCOME.questionnaireConfirmation, 'Page eight');
  expectExcludes('intro history', SAMPLE_DIET_WELCOME.intro[1], 'body composition history');
  expectExcludes('intro last two pages', SAMPLE_DIET_WELCOME.intro[1], 'last two pages');

  if (errors.length) {
    console.error('FAIL welcome page refs');
    errors.forEach((e) => console.error(`  ${e}`));
    return false;
  }
  console.log('OK welcome page refs');
  return true;
}

const ok = [
  verifyGoldenSamplePackage(),
  verifyGoldenSampleServingsGrid(),
  verifyStapleServingScale(),
  verifyProgramDates(),
  verifySampleDayMenuScale(),
  verifyWelcomePageRefs(),
  verifyCase('Golden sample female', GOLDEN_SAMPLE_INTAKE, GOLDEN_SAMPLE_GOLDEN),
  verifyCase('Dustin Kinzler', {
    lbm: 175.3, weight: 253, bf: 30.72, gender: 'male', heightIn: 68,
    intensity: 2.0, weightTrainingHours: 0, cardioHours: 0.75, fatBurningHours: 3.5,
  }, {
    servings: [13, 12, 4, 31], maintain: [111, 299, 195, 3391], reduce: [111, 299, 74, 2305],
    rmr: [68, 120, 124, 1867], workday: [45, 143, 59, 1288], weight: [13, 148, 5, 691],
    cardio: [5, 135, 25, 784], fatburn: [7, 84, 34, 672],
    today: ['69.28', '30.72', '175.3', '77.7', '253.0'],
    proj: [18.6, 2.2, 59.1, 234.4, 25.21, 74.79], desirable: 151, capped: false,
  }),
  verifyCase('Kristina Salazar', {
    lbm: 141.5, weight: 200, bf: 29.24, gender: 'female', heightIn: 66,
    intensity: 1, weightTrainingHours: 6, cardioHours: 0, fatBurningHours: 0,
  }, {
    servings: [9, 13, 4, 18], maintain: [86, 287, 123, 2592], reduce: [86, 287, 47, 1908],
    rmr: [55, 96, 100, 1507], workday: [25, 102, 22, 708], weight: [11, 120, 4, 558],
    cardio: [4, 109, 20, 633], fatburn: [6, 68, 28, 543],
    today: ['70.76', '29.24', '141.5', '58.5', '200.0'],
    proj: [11.7, 1.4, 46.8, 188.3, 24.84, 75.16], desirable: 106, capped: false,
  }),
  verifyCase('Monica Anderson 2023', {
    lbm: 101.4, weight: 116.2, bf: 12.77, gender: 'female', heightIn: 62,
    intensity: 2.5, weightTrainingHours: 2, cardioHours: 3.8, fatBurningHours: 3,
  }, {
    servings: [9, 9, 3, 21], maintain: [72, 226, 132, 2384], reduce: [72, 226, 50, 1645],
    rmr: [40, 69, 72, 1080], workday: [32, 80, 51, 907], weight: [8, 86, 3, 400],
    cardio: [3, 78, 14, 454], fatburn: [4, 48, 20, 389],
    today: ['87.23', '12.77', '101.4', '14.8', '116.2'],
    proj: [5.7, 0.7, 9.1, 110.5, 8.95, 91.05], desirable: 98, capped: true,
  }),
  verifyCase('Monica Anderson 2024', {
    lbm: 97.1, weight: 118, bf: 17.69, gender: 'female', heightIn: 62,
    intensity: 2, weightTrainingHours: 1.25, cardioHours: 1.25, fatBurningHours: 3,
  }, {
    servings: [7, 7, 3, 17], maintain: [63, 182, 108, 1951], reduce: [63, 182, 41, 1349],
    rmr: [38, 66, 69, 1034], workday: [25, 79, 33, 714], weight: [7, 82, 3, 383],
    cardio: [3, 75, 14, 434], fatburn: [4, 46, 19, 372],
    today: ['82.31', '17.69', '97.1', '20.9', '118.0'],
    proj: [10.3, 1.2, 10.6, 107.7, 9.82, 90.18], desirable: 98, capped: false,
  }),
  verifyCase('Paul Ramirez', {
    lbm: 176.3, weight: 230, bf: 23.36, gender: 'male', heightIn: 68,
    intensity: 1.5, weightTrainingHours: 3, cardioHours: 0, fatBurningHours: 0,
  }, {
    servings: [13, 12, 4, 25], maintain: [107, 303, 163, 3109], reduce: [107, 303, 62, 2199],
    rmr: [69, 120, 125, 1878], workday: [38, 139, 42, 1089], weight: [13, 149, 5, 695],
    cardio: [5, 136, 25, 789], fatburn: [7, 84, 35, 676],
    today: ['76.64', '23.36', '176.3', '53.7', '230.0'],
    proj: [15.6, 1.8, 38.1, 214.4, 17.77, 82.23], desirable: 151, capped: false,
  }),
  verifyCase('Randy Anderson 2024', {
    lbm: 118.8, weight: 160, bf: 25.78, gender: 'male', heightIn: 67,
    intensity: 2, weightTrainingHours: 4, cardioHours: 3, fatBurningHours: 3,
  }, {
    servings: [9, 13, 4, 22], maintain: [81, 285, 138, 2704], reduce: [81, 285, 52, 1936],
    rmr: [46, 81, 84, 1265], workday: [31, 97, 40, 873], weight: [9, 101, 3, 468],
    cardio: [4, 92, 17, 531], fatburn: [5, 57, 23, 455],
    today: ['74.22', '25.78', '118.8', '41.2', '160.0'],
    proj: [13.2, 1.5, 28, 146.8, 19.1, 80.9], desirable: 145, capped: false,
  }),
  verifyCase('George Cabrera', {
    lbm: 197.3, weight: 220, bf: 10.34, gender: 'male', heightIn: 72,
    intensity: 2.5, weightTrainingHours: 4, cardioHours: 0, fatBurningHours: 0,
  }, {
    servings: [17, 15, 5, 36], maintain: [138, 364, 228, 4058], reduce: [138, 364, 87, 2788],
    rmr: [77, 135, 139, 2101], workday: [62, 156, 99, 1765], weight: [15, 167, 6, 777],
    cardio: [6, 152, 28, 883], fatburn: [8, 94, 39, 756],
    today: ['89.66', '10.34', '197.3', '22.7', '220.0'],
    proj: [13.5, 1.6, 9.2, 206.5, 4.68, 95.32], desirable: 171, capped: true,
  }),
].every(Boolean);

process.exit(ok ? 0 : 1);
