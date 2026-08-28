/**
 * Modern Lean Body Analysis page — personalized results + reference range bars.
 */
import { begin1982Page, TABLE_1982 } from './draw1982Frame.js';
import {
  MODERN_REPORT_COLORS,
  MODERN_REPORT_FONTS,
  modernFooterRuleY,
  registerModernReportFonts,
} from './drawModernReportFrame.js';

const FONTS = MODERN_REPORT_FONTS;
const COLORS = MODERN_REPORT_COLORS;

const LAYOUT = Object.freeze({
  sectionHeadingSize: 10,
  sectionRuleGap: 3,
  sectionRuleWidth: 1.25,
  sectionHeadingGap: 8,
  sectionGap: 12,
  todayPanelPad: 8,
  todayBadgeH: 14,
  todayLabelSize: 7.5,
  todayValueSize: 11.5,
  todayPctSize: 8,
  todayRowGap: 2,
  heroSize: 11,
  heroGap: 6,
  bodySize: 9,
  bodyLineGap: 1.5,
  bodyGap: 8,
  calloutPad: 8,
  calloutGap: 10,
  lbmBodySize: 9,
  lbmGap: 6,
  lbmWhyPunchlineGap: 6,
  introSize: 9,
  introGap: 6,
  tableRowPad: 6,
  tableCellPad: 5,
  tableLabelSize: 7.5,
  tableLabelActiveSize: 8,
  tableValueSize: 8.5,
  tableValueActiveSize: 9.5,
  monitorSize: 8,
  monitorLineGap: 1.5,
  monitorGapAboveFooter: 18,
  monitorSectionGap: 8,
});

function drawSectionHeading(doc, x, y, width, text) {
  const label = String(text || '');
  doc
    .font(FONTS.bold)
    .fontSize(LAYOUT.sectionHeadingSize)
    .fillColor(COLORS.body)
    .text(label, x, y, { width, lineBreak: false });

  const textW = doc.widthOfString(label);
  const ruleY = y + LAYOUT.sectionHeadingSize + LAYOUT.sectionRuleGap;
  doc
    .strokeColor(COLORS.gold)
    .lineWidth(LAYOUT.sectionRuleWidth)
    .moveTo(x, ruleY)
    .lineTo(x + textW, ruleY)
    .stroke();

  return ruleY + LAYOUT.sectionHeadingGap;
}

function stripLbs(value) {
  return String(value ?? '').replace(/\s*lbs\.?$/i, '').trim();
}

function stripPct(value) {
  return String(value ?? '').replace(/%$/, '').trim();
}

function drawTodayPanel(doc, x, y, width, todayRows, heading) {
  const rows = todayRows || [];
  const pad = LAYOUT.todayPanelPad;
  const colCount = Math.max(rows.length, 1);
  const colW = (width - pad * 2) / colCount;
  const badgeH = LAYOUT.todayBadgeH;
  const metricH = LAYOUT.todayLabelSize + LAYOUT.todayValueSize + LAYOUT.todayPctSize + LAYOUT.todayRowGap * 2;
  const totalH = pad + badgeH + 6 + metricH + pad;

  doc
    .strokeColor(COLORS.gold)
    .lineWidth(1.25)
    .roundedRect(x, y, width, totalH, TABLE_1982.radius)
    .stroke();

  const badgeW = 52;
  doc
    .roundedRect(x + pad, y + pad, badgeW, badgeH, 3)
    .fill(COLORS.body);
  doc
    .font(FONTS.bold)
    .fontSize(LAYOUT.todayLabelSize)
    .fillColor(COLORS.white)
    .text(String(heading || 'TODAY'), x + pad, y + pad + 4, {
      width: badgeW,
      align: 'center',
      lineBreak: false,
    });

  let metricY = y + pad + badgeH + 6;
  rows.forEach((row, index) => {
    const colX = x + pad + colW * index;
    const label = String(row.label || '');
    const lbs = `${stripLbs(row.lbs)} lbs`;
    const pct = `${stripPct(row.pct)}%`;
    const valueY = metricY + LAYOUT.todayLabelSize + LAYOUT.todayRowGap;

    doc.save();
    doc.rect(colX + 2, valueY - 1, colW - 4, LAYOUT.todayValueSize + 4).fill(COLORS.goldPale);
    doc.restore();

    doc.font(FONTS.bold).fontSize(LAYOUT.todayLabelSize).fillColor(COLORS.muted);
    doc.text(label, colX, metricY, { width: colW, align: 'center', lineBreak: false });

    doc.font(FONTS.bold).fontSize(LAYOUT.todayValueSize).fillColor(COLORS.body);
    doc.text(lbs, colX, valueY, { width: colW, align: 'center', lineBreak: false });

    doc.font(FONTS.regular).fontSize(LAYOUT.todayPctSize).fillColor(COLORS.muted);
    doc.text(pct, colX, valueY + LAYOUT.todayValueSize + LAYOUT.todayRowGap, {
      width: colW,
      align: 'center',
      lineBreak: false,
    });

    if (index > 0) {
      doc
        .strokeColor(COLORS.rule)
        .lineWidth(0.5)
        .moveTo(colX, metricY - 2)
        .lineTo(colX, metricY + metricH)
        .stroke();
    }
  });

  return y + totalH;
}

