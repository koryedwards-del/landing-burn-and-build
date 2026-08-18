/** Checkout paywall — questionnaire builds the program; Stripe unlocks PDF delivery. */

import { getAppEmail, persistAppEmail, saveProgramToServer, isValidEmail, fetchProgramFromServer, fetchProgramPaymentStatus, fetchProgramByIdFromServer } from './programApi.js';
import { persistProgramBridge, loadProgramBridge } from './programBridgeHandoff.js';
import {
  completeCheckoutForTest,
  createCheckoutSession,
  fetchCheckoutStatus,
  verifyCheckoutSession,
} from './checkoutApi.js';
import { downloadDietPdfWithRetry, resendDietEmail } from './dietDeliveryApi.js';
import { QUESTIONNAIRE_WELCOME_URL, isDietCreationGated } from './siteUrls.js';

const PAID_PROGRAM_ID_KEY = 'bnb_paid_program_id';

const store = {
  builtPackage: null,
  email: '',
  saveError: '',
  programPaid: false,
  apiReachable: true,
  stripeConfigured: false,
  checkoutTestBypass: false,
  checkoutError: '',
  checkoutMessage: '',
  checkoutBusy: false,
  checkoutVerified: false,
  paidProgramId: '',
  saveBusy: false,
  dietPreparing: false,
  dietDownloadBusy: false,
  dietDownloaded: false,
  dietEmailSent: false,
  dietEmailBusy: false,
  dietEmailAvailable: true,
  dietEmailError: '',
  dietFulfillmentError: '',
};

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function persistPaidProgramId(programId) {
  const id = String(programId || '').trim();
  store.paidProgramId = id;
  if (id) {
    sessionStorage.setItem(PAID_PROGRAM_ID_KEY, id);
  }
}

function restorePaidProgramId() {
  const stored = sessionStorage.getItem(PAID_PROGRAM_ID_KEY);
  if (stored) {
    store.paidProgramId = stored;
  }
}

function restoreBuiltPackage() {
  if (store.builtPackage) return;
  store.builtPackage = loadProgramBridge();
  const raw = sessionStorage.getItem('bnb_built_package');
  if (!store.builtPackage && raw) {
    try {
      store.builtPackage = JSON.parse(raw);
    } catch {
      sessionStorage.removeItem('bnb_built_package');
    }
  }
}

function renderComingSoon() {
  document.getElementById('app').innerHTML = `
    <div class="start-site">
      <div class="screen unlock-screen">
        <div class="start-success">
          <div class="ob-welcome-line1">COMING</div>
          <div class="ob-welcome-line2">SOON</div>
        </div>
        <div class="unlock-panel">
          <p class="unlock-lead">New Burn &amp; Build programs are not open yet. We&rsquo;re finishing the launch so no one starts a diet that isn&rsquo;t ready.</p>
          <p class="unlock-hint">Already purchased? <a href="/get-your-diet/">Download your diet PDF</a></p>
          <p class="unlock-hint"><a href="/">← Back to website</a></p>
        </div>
      </div>
    </div>`;
}

function redirectToQuestionnaire() {
  window.location.replace(QUESTIONNAIRE_WELCOME_URL);
}

async function restoreBuiltPackageFromServer(email, { force = false, programId } = {}) {
  if (force && programId) {
    return syncProgramAfterPayment({ email, programId });
  }
  if (store.builtPackage && !force) return true;
  if (!isValidEmail(email)) return false;
  const result = await fetchProgramFromServer(email);
  if (!result.ok || !result.package) return false;
  store.builtPackage = result.package;
  if (store.builtPackage?.program?.id) {
    persistPaidProgramId(store.builtPackage.program.id);
  }
  persistProgramBridge(store.builtPackage);
  return true;
}

async function syncProgramAfterPayment({ email, programId } = {}) {
  const resolvedEmail = isValidEmail(email) ? email : ensurePlanReadyEmail();
  const resolvedProgramId = String(programId || store.paidProgramId || '').trim();
  if (!isValidEmail(resolvedEmail) || !resolvedProgramId) return false;

  store.paidProgramId = resolvedProgramId;
  persistPaidProgramId(resolvedProgramId);
  store.programPaid = true;

  const result = await fetchProgramByIdFromServer(resolvedEmail, resolvedProgramId);
  if (result.ok && result.package) {
    store.builtPackage = result.package;
    if (store.builtPackage.program) {
      store.builtPackage.program.id = resolvedProgramId;
    }
    persistProgramBridge(store.builtPackage);
    return true;
  }

  restoreBuiltPackage();
  if (store.builtPackage?.program) {
    store.builtPackage.program.id = resolvedProgramId;
    persistProgramBridge(store.builtPackage);
    return true;
  }

  return false;
}

