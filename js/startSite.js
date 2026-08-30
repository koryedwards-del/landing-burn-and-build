/** Checkout paywall — questionnaire builds the program; Stripe unlocks PDF delivery. */

import { getAppEmail, persistAppEmail, saveProgramToServer, warmProgramApi, isValidEmail, fetchProgramPaymentStatus, fetchProgramByIdFromServer, fetchProgramResumeCheckout } from './programApi.js';
import { persistProgramBridge, loadProgramBridge, persistPaidProgramId, readPaidProgramId } from './programBridgeHandoff.js';
import {
  completeCheckoutForTest,
  createCheckoutSession,
  fetchCheckoutStatus,
  verifyCheckoutSession,
} from './checkoutApi.js';
import { downloadDietPdfWithRetry, resendDietEmail } from './dietDeliveryApi.js';
import { cleanPurchaserPortalQuery, readPurchaserPortalParams } from './purchaserPortal.js';
import { QUESTIONNAIRE_WELCOME_URL } from './siteUrls.js';
import { CONTACT_EMAIL } from './contactEmailData.js';
import { parentConsentReadyForPurchase } from './parentConsentData.js';

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
  dietEmailAttemptedThisVisit: false,
  dietEmailAvailable: true,
  dietEmailError: '',
  dietFulfillmentError: '',
  restoreBusy: false,
  restoreError: '',
};

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function rememberPaidProgramId(programId) {
  persistPaidProgramId(programId);
  store.paidProgramId = String(programId || '').trim();
}

function restorePaidProgramId() {
  const stored = readPaidProgramId();
  if (stored) {
    store.paidProgramId = stored;
  }
}

function restoreBuiltPackage() {
  if (store.builtPackage) return;
  store.builtPackage = loadProgramBridge();
}

function renderPurchaserPortal() {
  const savedEmail = escapeHtml(getAppEmail());
  const restoreError = store.restoreError
    ? `<div class="unlock-error">${escapeHtml(store.restoreError)}</div>`
    : '';

  document.getElementById('app').innerHTML = `
    <div class="start-site">
      <div class="screen unlock-screen">
        <div class="start-success">
          <div class="check">✓</div>
          <div class="ob-welcome-line1">DOWNLOAD YOUR</div>
          <div class="ob-welcome-line2">BURN &amp; BUILD DIET</div>
        </div>
        <div class="unlock-panel">
          <p class="unlock-lead">Enter the email you used at checkout.</p>
          <form class="unlock-restore" data-restore-form>
            <label class="unlock-restore__label" for="restore-email">Checkout email</label>
            <input
              id="restore-email"
              class="unlock-restore__input"
              type="email"
              name="email"
              autocomplete="email"
              inputmode="email"
              spellcheck="false"
              value="${savedEmail}"
              placeholder="you@example.com"
              ${store.restoreBusy ? 'disabled' : ''}
            />
            <button type="submit" class="btn-primary unlock-cta" data-restore-purchase ${store.restoreBusy ? 'disabled' : ''}>
              ${store.restoreBusy ? 'OPENING YOUR DIET…' : 'OPEN MY DIET'}
            </button>
          </form>
          ${restoreError}
          <p class="unlock-hint"><a href="/">← Back to website</a> · <a href="${QUESTIONNAIRE_WELCOME_URL}">Create a new program</a></p>
        </div>
      </div>
    </div>`;
}

async function restorePurchaseByEmail(rawEmail) {
  const email = String(rawEmail || '').trim();
  if (!isValidEmail(email)) {
    store.restoreError = 'Enter a valid email address.';
    renderPurchaserPortal();
    return false;
  }

  store.restoreBusy = true;
  store.restoreError = '';
  renderPurchaserPortal();

  store.email = persistAppEmail(email);
  const resume = await fetchProgramResumeCheckout(email);
  store.restoreBusy = false;

  if (!resume.ok || !resume.package) {
    store.restoreError = resume.message || 'No program found for that email.';
    renderPurchaserPortal();
    return false;
  }

  if (!resume.programPaid) {
    store.restoreError = `Payment is not complete for this email. Email ${CONTACT_EMAIL} if you were charged.`;
    renderPurchaserPortal();
    return false;
  }

  store.builtPackage = resume.package;
  rememberPaidProgramId(resume.programId);
  persistProgramBridge(resume.package);
  store.programPaid = true;
  store.restoreError = '';
  return finishPaidRestore();
}

