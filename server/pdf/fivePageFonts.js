import path from 'path';
import { fileURLToPath } from 'url';

const fontsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fonts');

const FONT_FILES = Object.freeze({
  regular: path.join(fontsDir, 'Montserrat-Regular.ttf'),
  bold: path.join(fontsDir, 'Montserrat-Bold.ttf'),
  italic: path.join(fontsDir, 'Montserrat-Italic.ttf'),
  boldItalic: path.join(fontsDir, 'Montserrat-BoldItalic.ttf'),
});

/** PDFKit registered names for the sample-female printout. */
export const FIVE_PAGE_FONTS = Object.freeze({
  regular: 'Montserrat',
  bold: 'Montserrat-Bold',
  italic: 'Montserrat-Italic',
  boldItalic: 'Montserrat-BoldItalic',
});

export function registerFivePageFonts(doc) {
  doc.registerFont(FIVE_PAGE_FONTS.regular, FONT_FILES.regular);
  doc.registerFont(FIVE_PAGE_FONTS.bold, FONT_FILES.bold);
  doc.registerFont(FIVE_PAGE_FONTS.italic, FONT_FILES.italic);
  doc.registerFont(FIVE_PAGE_FONTS.boldItalic, FONT_FILES.boldItalic);
}
