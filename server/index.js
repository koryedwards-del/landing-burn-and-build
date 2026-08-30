import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import {
  deleteContact,
  enrollContactFromProgramCreation,
  getContact,
  listContacts,
  resolveProgramLoad,
  upsertContact,
} from './contacts.js';
import { countPrograms, dbPathForHealth, getLatestPaidProgramMeta, getLatestProgram, getLatestProgramMeta, getProgramById, isProgramPaid, markProgramPaid, normalizeEmail, revokeProgramAccess, saveProgram, wasDietEmailSent } from './db.js';
import { validateProgramPackage } from '../js/programPackageData.js';
import {
  constructStripeWebhookEvent,
  createCheckoutSession,
  handleStripeWebhookEvent,
  stripeConfigured,
  verifyCheckoutSession,
} from './stripe.js';
import { ensureDietPdf, fulfillDietDelivery, scheduleDietEmailRetries } from './dietFulfillment.js';
import { dietEmailConfigured } from './dietEmail.js';
import { dietPdfFilename } from './dietPdfStorage.js';
import { resolveSamplePdfPath } from './samplePdfDownloads.js';
import {
  publicSampleDietFilename,
  readPublicSampleDietConfig,
  renderPublicSampleDietPdf,
  writePublicSampleDietConfig,
} from './publicSampleDiet.js';
import { renderHandbookFaqPrintout } from './pdf/renderHandbookFaqPrintout.js';
import { buildHandbookFaqPayload } from '../js/handbookFaqPrintoutData.js';
import {
  BURN_AND_BUILD_FAQ_API_SLUG,
  BURN_AND_BUILD_FAQ_DOWNLOAD_FILENAME,
} from '../js/faqPdfNamingHelpers.js';

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
    publicSampleDiet: Boolean(resolveSamplePdfPath(root, 'sample-diet') || readPublicSampleDietConfig()),
    commit: process.env.RENDER_GIT_COMMIT || null,
  });
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

app.get('/api/contacts', requireContactsAdmin, (_req, res) => {
  res.json({ ok: true, contacts: listContacts() });
});

app.put('/api/contacts', requireContactsAdmin, (req, res) => {
  const email = normalizeEmail(req.body?.email);
  if (!isValidEmail(email)) {
    res.status(400).json({ ok: false, message: 'Enter a valid email address.' });
    return;
  }

  const contact = upsertContact({
    email,
    displayName: String(req.body?.displayName || '').trim(),
  });
  res.json({ ok: true, contact });
});

app.patch('/api/contacts', requireContactsAdmin, (req, res) => {
  const email = normalizeEmail(req.body?.email);
  if (!isValidEmail(email)) {
    res.status(400).json({ ok: false, message: 'Enter a valid email address.' });
    return;
  }

  const revokedPrograms = revokeProgramAccess(email);
  res.json({ ok: true, contact: getContact(email), revokedPrograms });
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

app.get('/api/admin/public-sample-diet', requireContactsAdmin, (_req, res) => {
  const config = readPublicSampleDietConfig();
  res.json({
    ok: true,
    configured: Boolean(config),
    config: config ? { email: config.email, programId: config.programId, updatedAt: config.updatedAt } : null,
    downloadUrl: '/api/samples/sample-diet',
  });
});

app.post('/api/admin/public-sample-diet', requireContactsAdmin, (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const programId = String(req.body?.programId || req.body?.program_id || '').trim();
  if (!isValidEmail(email)) {
    res.status(400).json({ ok: false, message: 'Enter a valid email address.' });
    return;
  }
  if (!programId) {
    res.status(400).json({ ok: false, message: 'programId is required.' });
    return;
  }
  const pkg = getProgramById(email, programId);
  if (!pkg) {
    res.status(404).json({ ok: false, message: 'Program not found for that email and program id.' });
    return;
  }

  try {
    const config = writePublicSampleDietConfig({ email, programId });
    res.json({
      ok: true,
      config,
      downloadUrl: '/api/samples/sample-diet',
      preferredName: pkg?.intake?.preferredName || null,
    });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message || 'Could not save public sample diet config.' });
  }
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

app.get('/api/programs/resume-checkout', (req, res) => {
  const email = normalizeEmail(req.query.email);
  if (!isValidEmail(email)) {
    res.status(400).json({ ok: false, message: 'Enter a valid email address.' });
    return;
  }

  const paidMeta = getLatestPaidProgramMeta(email);
  const latestMeta = getLatestProgramMeta(email);
  const meta = latestMeta || paidMeta;
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

app.get('/api/samples/:slug', async (req, res) => {
  const slug = String(req.params.slug || '').trim();

  if (slug === 'sample-diet') {
    const resolved = resolveSamplePdfPath(root, slug);
    const inline = req.query.inline === '1' || req.query.disposition === 'inline';
    if (resolved) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `${inline ? 'inline' : 'attachment'}; filename="${resolved.spec.filename}"`,
      );
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.sendFile(resolved.filePath);
      return;
    }

    try {
      const pdf = await renderPublicSampleDietPdf();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `${inline ? 'inline' : 'attachment'}; filename="${publicSampleDietFilename()}"`,
      );
      res.setHeader('Cache-Control', 'public, max-age=60');
      res.send(pdf);
    } catch (err) {
      console.error('Public sample diet error:', err.message);
      res.status(err.message.includes('not configured') ? 503 : 500).json({
        ok: false,
        message: err.message || 'Could not render the sample diet PDF.',
      });
    }
    return;
  }

  if (slug === BURN_AND_BUILD_FAQ_API_SLUG) {
    const resolved = resolveSamplePdfPath(root, slug);
    const inline = req.query.inline === '1' || req.query.disposition === 'inline';
    if (resolved) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `${inline ? 'inline' : 'attachment'}; filename="${resolved.spec.filename}"`,
      );
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.sendFile(resolved.filePath);
      return;
    }

    try {
      const pdf = await renderHandbookFaqPrintout(buildHandbookFaqPayload());
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `${inline ? 'inline' : 'attachment'}; filename="${BURN_AND_BUILD_FAQ_DOWNLOAD_FILENAME}"`,
      );
      res.setHeader('Cache-Control', 'public, max-age=60');
      res.send(pdf);
    } catch (err) {
      console.error('Burn & Build FAQ PDF error:', err.message);
      res.status(500).json({
        ok: false,
        message: err.message || 'Could not render the Burn & Build FAQ PDF.',
      });
    }
    return;
  }

  const resolved = resolveSamplePdfPath(root, slug);
  if (!resolved) {
    res.status(404).json({ ok: false, message: 'Sample file not found.' });
    return;
  }
  const { spec, filePath } = resolved;
  const inline = req.query.inline === '1' || req.query.disposition === 'inline';
  const contentType = spec.contentType || 'application/pdf';
  res.setHeader('Content-Type', contentType);
  res.setHeader(
    'Content-Disposition',
    `${inline ? 'inline' : 'attachment'}; filename="${spec.filename}"`,
  );
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.sendFile(filePath);
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
    const pdf = await ensureDietPdf(email, programId);
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
    const latestMeta = getLatestProgramMeta(email);
    const paidMeta = getLatestPaidProgramMeta(email);
    programId = latestMeta?.id || paidMeta?.id || '';
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