function drawBfHeroLine(doc, x, y, width, bodyFatPercent, categoryLabel) {
  const pct = String(bodyFatPercent || '—');
  const category = String(categoryLabel || '').toUpperCase();
  doc.font(FONTS.regular).fontSize(LAYOUT.heroSize).fillColor(COLORS.body);
  const prefix = `${pct} → `;
  doc.text(prefix, x, y, { continued: true, lineBreak: false });
  doc.font(FONTS.bold).fillColor(COLORS.gold).text(category, {
    continued: false,
    lineBreak: false,
  });
  return y + LAYOUT.heroSize + LAYOUT.heroGap;
}

function measureRangeBarTable(doc, columns, rows, width) {
  const colWidths = columns.map((col) => col.width * width);
  return rows.map((row) => {
    let maxH = LAYOUT.tableRowPad * 2;
    columns.forEach((col, index) => {
      const active = Boolean(row._active?.[col.key]);
      const isLabelRow = Boolean(row._isLabelRow);
      const fontSize = isLabelRow
        ? (active ? LAYOUT.tableLabelActiveSize : LAYOUT.tableLabelSize)
        : (active ? LAYOUT.tableValueActiveSize : LAYOUT.tableValueSize);
      const font = active ? FONTS.bold : FONTS.regular;
      doc.font(font).fontSize(fontSize);
      const innerW = colWidths[index] - LAYOUT.tableCellPad * 2;
      maxH = Math.max(
        maxH,
        doc.heightOfString(String(row[col.key] ?? ''), { width: innerW, lineGap: 0 })
          + LAYOUT.tableRowPad * 2,
      );
    });
    return maxH;
  });
}

function drawRangeBarTable(doc, { x, y, width, columns, rows }) {
  const colWidths = columns.map((col) => col.width * width);
  const rowHeights = measureRangeBarTable(doc, columns, rows, width);
  const totalH = rowHeights.reduce((sum, height) => sum + height, 0);

  doc
    .strokeColor(TABLE_1982.stroke)
    .lineWidth(1.25)
    .roundedRect(x, y, width, totalH, TABLE_1982.radius)
    .stroke();

  let cy = y;
  rows.forEach((row, rowIndex) => {
    const rowH = rowHeights[rowIndex];
    let cx = x;

    columns.forEach((col, index) => {
      const cellW = colWidths[index];
      if (row._active?.[col.key]) {
        doc.save();
        doc.rect(cx, cy, cellW, rowH).fill(COLORS.goldPale);
        doc.restore();
      }
      cx += cellW;
    });

    cx = x;
    columns.forEach((col, index) => {
      const cellW = colWidths[index];
      const active = Boolean(row._active?.[col.key]);
      const isLabelRow = Boolean(row._isLabelRow);
      const fontSize = isLabelRow
        ? (active ? LAYOUT.tableLabelActiveSize : LAYOUT.tableLabelSize)
        : (active ? LAYOUT.tableValueActiveSize : LAYOUT.tableValueSize);
      const font = active ? FONTS.bold : FONTS.regular;
      const color = active ? COLORS.body : COLORS.muted;
      doc.font(font).fontSize(fontSize).fillColor(color);
      doc.text(String(row[col.key] ?? ''), cx + LAYOUT.tableCellPad, cy + LAYOUT.tableRowPad, {
        width: cellW - LAYOUT.tableCellPad * 2,
        align: 'center',
        lineGap: 0,
      });
      cx += cellW;
    });

    cy += rowH;
    if (rowIndex < rows.length - 1) {
      doc
        .strokeColor(TABLE_1982.stroke)
        .lineWidth(0.75)
        .moveTo(x, cy)
        .lineTo(x + width, cy)
        .stroke();
    }
  });

  return y + totalH;
}

