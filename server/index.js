import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import {
  deleteContact,
  enrollContactFromProgramCreation,
  getContact,
  listContacts,
  programSavedForEmail,
  resolveProgramLoad,
  setBurnAndBuild,
  upsertContact,
} from './contacts.js';
import { countPrograms, dbPathForHealth, deleteProgram, getLatestPaidProgramMeta, getLatestProgram, getLatestProgramMeta, getProgramById, isProgramPaid, listPaidPrograms, markProgramPaid, normalizeEmail, saveProgram, wasDietEmailSent } from './db.js';
import { validateProgramPackage } from '../js/programPackage.js';
import {
  constructStripeWebhookEvent,
  createCheckoutSession,
  handleStripeWebhookEvent,
  stripeConfigured,
  verifyCheckoutSession,
} from './stripe.js';
import {
  isPersonalizedPdfView,
  renderPrintPdf,
  sendPrintPdfError,
  sendPrintPdfResponse,
  validatePrintView,
} from './pdf/index.js';
import { renderProgramReportKwarnerLockedPreview } from './pdf/renderProgramReportKwarnerLockedPreview.js';
import { buildKristiKwarnerPreviewPayload } from '../js/kwarnerLockedPreviewFixtures.js';
import { ensureDietPdf, fulfillDietDelivery, scheduleDietEmailRetries } from './dietFulfillment.js';
import { dietEmailConfigured } from './dietEmail.js';
import { dietPdfFilename } from './dietPdfStorage.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const app = express();
const port = Number(process.env.PORT) || 3001;
const isProd = process.env.NODE_ENV === 'production';

const defaultCorsOrigins = [
  'https://burnandbuilddiet.com',
  'https://www.burnandbuilddiet.com',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
];

function corsOrigins() {
  const extra = String(process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return new Set([...defaultCorsOrigins, ...extra]);
}

const blockedPrefixes = [
  '/server',
  '/.env',
  '/.git',
  '/node_modules',
  '/package.json',
  '/package-lock.json',
  '/render.yaml',
];

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use((req, res, next) => {
  const origin = req.get('origin');
  if (origin && corsOrigins().has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Contacts-Admin-Key');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
  }
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use((req, res, next) => {
  if (blockedPrefixes.some((prefix) => req.path === prefix || req.path.startsWith(`${prefix}/`))) {
    res.sendStatus(404);
    return;
  }
  next();
});

app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    const signature = req.get('stripe-signature');
    if (!signature) {
      res.status(400).json({ ok: false, message: 'Missing Stripe signature.' });
      return;
    }
    const event = constructStripeWebhookEvent(req.body, signature);
    const result = handleStripeWebhookEvent(event);
    if (!result.ok && !result.ignored) {
      console.error('Stripe webhook fulfillment failed:', result.message);
      res.status(500).json({ ok: false, message: result.message || 'Fulfillment failed.' });
      return;
    }
    if (result.ok && result.email && result.programId) {
      fulfillPaidProgram(result.email, result.programId).catch((err) => {
        console.error('Stripe webhook diet fulfillment:', err.message);
      });
    }
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('Stripe webhook error:', err.message);
    res.status(400).json({ ok: false, message: err.message || 'Webhook error.' });
  }
});

app.use(express.json({ limit: '512kb' }));

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

async function fulfillPaidProgram(email, programId) {
  if (!email || !programId) return { pdfReady: false };
  try {
    const result = await fulfillDietDelivery(email, programId);
    if (!result.emailSent && !result.emailAlreadySent && dietEmailConfigured()) {
      scheduleDietEmailRetries(email, programId);
    }
    return result;
  } catch (err) {
    console.error('Diet fulfillment error:', err.message);
    if (dietEmailConfigured()) {
      scheduleDietEmailRetries(email, programId);
    }
    return { pdfReady: false, error: err.message };
  }
}

function requireContactsAdmin(req, res, next) {
  const configured = process.env.CONTACTS_ADMIN_KEY;
  if (!configured) {
    if (isProd) {
      res.status(503).json({ ok: false, message: 'Admin API is not configured.' });
      return;
    }
    next();
    return;
  }
  const key = req.get('x-contacts-admin-key');
  if (key !== configured) {
    res.status(401).json({ ok: false, message: 'Admin key required.' });
    return;
  }
  next();
}

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    project: 'Burn & Build',
    service: 'program-creator',
    env: isProd ? 'production' : 'development',
    database: dbPathForHealth(),
    stripe: stripeConfigured(),
    dietEmail: dietEmailConfigured(),
    pdf: true,
    commit: process.env.RENDER_GIT_COMMIT || null,
  });
});