function ensurePlanReadyEmail() {
  restoreBuiltPackage();
  const fromStore = String(store.email || '').trim();
  if (isValidEmail(fromStore)) return fromStore;

  const fromSaved = getAppEmail();
  if (isValidEmail(fromSaved)) {
    store.email = fromSaved;
    return fromSaved;
  }

  const fromPackage = String(store.builtPackage?.intake?.email || '').trim();
  if (isValidEmail(fromPackage)) {
    store.email = persistAppEmail(fromPackage);
    return store.email;
  }

  return '';
}

function activeProgramId() {
  restoreBuiltPackage();
  return String(store.paidProgramId || store.builtPackage?.program?.id || '').trim();
}

function currentProgramId() {
  return activeProgramId();
}

async function refreshProgramPaymentStatus() {
  if (store.checkoutVerified) {
    store.programPaid = true;
    return;
  }
  const email = ensurePlanReadyEmail();
  const programId = activeProgramId();
  if (!isValidEmail(email) || !programId) {
    store.programPaid = false;
    return;
  }
  const result = await fetchProgramPaymentStatus(email, programId);
  store.programPaid = !!(result.ok && result.paid);
  if (store.programPaid) {
    persistPaidProgramId(programId);
  }
}

function renderPaidDirections() {
  const email = ensurePlanReadyEmail();
  const downloadLabel = store.dietDownloadBusy
    ? 'PREPARING YOUR PDF…'
    : store.dietDownloaded
      ? 'DOWNLOAD AGAIN'
      : 'DOWNLOAD YOUR BURN & BUILD DIET';

  const downloadDetail = store.dietDownloaded
    ? 'Check your Downloads folder.'
    : '';

  const emailStep = emailStepState(email);

  return `
          <ol class="unlock-steps" aria-label="Next steps">
            <li class="unlock-step unlock-step--done">
              <div class="unlock-step__marker" aria-hidden="true">1</div>
              <div class="unlock-step__content">
                <p class="unlock-step__title">Payment complete</p>
              </div>
            </li>
            <li class="unlock-step ${store.dietDownloaded ? 'unlock-step--done' : 'unlock-step--current'}">
              <div class="unlock-step__marker" aria-hidden="true">2</div>
              <div class="unlock-step__content">
                <p class="unlock-step__title">Download your Burn &amp; Build Diet</p>
                <button type="button" class="btn-primary unlock-cta" data-download-diet ${store.dietDownloadBusy ? 'disabled' : ''}>
                  ${downloadLabel}
                </button>
                ${downloadDetail ? `<p class="unlock-step__detail unlock-step__detail--ok">${downloadDetail}</p>` : ''}
              </div>
            </li>
            <li class="unlock-step unlock-step--${emailStep.status}">
              <div class="unlock-step__marker" aria-hidden="true">3</div>
              <div class="unlock-step__content">
                <p class="unlock-step__title">Check your email</p>
                <p class="unlock-step__detail">${emailStep.detail}</p>
              </div>
            </li>
          </ol>
          <p class="unlock-hint"><a href="/get-your-diet/">Download or resend later</a></p>
          ${store.dietFulfillmentError ? `<div class="unlock-error">${escapeHtml(store.dietFulfillmentError)}</div>` : ''}`;
}

function emailStepState(email) {
  const safeEmail = escapeHtml(email);

  if (store.dietEmailSent) {
    return {
      status: 'done',
      detail: `We emailed a copy to <strong>${safeEmail}</strong>.`,
    };
  }

  if (store.dietEmailBusy) {
    return {
      status: 'current',
      detail: `Sending a copy to <strong>${safeEmail}</strong> — no action needed.`,
    };
  }

  if (!store.dietEmailAvailable) {
    return {
      status: 'pending',
      detail: `Download your PDF above for your full diet plan. Need it by email? Visit <a href="/get-your-diet/">get-your-diet</a>.`,
    };
  }

  if (store.dietEmailError) {
    return {
      status: 'warn',
      detail: `Download your PDF above. Didn&rsquo;t get the email? Check spam or visit <a href="/get-your-diet/">get-your-diet</a>.`,
    };
  }

  return {
    status: 'current',
    detail: `A copy is being sent to <strong>${safeEmail}</strong> — no action needed.`,
  };
}

