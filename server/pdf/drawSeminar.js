import { drawFrameHeader, PDF_FRAME_FONTS } from './drawFrame.js';

export const SEMINAR_FONTS = PDF_FRAME_FONTS;

export const SEMINAR_COLORS = {
  body: '#111111',
  muted: '#444444',
  rule: '#cccccc',
  tableHead: '#f2f2f2',
  gold: '#FFCC00',
  brand: '#888888',
  panel: '#111111',
  panelMuted: '#cccccc',
  startHere: '#FFCC00',
  startHereText: '#111111',
};

export function drawPersonalizationHeader(doc, payload, box, { fonts = PDF_FRAME_FONTS } = {}) {
  return drawFrameHeader(doc, box, {
    personalized: true,
    clientName: payload.clientName,
    preparedDateLong: payload.preparedDateLong,
    preparedDate: payload.preparedDate,
    fonts,
  });
}
