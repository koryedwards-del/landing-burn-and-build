/** Checkout paywall — questionnaire builds the program; Stripe unlocks PDF delivery. */

import { getAppEmail, persistAppEmail, saveProgramToServer, isValidEmail, fetchProgramFromServer, fetchProgramPaymentStatus, fetchProgramByIdFromServer, fetchProgramResumeCheckout } from './programApi.js';
import { persistProgramBridge, loadProgramBridge } from './programBridgeHandoff.js';
import {
  completeCheckoutForTest,
  createCheckoutSession,
  fetchCheckoutStatus,
  verifyCheckoutSession,
} from './checkoutApi.js';
import { downloadDietPdfWithRetry, resendDietEmail } from './dietDeliveryApi.js';
import { QUESTIONNAIRE_WELCOME_URL, CREATOR_CHECKOUT_URL, isDietCreationGated } from './siteUrls.js';

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
          <p class="unlock-hint">Already purchased? <a href="${CREATOR_CHECKOUT_URL}">Return to checkout</a> to download your PDF or check your email.</p>
          <p class="unlock-hint"><a href="/">← Back to website</a></p>
        </div>
      </div>
    </div>`;
}

function redirectToQuestionnaire() {
  window.location.replace(QUESTIONNAIRE_WELCOME_URL);
}

async function tryRestorePaidSession() {
  const email = ensurePlanReadyEmail();
  if (!isValidEmail(email)) return false;

  const resume = await fetchProgramResumeCheckout(email);
  if (!resume.ok || !resume.programPaid || !resume.package) return false;

  store.builtPackage = resume.package;
  store.email = persistAppEmail(email);
  persistPaidProgramId(resume.programId);
  persistProgramBridge(resume.package);
  store.programPaid = true;
  return true;
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
  if (result.ok && result.dietEmailSent) {
    store.dietEmailSent = true;
  }
}

function renderPaidDirections() {
  const downloadLabel = store.dietDownloadBusy
    ? 'PREPARING YOUR PDF…'
    : 'DOWNLOAD YOUR PRINTOUT';

  const downloadLine = store.dietDownloaded
    ? `<p class="unlock-receipt__download unlock-receipt__download--done">${downloadLabel}</p>`
    : `<button type="button" class="unlock-receipt__download" data-download-diet ${store.dietDownloadBusy ? 'disabled' : ''}>${downloadLabel}</button>`;

  return `
          <div class="unlock-receipt">
            <p class="unlock-receipt__line">PAYMENT SUCCESSFUL</p>
            ${downloadLine}
            <p class="unlock-receipt__note">a copy has also been sent to your email</p>
          </div>
          ${store.dietFulfillmentError ? `<div class="unlock-error">${escapeHtml(store.dietFulfillmentError)}</div>` : ''}`;
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
          <p class="unlock-hint">${hasPaidAccess || isDietCreationGated()
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
    if (result.ok && (result.emailSent || result.emailAlreadySent)) {
      store.dietEmailSent = true;
      store.dietEmailError = '';
      render();
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
  render();
  startPostPaymentEmail();
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
      const restored = await tryRestorePaidSession();
      if (restored) {
        sessionStorage.setItem('bnb_creator_phase', 'plan-ready');
        await preparePlanReadyState();
        render();
        startPostPaymentEmail();
        return;
      }
      renderComingSoon();
      return;
    }
    const restored = await tryRestorePaidSession();
    if (!restored) {
      redirectToQuestionnaire();
      return;
    }
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