function buildRangeBarRows(categories, { valueKey, activeKey }) {
  const cols = categories.map((cat, index) => ({
    key: `c${index}`,
    width: 1 / categories.length,
  }));
  const activeFlags = Object.fromEntries(
    categories.map((cat, index) => [`c${index}`, cat.key === activeKey]),
  );
  const labelRow = {
    _isLabelRow: true,
    _active: activeFlags,
    ...Object.fromEntries(
      categories.map((cat, index) => [`c${index}`, String(cat.label || '').toUpperCase()]),
    ),
  };
  const valueRow = {
    _active: activeFlags,
    ...Object.fromEntries(
      categories.map((cat, index) => [`c${index}`, String(cat[valueKey] ?? '')]),
    ),
  };
  return { columns: cols, rows: [labelRow, valueRow] };
}

function drawCallout(doc, x, y, width, text) {
  const body = String(text || '');
  if (!body) return y;
  doc.font(FONTS.regular).fontSize(LAYOUT.bodySize);
  const innerW = width - LAYOUT.calloutPad * 2;
  const textH = doc.heightOfString(body, { width: innerW, lineGap: LAYOUT.bodyLineGap });
  const boxH = textH + LAYOUT.calloutPad * 2;

  doc.save();
  doc.roundedRect(x, y, width, boxH, 4).fill(COLORS.goldPale);
  doc.restore();

  doc
    .font(FONTS.regular)
    .fontSize(LAYOUT.bodySize)
    .fillColor(COLORS.body)
    .text(body, x + LAYOUT.calloutPad, y + LAYOUT.calloutPad, {
      width: innerW,
      lineGap: LAYOUT.bodyLineGap,
    });

  return y + boxH;
}

function drawLbmCallout(doc, x, y, width, callout) {
  if (!callout?.leanLbs) return y;

  const lbs = String(callout.leanLbs);
  const headlineSize = 14;
  doc.font(FONTS.bold).fontSize(headlineSize).fillColor(COLORS.body);
  const lbsText = `${lbs} lbs`;
  doc.text(lbsText, x, y, { lineBreak: false });
  const lbsW = doc.widthOfString(lbsText);
  doc.font(FONTS.regular).fontSize(LAYOUT.lbmBodySize).fillColor(COLORS.muted);
  doc.text(' lean body mass', x + lbsW, y + 2, { lineBreak: false });

  let cursorY = y + headlineSize + LAYOUT.lbmGap;

  if (callout.statusLine) {
    doc
      .font(FONTS.bold)
      .fontSize(LAYOUT.lbmBodySize)
      .fillColor(COLORS.body)
      .text(String(callout.statusLine), x, cursorY, { width, lineGap: LAYOUT.bodyLineGap });
    cursorY = doc.y + LAYOUT.bodyGap;
  }

  return cursorY;
}

function drawLbmWhySection(doc, x, y, width, lbmWhy) {
  if (!lbmWhy?.heading) return y;

  let cursorY = y + LAYOUT.sectionGap - LAYOUT.bodyGap;
  cursorY = drawSectionHeading(doc, x, cursorY, width, lbmWhy.heading);

  if (lbmWhy.lead) {
    doc
      .font(FONTS.regular)
      .fontSize(LAYOUT.lbmBodySize)
      .fillColor(COLORS.body)
      .text(String(lbmWhy.lead), x, cursorY, { width, lineGap: LAYOUT.bodyLineGap });
    cursorY = doc.y + LAYOUT.bodyGap;
  }

  if (lbmWhy.punchline) {
    doc
      .font(FONTS.bold)
      .fontSize(LAYOUT.lbmBodySize)
      .fillColor(COLORS.body)
      .text(String(lbmWhy.punchline), x, cursorY, { width, lineGap: 0 });
    cursorY = doc.y + LAYOUT.lbmWhyPunchlineGap;
  }

  if (lbmWhy.closing) {
    doc
      .font(FONTS.regular)
      .fontSize(LAYOUT.lbmBodySize)
      .fillColor(COLORS.body)
      .text(String(lbmWhy.closing), x, cursorY, { width, lineGap: LAYOUT.bodyLineGap });
    cursorY = doc.y + LAYOUT.bodyGap;
  }

  return cursorY;
}