async function handlePrintPdfRequest(req, res, { view, title, payload }) {
  try {
    validatePrintView(view);
    const pdf = await renderPrintPdf(view, {
      title: title || undefined,
      payload,
    });
    sendPrintPdfResponse(res, view, pdf, title);
  } catch (err) {
    sendPrintPdfError(res, err);
  }
}

app.get('/api/print/pdf', async (req, res) => {
  const view = String(req.query.view || '').trim();
  const title = String(req.query.title || '').trim();
  await handlePrintPdfRequest(req, res, { view, title });
});

app.post('/api/print/pdf', async (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const view = String(body.view || req.query.view || '').trim();
  const title = String(body.title || req.query.title || '').trim();
  if (!isPersonalizedPdfView(view)) {
    res.status(400).json({
      ok: false,
      message: 'POST print PDF requires a personalized view (week, shopping, or programreport).',
    });
    return;
  }
  await handlePrintPdfRequest(req, res, { view, title, payload: body });
});

async function sendBurnAndBuildDietSamplePdf(res) {
  const payload = buildKristiKwarnerPreviewPayload();
  const pdf = await renderProgramReportKwarnerLockedPreview(payload);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="burn-and-build-diet-sample.pdf"');
  res.setHeader('Cache-Control', 'no-store');
  res.send(pdf);
}

app.get('/api/preview/burn-and-build-diet-pdf', async (_req, res) => {
  try {
    await sendBurnAndBuildDietSamplePdf(res);
  } catch (err) {
    console.error('Burn & Build Diet sample PDF error:', err);
    res.status(500).json({ ok: false, message: err.message || 'Sample PDF failed.' });
  }
});

/** @deprecated Use /api/preview/burn-and-build-diet-pdf */
app.get('/api/preview/kwarner-locked-pdf', async (_req, res) => {
  try {
    await sendBurnAndBuildDietSamplePdf(res);
  } catch (err) {
    console.error('Burn & Build Diet sample PDF error:', err);
    res.status(500).json({ ok: false, message: err.message || 'Sample PDF failed.' });
  }
});

function creatorBaseUrl(req) {
  return process.env.CREATOR_BASE_URL || `${req.protocol}://${req.get('host')}`;
}

app.get('/api/checkout/status', (_req, res) => {
  res.json({
    ok: true,
    configured: stripeConfigured(),
    dietEmail: dietEmailConfigured(),
    testBypass: !isProd || process.env.STRIPE_TEST_BYPASS === '1',
  });
});

app.post('/api/checkout', async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  if (!isValidEmail(email)) {
    res.status(400).json({ ok: false, message: 'Enter a valid email address.' });
    return;
  }
  if (!stripeConfigured()) {
    res.status(503).json({ ok: false, message: 'Checkout is not configured yet.' });
    return;
  }

  try {
    const session = await createCheckoutSession({
      email,
      programId: req.body?.programId,
      baseUrl: creatorBaseUrl(req),
    });
    res.json({ ok: true, ...session });
  } catch (err) {
    console.error('Checkout session error:', err.message);
    res.status(500).json({ ok: false, message: err.message || 'Could not start checkout.' });
  }
});

app.get('/api/checkout/verify', async (req, res) => {
  const sessionId = String(req.query.session_id || '');
  if (!sessionId) {
    res.status(400).json({ ok: false, message: 'Missing checkout session.' });
    return;
  }
  if (!stripeConfigured()) {
    res.status(503).json({ ok: false, message: 'Checkout is not configured yet.' });
    return;
  }

  try {
    const result = await verifyCheckoutSession(sessionId);
    if (result.ok && result.email && result.programId) {
      const fulfillment = await fulfillPaidProgram(result.email, result.programId);
      Object.assign(result, fulfillment);
    }
    res.json(result);
  } catch (err) {
    console.error('Checkout verify error:', err.message);
    res.status(500).json({ ok: false, message: err.message || 'Could not verify payment.' });
  }
});