function isNonRetryableEmailError(message) {
  const msg = String(message || '').toLowerCase();
  return msg.includes('not configured') || msg.includes('diet email');
}

function renderPlanReadyAppHandoff(unlocked) {
  if (!unlocked) {
    return '<p class="unlock-tagline">Complete purchase to download your personalized diet PDF.</p>';
  }
  return renderPaidDirections();
}

function renderPlanReady() {
  restoreBuiltPackage();
  ensurePlanReadyEmail();
  const paidThisSession = store.checkoutVerified;
  const hasPaidAccess = paidThisSession || store.programPaid;
  const showPaywall = !hasPaidAccess;
  let lead;
  if (hasPaidAccess) {
    lead = '';
  } else if (store.saveError) {
    lead = 'Your diet is ready on this device. Save it to your account, then complete checkout.';
  } else {
    lead = 'Your personalized diet is saved. Complete checkout to download your Burn &amp; Build Diet PDF.';
  }

  const checkoutBlock = showPaywall
    ? !store.apiReachable ? `
          <p class="unlock-hint">Could not reach the Burn &amp; Build server. Check your connection and try again.</p>
          ${store.saveError ? `<button type="button" class="btn-secondary unlock-cta-secondary" data-retry-save ${store.saveBusy ? 'disabled' : ''}>${store.saveBusy ? 'SAVING…' : 'Retry save'}</button>` : ''}`
      : store.stripeConfigured ? `
          <button type="button" class="btn-primary unlock-cta" data-start-checkout ${store.checkoutBusy ? 'disabled' : ''}>
            ${store.checkoutBusy ? 'OPENING CHECKOUT…' : 'COMPLETE PURCHASE — $149'}
          </button>
          <p class="unlock-hint">Secure checkout · One-time $149 · Yours for life</p>
          ${store.checkoutTestBypass ? '<button type="button" class="btn-secondary unlock-cta-secondary" data-test-checkout>Skip payment (local test)</button>' : ''}`
      : `
          <p class="unlock-hint">Checkout is not available yet. Contact support@burnandbuilddiet.com if you need help.</p>
          ${store.checkoutTestBypass ? '<button type="button" class="btn-secondary unlock-cta-secondary" data-test-checkout>Skip payment (local test)</button>' : ''}`
    : '';

  const saveActions = showPaywall && store.saveError && store.apiReachable
    ? `<button type="button" class="btn-secondary unlock-cta-secondary" data-retry-save ${store.saveBusy ? 'disabled' : ''}>${store.saveBusy ? 'SAVING…' : 'Retry save'}</button>`
    : '';

  const successLines = hasPaidAccess
    ? `<div class="ob-welcome-line1">DOWNLOAD YOUR</div>
          <div class="ob-welcome-line2">BURN &amp; BUILD DIET</div>`
    : `<div class="ob-welcome-line1">YOUR DIET</div>
          <div class="ob-welcome-line2">IS READY</div>`;

  return `
    <div class="start-site">
      <div class="screen unlock-screen">
        <div class="start-success">
          <div class="check">✓</div>
          ${successLines}
        </div>
        <div class="unlock-panel">
          ${lead ? `<p class="unlock-lead">${lead}</p>` : ''}
          ${store.checkoutMessage && !hasPaidAccess ? `<div class="ob-info"><span class="ob-info-icon">ℹ️</span><p>${store.checkoutMessage}</p></div>` : ''}
          ${checkoutBlock}
          ${saveActions}
          ${renderPlanReadyAppHandoff(hasPaidAccess)}
          ${store.checkoutError ? `<div class="unlock-error">${store.checkoutError}</div>` : ''}
          ${store.saveError ? `<div class="unlock-error">${store.saveError}</div>` : ''}
          <p class="unlock-hint">${isDietCreationGated()
    ? '<a href="/">← Back to website</a>'
    : `<a href="${QUESTIONNAIRE_WELCOME_URL}">← Back to questionnaire</a>`}</p>
        </div>
      </div>
    </div>`;
}

function isTestMode() {
  return location.hostname.includes('github.io') || location.hostname === 'localhost' || location.search.includes('test=1');
}