function drawBodyParagraph(doc, x, y, width, text) {
  const body = String(text || '');
  if (!body) return y;
  doc
    .font(FONTS.regular)
    .fontSize(LAYOUT.bodySize)
    .fillColor(COLORS.body)
    .text(body, x, y, { width, lineGap: LAYOUT.bodyLineGap });
  return doc.y + LAYOUT.bodyGap;
}

function drawMonitorCopy(doc, page, y, text) {
  if (!text) return y;
  const ruleY = modernFooterRuleY(page.box);
  const maxBottom = ruleY - LAYOUT.monitorGapAboveFooter;
  const body = String(text);
  doc.font(FONTS.regular).fontSize(LAYOUT.monitorSize);
  const textH = doc.heightOfString(body, {
    width: page.width,
    lineGap: LAYOUT.monitorLineGap,
  });
  const flowStartY = y + LAYOUT.monitorSectionGap;
  const startY = Math.min(flowStartY, maxBottom - textH);
  if (startY + textH > maxBottom) return y;

  doc.fillColor(COLORS.muted).text(body, page.x, startY, {
    width: page.width,
    lineGap: LAYOUT.monitorLineGap,
    align: 'left',
  });
  return Math.min(doc.y, maxBottom);
}

export function drawModernLeanBodyAnalysisPage(doc, payload) {
  const lba = payload.leanBodyAnalysis;
  if (!lba?.todayRows?.length) return;

  registerModernReportFonts(doc);
  const page = begin1982Page(doc, payload, 'Lean Body Analysis');
  let y = page.y;
  const activeKey = lba.activeBfCategoryKey;

  y = drawTodayPanel(
    doc,
    page.x,
    y,
    page.width,
    lba.todayRows,
    lba.sections?.todayHeading,
  );
  y += LAYOUT.sectionGap;

  if (lba.sections?.bodyFatRangeHeading) {
    y = drawSectionHeading(doc, page.x, y, page.width, lba.sections.bodyFatRangeHeading);
  }

  y = drawBfHeroLine(
    doc,
    page.x,
    y,
    page.width,
    lba.bodyFatPercent,
    lba.activeBfCategoryLabel,
  );

  if (lba.bfRangeCategories?.length) {
    const bfTable = buildRangeBarRows(lba.bfRangeCategories, {
      valueKey: 'bfRangeLabel',
      activeKey,
    });
    y = drawRangeBarTable(doc, {
      x: page.x,
      y,
      width: page.width,
      columns: bfTable.columns,
      rows: bfTable.rows,
    });
    y += LAYOUT.sectionGap;
  }

  if (lba.aceLead) {
    y = drawCallout(doc, page.x, y, page.width, lba.aceLead);
    y += LAYOUT.calloutGap;
  }

  if (lba.lbmLead) {
    y = drawBodyParagraph(doc, page.x, y, page.width, lba.lbmLead);
  }

  if (lba.lbmCallout) {
    y = drawLbmCallout(doc, page.x, y, page.width, lba.lbmCallout);
  }

  if (lba.lbmWhy) {
    y = drawLbmWhySection(doc, page.x, y, page.width, lba.lbmWhy);
  }

  if (lba.weightRangesHeading) {
    y += LAYOUT.sectionGap - LAYOUT.bodyGap;
    y = drawSectionHeading(doc, page.x, y, page.width, lba.weightRangesHeading);
  }

  if (lba.sections?.weightRangesIntro) {
    doc
      .font(FONTS.regular)
      .fontSize(LAYOUT.introSize)
      .fillColor(COLORS.muted)
      .text(String(lba.sections.weightRangesIntro), page.x, y, {
        width: page.width,
        lineGap: LAYOUT.bodyLineGap,
      });
    y = doc.y + LAYOUT.introGap;
  }

  if (lba.bfRangeWeightRanges?.length) {
    const wtTable = buildRangeBarRows(lba.bfRangeWeightRanges, {
      valueKey: 'weightRangeLabel',
      activeKey,
    });
    y = drawRangeBarTable(doc, {
      x: page.x,
      y,
      width: page.width,
      columns: wtTable.columns,
      rows: wtTable.rows,
    });
  }

  drawMonitorCopy(doc, page, y, lba.monitorCopy);
}