app.post('/api/checkout/test-complete', async (req, res) => {
  if (isProd && process.env.STRIPE_TEST_BYPASS !== '1') {
    res.status(404).json({ ok: false, message: 'Not found.' });
    return;
  }
  const email = normalizeEmail(req.body?.email);
  const programId = String(req.body?.programId || '').trim();
  if (!isValidEmail(email)) {
    res.status(400).json({ ok: false, message: 'Enter a valid email address.' });
    return;
  }
  if (!programId) {
    res.status(400).json({ ok: false, message: 'Missing program id.' });
    return;
  }
  const paid = markProgramPaid(email, programId);
  if (!paid) {
    res.status(404).json({ ok: false, message: 'Program not found for this email.' });
    return;
  }
  try {
    const fulfillment = await fulfillPaidProgram(email, programId);
    res.json({ ok: true, email, programId, paid: true, test: true, ...fulfillment });
  } catch (err) {
    console.error('Test checkout diet fulfillment:', err.message);
    res.json({ ok: true, email, programId, paid: true, test: true, pdfReady: false, error: err.message });
  }
});

app.get('/api/contacts/lookup', (req, res) => {
  const email = normalizeEmail(req.query.email);
  if (!isValidEmail(email)) {
    res.status(400).json({ ok: false, message: 'Enter a valid email address.' });
    return;
  }

  const contact = getContact(email);
  if (!contact) {
    res.status(404).json({ ok: false, message: 'This email is not in the contact list yet.' });
    return;
  }

  res.json({ ok: true, contact });
});

app.get('/api/contacts', requireContactsAdmin, (_req, res) => {
  res.json({ ok: true, contacts: listContacts() });
});

app.put('/api/contacts', requireContactsAdmin, (req, res) => {
  const email = normalizeEmail(req.body?.email);
  if (!isValidEmail(email)) {
    res.status(400).json({ ok: false, message: 'Enter a valid email address.' });
    return;
  }

  if (req.body?.burnAndBuild) {
    res.status(403).json({
      ok: false,
      message: 'Access is granted through Stripe checkout only. Create a coupon in Stripe for complimentary access.',
    });
    return;
  }

  const contact = upsertContact({
    email,
    displayName: String(req.body?.displayName || '').trim(),
    burnAndBuild: false,
  });
  res.json({ ok: true, contact });
});

app.patch('/api/contacts', requireContactsAdmin, (req, res) => {
  const email = normalizeEmail(req.body?.email);
  if (!isValidEmail(email)) {
    res.status(400).json({ ok: false, message: 'Enter a valid email address.' });
    return;
  }

  if (typeof req.body?.burnAndBuild !== 'boolean') {
    res.status(400).json({ ok: false, message: 'burnAndBuild must be true or false.' });
    return;
  }

  if (req.body.burnAndBuild) {
    res.status(403).json({
      ok: false,
      message: 'Access is granted through Stripe checkout only. Create a coupon in Stripe for complimentary access.',
    });
    return;
  }

  const contact = setBurnAndBuild(email, false);
  res.json({ ok: true, contact });
});

app.delete('/api/contacts', requireContactsAdmin, (req, res) => {
  const email = normalizeEmail(req.body?.email);
  if (!isValidEmail(email)) {
    res.status(400).json({ ok: false, message: 'Enter a valid email address.' });
    return;
  }

  if (!deleteContact(email)) {
    res.status(404).json({ ok: false, message: 'Contact not found.' });
    return;
  }

  res.json({ ok: true, email });
});

app.post('/api/programs', (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const pkg = req.body?.package;

  if (!isValidEmail(email)) {
    res.status(400).json({ ok: false, message: 'Enter a valid email address.' });
    return;
  }

  const validation = validateProgramPackage(pkg);
  if (!validation.ok) {
    res.status(400).json({ ok: false, message: validation.errors.join(' ') });
    return;
  }

  const intakeEmail = normalizeEmail(pkg?.intake?.email);
  if (intakeEmail && intakeEmail !== email) {
    res.status(400).json({ ok: false, message: 'Email in the diet does not match the save request.' });
    return;
  }

  try {
    const programId = saveProgram(email, pkg);
    const contact = enrollContactFromProgramCreation(email, pkg?.intake?.preferredName);
    res.json({ ok: true, email, programId, programCount: countPrograms(email), contact });
  } catch (err) {
    res.status(403).json({ ok: false, message: err.message || 'Could not save your program.' });
  }
});