async function tryAutoRestorePurchaser() {
  if (await tryRestorePaidSession()) return true;

  const email = ensurePlanReadyEmail();
  const programId = activeProgramId();
  if (!isValidEmail(email) || !programId) return false;

  const synced = await syncProgramAfterPayment({ email, programId });
  if (!synced) return false;

  await refreshProgramPaymentStatus();
  return store.programPaid;
}

async function finishPaidRestore({ autoDownload = false } = {}) {
  sessionStorage.setItem('bnb_creator_phase', 'plan-ready');
  cleanPurchaserPortalQuery();
  await preparePlanReadyState();
  render();
  startPostPaymentEmail();
  if (autoDownload) {
    await triggerDietDownload();
  }
  return true;
}

async function tryRestorePaidSession() {
  const email = ensurePlanReadyEmail();
  if (!isValidEmail(email)) return false;

  const resume = await fetchProgramResumeCheckout(email);
  if (!resume.ok || !resume.programPaid || !resume.package) return false;

  store.builtPackage = resume.package;
  store.email = persistAppEmail(email);
  rememberPaidProgramId(resume.programId);
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
  const resume = await fetchProgramResumeCheckout(email);
  if (!resume.ok || !resume.package || !resume.programPaid) return false;
  store.builtPackage = resume.package;
  if (resume.programId) {
    rememberPaidProgramId(resume.programId);
  }
  persistProgramBridge(store.builtPackage);
  return true;
}

async function syncProgramAfterPayment({ email, programId } = {}) {
  const resolvedEmail = isValidEmail(email) ? email : ensurePlanReadyEmail();
  restoreBuiltPackage();
  const resolvedProgramId = String(
    programId || store.builtPackage?.program?.id || store.paidProgramId || ''
  ).trim();
  if (!isValidEmail(resolvedEmail) || !resolvedProgramId) return false;

  store.paidProgramId = resolvedProgramId;
  rememberPaidProgramId(resolvedProgramId);
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

  /** Active program on this device wins over stale browser storage (trainers, shared devices). */
  const fromPackage = String(store.builtPackage?.intake?.email || '').trim();
  if (isValidEmail(fromPackage)) {
    store.email = persistAppEmail(fromPackage);
    return store.email;
  }

  const fromStore = String(store.email || '').trim();
  if (isValidEmail(fromStore)) return fromStore;

  const fromSaved = getAppEmail();
  if (isValidEmail(fromSaved)) {
    store.email = fromSaved;
    return fromSaved;
  }

  return '';
}

function activeProgramId() {
  restoreBuiltPackage();
  const builtId = String(store.builtPackage?.program?.id || '').trim();
  if (builtId) return builtId;
  return String(store.paidProgramId || '').trim();
}

function currentProgramId() {
  return activeProgramId();
}

async function refreshProgramPaymentStatus() {
  if (store.checkoutVerified) {
    store.programPaid = true;
  } else {
    const email = ensurePlanReadyEmail();
    const programId = activeProgramId();
    if (!isValidEmail(email) || !programId) {
      store.programPaid = false;
      return;
    }
    const result = await fetchProgramPaymentStatus(email, programId);
    store.programPaid = !!(result.ok && result.paid);
    if (store.programPaid) {
      rememberPaidProgramId(programId);
    }
  }

  await syncDietEmailSentFromServer();
}

function markDietEmailSent() {
  store.dietEmailSent = true;
}

async function syncDietEmailSentFromServer() {
  if (store.dietEmailSent) return true;
  const email = ensurePlanReadyEmail();
  const programId = activeProgramId();
  if (!isValidEmail(email) || !programId) return false;
  const result = await fetchProgramPaymentStatus(email, programId);
  if (result.ok && result.dietEmailSent) {
    markDietEmailSent();
    return true;
  }
  return false;
}

function renderDietEmailSpamHint() {
  if (!store.dietEmailAvailable || !store.dietEmailSent) return '';
  return '<p class="unlock-receipt__hint">Check your spam folder if you do not see the email.</p>';
}