async function refreshCheckoutConfig() {
  const status = await fetchCheckoutStatus();
  store.apiReachable = status.reachable !== false;
  store.stripeConfigured = !!status.configured;
  store.dietEmailAvailable = status.dietEmail !== false;
  store.checkoutTestBypass = isTestMode();
}

async function savePlanToServer() {
  const email = ensurePlanReadyEmail();
  if (!isValidEmail(email)) {
    store.saveError = 'Enter a valid email address.';
    return false;
  }
  restoreBuiltPackage();
  if (!store.builtPackage) {
    store.saveError = 'No diet to save.';
    return false;
  }
  store.saveBusy = true;
  store.saveError = '';
  const saved = await saveProgramToServer(email, store.builtPackage);
  store.saveBusy = false;
  if (!saved.ok) {
    store.saveError = saved.message || 'Could not save your plan.';
    return false;
  }
  if (saved.programId && store.builtPackage?.program) {
    store.builtPackage.program.id = saved.programId;
    persistProgramBridge(store.builtPackage);
  }
  persistAppEmail(email);
  store.saveError = '';
  return true;
}

function cleanCheckoutQuery() {
  const url = new URL(location.href);
  url.searchParams.delete('checkout');
  url.searchParams.delete('session_id');
  history.replaceState({}, '', `${url.pathname}${url.search}`);
}

async function triggerDietDownload() {
  const email = ensurePlanReadyEmail();
  const programId = activeProgramId();
  if (!isValidEmail(email) || !programId) {
    store.dietFulfillmentError = 'Missing email or program id for download.';
    render();
    return;
  }

  store.dietDownloadBusy = true;
  store.dietFulfillmentError = '';
  render();

  const result = await downloadDietPdfWithRetry(email, programId);
  store.dietDownloadBusy = false;
  if (!result.ok) {
    store.dietFulfillmentError = result.message;
    render();
    return;
  }

  store.dietDownloaded = true;
  store.dietFulfillmentError = '';
  render();
}

function applyFulfillmentResult(result) {
  store.dietEmailSent = !!result?.emailSent || !!result?.emailAlreadySent;
  store.dietPreparing = !result?.pdfReady;
  if (result?.emailError && isNonRetryableEmailError(result.emailError)) {
    store.dietEmailAvailable = false;
  }
  store.dietEmailError = result?.emailError && !isNonRetryableEmailError(result.emailError)
    ? result.emailError
    : '';
  store.dietFulfillmentError = result?.error || '';
}

async function ensureDietEmailDelivered({ attempts = 8, delayMs = 2000 } = {}) {
  if (store.dietEmailSent || store.dietEmailBusy) return;
  if (!store.dietEmailAvailable) return;

  const email = ensurePlanReadyEmail();
  const programId = activeProgramId();
  if (!isValidEmail(email) || !programId) return;

  store.dietEmailBusy = true;
  store.dietEmailError = '';
  render();

  let hadRetryableError = false;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (store.dietEmailSent) break;

    const result = await resendDietEmail(email, programId);
    if (result.ok && result.emailSent) {
      store.dietEmailSent = true;
      store.dietEmailError = '';
      break;
    }

    if (isNonRetryableEmailError(result.message)) {
      store.dietEmailAvailable = false;
      break;
    }

    hadRetryableError = true;
    if (attempt < attempts - 1) {
      await new Promise((resolve) => { setTimeout(resolve, delayMs); });
    }
  }

  store.dietEmailBusy = false;
  store.dietEmailError = hadRetryableError && !store.dietEmailSent ? 'retry-failed' : '';
  render();
}

function startPostPaymentEmail() {
  if (!store.programPaid || store.dietEmailSent || !store.dietEmailAvailable) return;
  void ensureDietEmailDelivered();
}

