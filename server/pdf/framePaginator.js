import {
  addFramePage,
  drawFrameFooter,
  drawFrameHeader,
  drawFramePageTitle,
  frameContentContainer,
  PDF_FRAME_CONTACT,
} from './drawFrame.js';

/**
 * Paginates body content inside the unified B&B frame.
 * Content is clipped to the container — never bleeds into the footer.
 */
export function createFramePaginator(doc, {
  personalized = false,
  clientName,
  preparedDateLong,
  preparedDate,
  contact = PDF_FRAME_CONTACT,
} = {}) {
  let box = null;
  let container = null;
  let y = 0;
  let pageOpen = false;

  function finishPage() {
    if (pageOpen && box) {
      drawFrameFooter(doc, box, contact);
      pageOpen = false;
    }
  }

  function startPage({ pageTitle } = {}) {
    finishPage();
    box = addFramePage(doc);
    y = drawFrameHeader(doc, box, {
      personalized,
      clientName,
      preparedDateLong,
      preparedDate,
    });
    if (pageTitle) {
      y = drawFramePageTitle(doc, pageTitle, box.x, y, box.width);
    }
    container = frameContentContainer(box, y);
    y = container.top;
    pageOpen = true;
    return container;
  }

  function ensureSpace(blockHeight) {
    if (!pageOpen) {
      startPage();
    }
    if (y + blockHeight > container.bottom) {
      startPage();
    }
  }

  return {
    startPage,
    finishPage,
    close() {
      finishPage();
    },
    ensureSpace,
    get y() {
      return y;
    },
    set y(nextY) {
      y = nextY;
    },
    get container() {
      return container;
    },
    get box() {
      return box;
    },
    fits(blockHeight) {
      return y + blockHeight <= container.bottom;
    },
  };
}