function renderDietEmailNote() {
  if (!store.dietEmailAvailable) return '';
  if (store.dietEmailSent) {
    return '<p class="unlock-receipt__note unlock-receipt__note--sent">A copy is also sent to your email.</p>';
  }
  if (store.dietEmailBusy) {
    return '<p class="unlock-receipt__note unlock-receipt__note--sending">Sending a copy to your email…</p>';
  }
  if (store.dietEmailError) {
    return '<p class="unlock-receipt__note">Email is on the way — use the download button above.</p>';
  }
  return '<p class="unlock-receipt__note unlock-receipt__note--sending">Sending a copy to your email…</p>';
}

function renderPaidDirections() {
  const downloadLabel = store.dietDownloadBusy
    ? 'PREPARING YOUR PDF…'
    : 'DOWNLOAD YOUR BURN & BUILD DIET';

  const downloadLine = `<button type="button" class="unlock-receipt__download${store.dietDownloaded ? ' unlock-receipt__download--done' : ''}" data-download-diet ${store.dietDownloadBusy ? 'disabled' : ''}>${downloadLabel}</button>`;

  return `
          <div class="unlock-receipt">
            <p class="unlock-receipt__line">PAYMENT SUCCESSFUL</p>
            ${downloadLine}
            ${renderDietEmailNote()}
            ${renderDietEmailSpamHint()}
          </div>
          ${store.dietFulfillmentError ? `<div class="unlock-error">${escapeHtml(store.dietFulfillmentError)}</div>` : ''}`;
}

function isNonRetryableEmailError(message) {
  const msg = String(message || '').toLowerCase();
  return msg.includes('not configured') || msg.includes('diet email');
}

