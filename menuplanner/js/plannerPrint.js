import { isPrintShopView } from '../../js/printShopViews.js';
import { assertPrintShopView, printDocumentTitle } from './printShopConfig.js';
import { loadPrintPdfBlob } from './printShopClient.js';
import {
  deliverPrintPdfToTab,
  openPrintTab,
  showPrintTabError,
} from './printShopDelivery.js';
import { persistPlannerToProgram, state } from './plannerState.js';

async function printPlannerDocument(view, printWin) {
  assertPrintShopView(view);
  persistPlannerToProgram({ immediate: true });

  const docTitle = printDocumentTitle(view, state.programPackage);

  if (!printWin || printWin.closed) {
    window.alert('Could not open a new tab. Allow new tabs for this site and try again.');
    return;
  }

  try {
    const blob = await loadPrintPdfBlob(view, docTitle);
    if (printWin.closed) {
      window.alert('The print tab was closed before the PDF finished loading.');
      return;
    }
    deliverPrintPdfToTab(printWin, blob);
  } catch (err) {
    if (!printWin.closed) {
      showPrintTabError(printWin, err.message || 'Could not open PDF.');
      return;
    }
    window.alert(err.message || 'Could not open PDF.');
  }
}

function initPrintChoiceDialog() {
  const dialog = document.getElementById('print-choice-dialog');
  if (!dialog || dialog.dataset.printChoiceInit) return;
  dialog.dataset.printChoiceInit = '1';

  dialog.querySelector('#print-choice-cancel')?.addEventListener('click', () => {
    dialog.close();
  });

  dialog.querySelectorAll('[data-print-view]').forEach((button) => {
    button.addEventListener('click', () => {
      const view = button.dataset.printView;
      if (!isPrintShopView(view)) return;

      const printWin = openPrintTab(printDocumentTitle(view, state.programPackage));
      dialog.close();
      void printPlannerDocument(view, printWin);
    });
  });
}

function openPrintShop() {
  const dialog = document.getElementById('print-choice-dialog');
  if (dialog) {
    dialog.showModal();
    return;
  }
  void printPlannerDocument('week', openPrintTab(printDocumentTitle('week', state.programPackage)));
}

function initPrintShop() {
  document.getElementById('print-shop-open')?.addEventListener('click', openPrintShop);
  initPrintChoiceDialog();
}

export {
  printPlannerDocument,
  initPrintChoiceDialog,
  openPrintShop,
  initPrintShop,
};
