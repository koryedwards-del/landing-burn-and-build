function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const TAB_STYLES = `
  body {
    margin: 0;
    min-height: 100vh;
    display: grid;
    place-items: center;
    font-family: "Open Sans", system-ui, sans-serif;
    background: #f5f5f5;
    color: #333;
  }
  main {
    text-align: center;
    padding: 2rem;
    max-width: 24rem;
  }
  h1 {
    font-family: Oswald, system-ui, sans-serif;
    font-size: 1rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin: 0 0 0.75rem;
  }
  p { margin: 0; line-height: 1.5; font-size: 0.95rem; }
  .error { color: #b71c1c; }
`;

function writeTabDocument(printWin, { title, heading, body, error = false }) {
  if (!printWin || printWin.closed) return;

  printWin.document.open();
  const safeTitle = escapeHtml(title);
  const safeHeading = escapeHtml(heading);
  const safeBody = escapeHtml(body);

  printWin.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${safeTitle}</title>
<style>${TAB_STYLES}</style>
</head>
<body>
<main>
  <h1>${safeHeading}</h1>
  <p class="${error ? 'error' : ''}">${safeBody}</p>
</main>
</body>
</html>`);
  printWin.document.close();
}

/** Must run synchronously inside the Print Shop button click handler. */
export function openPrintTab(title) {
  const printWin = window.open('about:blank', '_blank');
  if (!printWin || printWin.closed) {
    return null;
  }

  writeTabDocument(printWin, {
    title: title || 'Print Shop',
    heading: 'Print Shop',
    body: 'Preparing PDF…',
  });

  return printWin;
}

export function showPrintTabError(printWin, message) {
  writeTabDocument(printWin, {
    title: 'Print Shop',
    heading: 'Could not open PDF',
    body: message,
    error: true,
  });
}

export function deliverPrintPdfToTab(printWin, blob) {
  const url = URL.createObjectURL(blob);

  const runPrint = () => {
    try {
      printWin.focus();
      printWin.print();
    } catch (_) {
      /* user can print from the PDF tab */
    }
  };

  printWin.location.replace(url);
  printWin.addEventListener('load', runPrint, { once: true });
  setTimeout(runPrint, 800);
  setTimeout(() => URL.revokeObjectURL(url), 120_000);
}