function renderPlanReadyAppHandoff(unlocked) {
  if (!unlocked) {
    return '<p class="unlock-tagline">Complete purchase to download your Burn &amp; Build Diet PDF.</p>';
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
    lead = 'Your program is ready on this device. Save it to your account, then complete checkout.';
  } else {
    lead = 'Your program is saved. Complete checkout to download your Burn &amp; Build Diet PDF.';
  }

  const checkoutBlock = showPaywall
    ? !store.apiReachable ? `
          <p class="unlock-hint">Could not reach the Burn &amp; Build server. Check your connection and try again.</p>
          ${store.saveError ? `<button type="button" class="btn-secondary unlock-cta-secondary" data-retry-save ${store.saveBusy ? 'disabled' : ''}>${store.saveBusy ? 'SAVING…' : 'Retry save'}</button>` : ''}`
      : store.stripeConfigured ? `
          <button type="button" class="btn-primary unlock-cta" data-start-checkout ${store.checkoutBusy ? 'disabled' : ''}>
            ${store.checkoutBusy ? 'OPENING CHECKOUT…' : 'COMPLETE PURCHASE — $279'}
          </button>
          <p class="unlock-hint">Secure checkout · One-time $279 · Yours for life</p>
          ${store.checkoutTestBypass ? '<button type="button" class="btn-secondary unlock-cta-secondary" data-test-checkout>Skip payment (local test)</button>' : ''}`
      : `
          <p class="unlock-hint">Checkout is not available yet. Email ${CONTACT_EMAIL} if you need help.</p>
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
          ${hasPaidAccess ? '<p class="unlock-hint"><a href="/">← Back to website</a></p>' : ''}
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
    store.saveError = 'No program to save.';
    return false;
  }
  store.saveBusy = true;
  store.saveError = '';
  const saved = await saveProgramToServer(email, store.builtPackage);
  store.saveBusy = false;
  if (!saved.ok) {
    store.saveError = saved.message || 'Could not save your program.';
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

  const result = await downloadDietPdfWithRetry(email, programId, { pkg: store.builtPackage });
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
  if (result?.emailSent || result?.emailAlreadySent) {
    markDietEmailSent();
  }
  store.dietPreparing = !result?.pdfReady;
  if (result?.emailError && isNonRetryableEmailError(result.emailError)) {
    store.dietEmailAvailable = false;
  }
  store.dietEmailError = result?.emailError && !isNonRetryableEmailError(result.emailError)
    ? result.emailError
    : '';
  store.dietFulfillmentError = result?.error || '';
}

function isDietEmailDeliverySuccess(result) {
  return !!(result?.emailSent || result?.emailAlreadySent);
}

async function ensureDietEmailDelivered({ attempts = 8, delayMs = 2000 } = {}) {
  if (store.dietEmailSent || store.dietEmailBusy || store.dietEmailAttemptedThisVisit) return;
  if (!store.dietEmailAvailable) return;

  const email = ensurePlanReadyEmail();
  const programId = activeProgramId();
  if (!isValidEmail(email) || !programId) return;

  store.dietEmailBusy = true;
  store.dietEmailAttemptedThisVisit = true;
  store.dietEmailError = '';
  render();

  let hadRetryableError = false;
  let lastMessage = '';
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (store.dietEmailSent) break;

    const result = await resendDietEmail(email, programId, { force: attempt > 0 });
    if (result.ok && isDietEmailDeliverySuccess(result)) {
      markDietEmailSent();
      store.dietEmailError = '';
      render();
      break;
    }

    lastMessage = result.message || lastMessage;

    if (isNonRetryableEmailError(result.message)) {
      store.dietEmailAvailable = false;
      break;
    }

    hadRetryableError = true;
    if (attempt < attempts - 1) {
      await new Promise((resolve) => { setTimeout(resolve, delayMs); });
    }
  }

  if (!store.dietEmailSent) {
    await syncDietEmailSentFromServer();
  }

  store.dietEmailBusy = false;
  store.dietEmailError = hadRetryableError && !store.dietEmailSent ? 'retry-failed' : '';
  if (!store.dietEmailSent && lastMessage) {
    store.dietFulfillmentError = lastMessage;
  }
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
    store.checkoutMessage = 'Checkout was canceled. Your program is still saved — complete purchase when you are ready.';
    cleanCheckoutQuery();
    return;
  }

  if (checkoutState !== 'success') return;

  const sessionId = params.get('session_id');
  if (!sessionId) {
    store.checkoutError = `Missing checkout session. Email ${CONTACT_EMAIL} if you were charged.`;
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
    rememberPaidProgramId(result.programId);
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
  if (!parentConsentReadyForPurchase(store.builtPackage?.intake)) {
    store.checkoutError = 'Parent/guardian approval is required before purchase for athletes age 17 and under. Return to the questionnaire Age question to complete it.';
    render();
    return;
  }
  store.checkoutError = '';
  store.checkoutMessage = '';
  store.checkoutBusy = true;
  render();

  const saved = await savePlanToServer();
  if (!saved) {
    store.checkoutBusy = false;
    render();
    return;
  }

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
  if (!parentConsentReadyForPurchase(store.builtPackage?.intake)) {
    store.checkoutError = 'Parent/guardian approval is required before purchase for athletes age 17 and under.';
    render();
    return;
  }
  store.checkoutError = '';
  store.checkoutMessage = '';
  const result = await completeCheckoutForTest(email, currentProgramId());
  if (!result.ok) {
    store.checkoutError = result.message || 'Test checkout failed.';
    render();
    return;
  }
  if (result.programId) {
    rememberPaidProgramId(result.programId);
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
  restoreBuiltPackage();
  if (store.builtPackage && store.apiReachable && !store.programPaid && !store.checkoutVerified) {
    await warmProgramApi();
    await savePlanToServer();
  }
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

  document.getElementById('app').addEventListener('submit', (e) => {
    const form = e.target.closest('[data-restore-form]');
    if (!form) return;
    e.preventDefault();
    const input = form.querySelector('#restore-email, [name="email"]');
    void restorePurchaseByEmail(input?.value);
  });

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
  const portalParams = readPurchaserPortalParams();
  restorePaidProgramId();
  restoreBuiltPackage();
  store.email = getAppEmail() || store.builtPackage?.intake?.email || '';

  if (isValidEmail(portalParams.email)) {
    store.email = persistAppEmail(portalParams.email);
  }
  if (portalParams.programId) {
    rememberPaidProgramId(portalParams.programId);
  }

  const checkoutParams = new URLSearchParams(location.search);
  const returningFromStripe = checkoutParams.has('checkout');

  if (!store.builtPackage && !returningFromStripe) {
    const restored = await tryAutoRestorePurchaser();
    if (restored) {
      await finishPaidRestore({ autoDownload: portalParams.autoDownload });
      return;
    }
    renderPurchaserPortal();
    return;
  }

  if (!store.builtPackage && returningFromStripe) {
    const email = ensurePlanReadyEmail();
    if (isValidEmail(email)) {
      await restoreBuiltPackageFromServer(email, { force: true });
    }
  }

  if (!store.builtPackage) {
    renderPurchaserPortal();
    return;
  }

  await finishPaidRestore({ autoDownload: portalParams.autoDownload });
})();