async function handleCheckoutReturn() {
  const params = new URLSearchParams(location.search);
  const checkoutState = params.get('checkout');
  if (!checkoutState) return;

  sessionStorage.setItem('bnb_creator_phase', 'plan-ready');

  if (checkoutState === 'cancel') {
    store.checkoutMessage = 'Checkout was canceled. Your plan is still saved — complete purchase when you are ready.';
    cleanCheckoutQuery();
    return;
  }

  if (checkoutState !== 'success') return;

  const sessionId = params.get('session_id');
  if (!sessionId) {
    store.checkoutError = 'Missing checkout session. Contact support if you were charged.';
    cleanCheckoutQuery();
    return;
  }

  store.checkoutBusy = true;
  const result = await verifyCheckoutSession(sessionId);
  store.checkoutBusy = false;
  cleanCheckoutQuery();

  if (!result.ok) {
    store.checkoutError = result.message || 'Could not verify payment.';
    return;
  }

  if (result.email) {
    store.email = persistAppEmail(result.email);
  }
  if (result.programId) {
    persistPaidProgramId(result.programId);
  }
  await syncProgramAfterPayment({ email: store.email, programId: result.programId });

  store.checkoutMessage = 'Payment complete.';
  store.checkoutVerified = true;
  store.programPaid = true;
  applyFulfillmentResult(result);
}

async function retrySavePlan() {
  if (store.saveBusy) return;
  const ok = await savePlanToServer();
  if (ok) await refreshCheckoutConfig();
  render();
}

async function startCheckout() {
  const email = ensurePlanReadyEmail();
  if (!isValidEmail(email)) {
    store.checkoutError = 'We need your email from the questionnaire before checkout. Go back and confirm your email.';
    render();
    return;
  }
  store.checkoutError = '';
  store.checkoutMessage = '';
  store.checkoutBusy = true;
  render();

  const programId = currentProgramId();
  if (!programId) {
    store.checkoutError = 'Your program must be saved before checkout. Try again from the questionnaire.';
    render();
    return;
  }
  const result = await createCheckoutSession(email, programId);
  store.checkoutBusy = false;

  if (!result.ok || !result.url) {
    store.checkoutError = result.message || 'Could not start checkout.';
    render();
    return;
  }

  window.location.href = result.url;
}

async function completeTestCheckout() {
  const email = ensurePlanReadyEmail();
  store.checkoutError = '';
  store.checkoutMessage = '';
  const result = await completeCheckoutForTest(email, currentProgramId());
  if (!result.ok) {
    store.checkoutError = result.message || 'Test checkout failed.';
    render();
    return;
  }
  if (result.programId) {
    persistPaidProgramId(result.programId);
  }
  await syncProgramAfterPayment({ email, programId: result.programId || currentProgramId() });
  store.checkoutMessage = 'Test access granted.';
  store.checkoutVerified = true;
  store.programPaid = true;
  applyFulfillmentResult(result);
  render();
  startPostPaymentEmail();
}

async function preparePlanReadyState() {
  ensurePlanReadyEmail();
  await refreshCheckoutConfig();
  await handleCheckoutReturn();
  await refreshProgramPaymentStatus();
}

function render() {
  const root = document.getElementById('app');
  if (!root) return;
  root.innerHTML = renderPlanReady();
}

function bindGlobal() {
  if (bindGlobal.done) return;
  bindGlobal.done = true;

  document.getElementById('app').addEventListener('click', (e) => {
    if (e.target.closest('[data-start-checkout]')) {
      startCheckout();
      return;
    }
    if (e.target.closest('[data-retry-save]')) {
      retrySavePlan();
      return;
    }
    if (e.target.closest('[data-download-diet]')) {
      triggerDietDownload().catch((err) => console.error(err));
      return;
    }
    if (e.target.closest('[data-test-checkout]')) {
      completeTestCheckout();
    }
  });
}

bindGlobal();

(async () => {
  restorePaidProgramId();
  restoreBuiltPackage();
  store.email = getAppEmail() || store.builtPackage?.intake?.email || '';

  const checkoutParams = new URLSearchParams(location.search);
  const returningFromStripe = checkoutParams.has('checkout');

  if (!store.builtPackage && !returningFromStripe) {
    if (isDietCreationGated()) {
      renderComingSoon();
      return;
    }
    redirectToQuestionnaire();
    return;
  }

  if (!store.builtPackage && returningFromStripe) {
    const email = ensurePlanReadyEmail();
    if (isValidEmail(email)) {
      await restoreBuiltPackageFromServer(email, { force: true });
    }
  }

  if (!store.builtPackage) {
    if (isDietCreationGated()) {
      renderComingSoon();
      return;
    }
    redirectToQuestionnaire();
    return;
  }

  sessionStorage.setItem('bnb_creator_phase', 'plan-ready');
  await preparePlanReadyState();
  render();
  startPostPaymentEmail();
})();
