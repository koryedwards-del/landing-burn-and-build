import path from 'path';
import { fileURLToPath } from 'url';
import {
  PDF_HEADER,
  PDF_LOGO_REL,
  PDF_MARGIN,
  PDF_WATERMARK_OPACITY,
  PDF_WATERMARK_SIZE_PT,
} from './constants.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const logoPath = path.join(root, PDF_LOGO_REL);

export function contentBox(doc) {
  const { width, height } = doc.page;
  return {
    x: PDF_MARGIN.left,
    y: PDF_MARGIN.top,
    width: width - PDF_MARGIN.left - PDF_MARGIN.right,
    height: height - PDF_MARGIN.top - PDF_MARGIN.bottom,
    bottom: height - PDF_MARGIN.bottom,
  };
}

export function drawWatermark(doc) {
  const { width, height } = doc.page;
  const size = PDF_WATERMARK_SIZE_PT;
  const x = (width - size) / 2;
  const y = (height - size) / 2;

  doc.save();
  doc.opacity(PDF_WATERMARK_OPACITY);
  doc.image(logoPath, x, y, { width: size, height: size, fit: [size, size] });
  doc.restore();
  doc.opacity(1);
}

export function drawGenericHeader(doc, title, box = contentBox(doc)) {
  const logoY = box.y;
  const textX = box.x + PDF_HEADER.logoWidth + 16;
  const textWidth = box.width - PDF_HEADER.logoWidth - 16;

  doc.image(logoPath, box.x, logoY, { width: PDF_HEADER.logoWidth });

  let textY = logoY + 2;
  doc
    .font('Helvetica-Bold')
    .fontSize(PDF_HEADER.brandSize)
    .fillColor('#888888')
    .text('BURN & BUILD DIET', textX, textY, {
      width: textWidth,
      characterSpacing: 1.6,
    });

  textY = doc.y + 3;
  doc
    .font('Helvetica-Bold')
    .fontSize(PDF_HEADER.titleSize)
    .fillColor('#111111')
    .text(String(title || '').toUpperCase(), textX, textY, {
      width: textWidth,
      lineGap: 0,
    });

  const headerBottom = Math.max(doc.y, logoY + PDF_HEADER.logoWidth) + PDF_HEADER.ruleGap;
  doc
    .strokeColor('#e8e8e8')
    .lineWidth(1)
    .moveTo(box.x, headerBottom)
    .lineTo(box.x + box.width, headerBottom)
    .stroke();

  doc.fillColor('#111111');
  return headerBottom + PDF_HEADER.gap;
}