app.get('/api/programs/saved', (req, res) => {
  const email = normalizeEmail(req.query.email);
  if (!isValidEmail(email)) {
    res.status(400).json({ ok: false, message: 'Enter a valid email address.' });
    return;
  }

  const saved = programSavedForEmail(email);
  res.json({
    ok: true,
    email,
    saved: saved.saved,
    programId: saved.programId || null,
    programCount: saved.programCount,
    programPaid: !!saved.programPaid,
  });
});

app.get('/api/programs/resume-checkout', (req, res) => {
  const email = normalizeEmail(req.query.email);
  if (!isValidEmail(email)) {
    res.status(400).json({ ok: false, message: 'Enter a valid email address.' });
    return;
  }

  const paidMeta = getLatestPaidProgramMeta(email);
  const meta = paidMeta || getLatestProgramMeta(email);
  if (!meta) {
    res.status(404).json({ ok: false, message: 'No program saved for this email.' });
    return;
  }

  const pkg = getProgramById(email, meta.id) || getLatestProgram(email);
  if (!pkg) {
    res.status(404).json({ ok: false, message: 'No program saved for this email.' });
    return;
  }

  res.json({
    ok: true,
    email,
    programId: meta.id,
    programPaid: isProgramPaid(email, meta.id),
    package: pkg,
  });
});

app.get('/api/programs/payment-status', (req, res) => {
  const email = normalizeEmail(req.query.email);
  const programId = String(req.query.programId || '').trim();
  if (!isValidEmail(email)) {
    res.status(400).json({ ok: false, message: 'Enter a valid email address.' });
    return;
  }
  if (!programId) {
    res.status(400).json({ ok: false, message: 'Missing program id.' });
    return;
  }
  res.json({
    ok: true,
    email,
    programId,
    paid: isProgramPaid(email, programId),
    dietEmailSent: wasDietEmailSent(email, programId),
  });
});

app.get('/api/programs/diet-pdf', async (req, res) => {
  const email = normalizeEmail(req.query.email);
  const programId = String(req.query.program_id || req.query.programId || '').trim();
  if (!isValidEmail(email)) {
    res.status(400).json({ ok: false, message: 'Enter a valid email address.' });
    return;
  }
  if (!programId) {
    res.status(400).json({ ok: false, message: 'Missing program id.' });
    return;
  }
  if (!isProgramPaid(email, programId)) {
    res.status(403).json({ ok: false, message: 'Purchase required to download this diet.' });
    return;
  }

  try {
    const forceRegenerate = String(req.query.regenerate || '') === '1';
    const pdf = await ensureDietPdf(email, programId, { forceRegenerate });
    const pkg = getProgramById(email, programId);
    const filename = dietPdfFilename({ preferredName: pkg?.intake?.preferredName, pkg });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-store');
    res.send(pdf);
  } catch (err) {
    console.error('Diet PDF download error:', err.message);
    res.status(500).json({ ok: false, message: err.message || 'Could not prepare your Burn & Build Diet PDF.' });
  }
});

app.post('/api/programs/resend-diet-email', async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  let programId = String(req.body?.programId || req.body?.program_id || '').trim();
  if (!isValidEmail(email)) {
    res.status(400).json({ ok: false, message: 'Enter a valid email address.' });
    return;
  }
  if (!programId) {
    const meta = getLatestPaidProgramMeta(email);
    programId = meta?.id || '';
  }
  if (!programId) {
    res.status(404).json({ ok: false, message: 'No purchased program found for this email.' });
    return;
  }
  if (!isProgramPaid(email, programId)) {
    res.status(403).json({ ok: false, message: 'Purchase required to resend this diet.' });
    return;
  }

  try {
    const forceEmail = req.body?.force === true;
    const result = await fulfillDietDelivery(email, programId, { forceEmail });
    if (!result.emailSent && result.emailAlreadySent && !forceEmail) {
      res.json({
        ok: true,
        email,
        programId,
        emailSent: false,
        emailAlreadySent: true,
        emailSkipped: result.emailSkipped,
      });
      return;
    }
    if (!result.emailSent) {
      const message = result.emailError || 'Email could not be sent.';
      const status = result.emailSkipped ? 503 : 500;
      res.status(status).json({
        ok: false,
        message,
        emailAlreadySent: !!result.emailAlreadySent,
      });
      return;
    }
    res.json({
      ok: true,
      email,
      programId,
      emailSent: result.emailSent,
      emailAlreadySent: result.emailAlreadySent,
      emailSkipped: result.emailSkipped,
    });
  } catch (err) {
    console.error('Resend diet email error:', err.message);
    res.status(500).json({ ok: false, message: err.message || 'Could not resend your diet email.' });
  }
});

