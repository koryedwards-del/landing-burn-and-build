const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  const out = path.join(__dirname, '..', 'img/brand/burn-and-build-card-from-html.png');
  const url = 'http://127.0.0.1:8766/business-card-mockup.html';

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome-stable',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1500, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() =>
    Promise.all([...document.images].map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    })),
  );
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: out, type: 'png' });
  await browser.close();
  console.log('Wrote', out);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