app.get('/api/programs', (req, res) => {
  const email = normalizeEmail(req.query.email);
  if (!isValidEmail(email)) {
    res.status(400).json({ ok: false, message: 'Enter a valid email address.' });
    return;
  }

  const result = resolveProgramLoad(email, { getLatestProgram, countPrograms });
  if (!result.ok) {
    res.status(result.status).json({
      ok: false,
      message: result.message,
      ...(result.saved ? {
        saved: true,
        programCount: result.programCount,
        programId: result.programId || null,
      } : {}),
    });
    return;
  }

  res.json({
    ok: true,
    email,
    package: result.package,
    programCount: result.programCount,
  });
});

app.get('/api/programs/history', (req, res) => {
  const email = normalizeEmail(req.query.email);
  if (!isValidEmail(email)) {
    res.status(400).json({ ok: false, message: 'Enter a valid email address.' });
    return;
  }

  const rows = listPaidPrograms(email);
  const programs = rows.map((row) => ({
    id: row.id,
    label: row.label,
    createdAt: row.createdAt,
    paid: true,
    paidAt: row.paidAt,
    package: row.package,
  }));

  res.json({ ok: true, email, programs });
});

app.get('/api/programs/:id', (req, res) => {
  const email = normalizeEmail(req.query.email);
  const { id } = req.params;

  if (!isValidEmail(email)) {
    res.status(400).json({ ok: false, message: 'Enter a valid email address.' });
    return;
  }

  const accessResult = resolveProgramLoad(email, { getLatestProgram, countPrograms });
  if (!accessResult.ok && accessResult.status !== 403) {
    res.status(accessResult.status).json({
      ok: false,
      message: accessResult.message,
      ...(accessResult.saved ? { saved: true, programCount: accessResult.programCount } : {}),
    });
    return;
  }

  if (!isProgramPaid(email, id)) {
    res.status(403).json({
      ok: false,
      message: 'Complete Stripe checkout to unlock this program.',
      saved: true,
      programId: id,
    });
    return;
  }

  const pkg = getProgramById(email, id);
  if (!pkg) {
    res.status(404).json({ ok: false, message: 'Diet not found.' });
    return;
  }

  res.json({ ok: true, email, package: pkg });
});

app.delete('/api/programs/:id', (req, res) => {
  const email = normalizeEmail(req.query.email);
  const { id } = req.params;

  if (!isValidEmail(email)) {
    res.status(400).json({ ok: false, message: 'Enter a valid email address.' });
    return;
  }

  const accessResult = resolveProgramLoad(email, { getLatestProgram, countPrograms });
  if (!accessResult.ok) {
    res.status(accessResult.status).json({
      ok: false,
      message: accessResult.message,
      ...(accessResult.saved ? { saved: true, programCount: accessResult.programCount } : {}),
    });
    return;
  }

  if (!deleteProgram(email, id)) {
    res.status(404).json({ ok: false, message: 'Diet not found.' });
    return;
  }

  res.json({ ok: true, email, programId: id, programCount: countPrograms(email) });
});

/** Public config for client — never put secrets here. */
app.get('/config.js', (_req, res) => {
  res.type('application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.send(`window.BNB_CONFIG=${JSON.stringify({
    apiBaseUrl: process.env.API_BASE_URL || '',
    creatorBaseUrl: process.env.CREATOR_BASE_URL || '',
    webpageUrl: process.env.WEBPAGE_URL || '',
  })};`);
});

app.get('/api/config', (_req, res) => {
  res.json({
    ok: true,
    apiBaseUrl: process.env.API_BASE_URL || '',
    creatorBaseUrl: process.env.CREATOR_BASE_URL || '',
    webpageUrl: process.env.WEBPAGE_URL || '',
    stripe: stripeConfigured(),
  });
});

app.get('/', (_req, res) => {
  res.redirect('/createyourfoodplan/');
});

app.use((req, res, next) => {
  const isHtml = req.path.endsWith('.html') || req.path.endsWith('/');
  const isAsset = /\.(css|js|mjs)$/i.test(req.path);
  if (isHtml) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  } else if (isAsset) {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  }
  next();
});

app.use(express.static(root, {
  dotfiles: 'deny',
  index: ['index.html'],
}));

app.listen(port, () => {
  console.log(`Program creator listening on port ${port}`);
});
