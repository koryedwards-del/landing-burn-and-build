/** Return visit — download or resend purchased diet PDF. */

import { getAppEmail, persistAppEmail, isValidEmail, fetchProgramPaymentStatus } from './programApi.js';
import { downloadDietPdfWithRetry, resendDietEmail } from './dietDeliveryApi.js';
import { fetchProgramResumeCheckout } from './programApi.js';

const store = {
  email: '',
  programId: '',
  busy: false,
  message: '',
  error: '',
  paid: false,
};

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function render() {
  const root = document.getElementById('app');
  if (!root) return;

  root.innerHTML = `
    <div class="start-site">
      <div class="screen unlock-screen">
        <div class="start-success">
          <div class="ob-welcome-line1">GET YOUR</div>
          <div class="ob-welcome-line2">BURN &amp; BUILD DIET</div>
        </div>
        <div class="unlock-panel">
          <p class="unlock-lead">Enter the email you used at checkout. We will download your personalized diet PDF or email you another copy.</p>
          <form id="diet-access-form" class="unlock-panel" action="#" method="post" novalidate>
            <label class="unlock-lead" for="diet-email">Email</label>
            <input
              id="diet-email"
              class="calc-input"
              type="email"
              name="email"
              autocomplete="email"
              placeholder="you@example.com"
              value="${escapeHtml(store.email)}"
              required
              style="width:100%;margin:12px 0 20px;padding:12px 14px;border-radius:8px;border:1px solid #444;background:#111;color:#fff;"
            />
            <button type="submit" class="btn-primary unlock-cta" ${store.busy ? 'disabled' : ''}>
              ${store.busy ? 'WORKING…' : 'DOWNLOAD YOUR BURN & BUILD DIET'}
            </button>
          </form>
          <button type="button" class="btn-secondary unlock-cta-secondary" id="resend-diet-email" ${store.busy ? 'disabled' : ''}>
            Email me a copy
          </button>
          ${store.message ? `<p class="unlock-tagline">${escapeHtml(store.message)}</p>` : ''}
          ${store.error ? `<div class="unlock-error">${escapeHtml(store.error)}</div>` : ''}
          <p class="unlock-hint"><a href="/">← Back to website</a></p>
        </div>
      </div>
    </div>`;

  root.querySelector('#diet-access-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    handleDownload().catch((err) => console.error(err));
  });
  root.querySelector('#resend-diet-email')?.addEventListener('click', () => {
    handleResend().catch((err) => console.error(err));
  });
}

async function resolvePaidProgram(email) {
  const resume = await fetchProgramResumeCheckout(email);
  if (!resume.ok || !resume.programId) {
    return { ok: false, message: resume.message || 'No purchased program found for this email.' };
  }
  const paid = await fetchProgramPaymentStatus(email, resume.programId);
  if (!paid.ok || !paid.paid) {
    return { ok: false, message: 'We found a program for this email, but checkout is not complete yet.' };
  }
  return { ok: true, programId: resume.programId };
}

async function handleDownload() {
  const input = document.getElementById('diet-email');
  const email = persistAppEmail(input?.value || '');
  if (!isValidEmail(email)) {
    store.error = 'Enter a valid email address.';
    store.message = '';
    render();
    return;
  }

  store.busy = true;
  store.error = '';
  store.message = 'Preparing your PDF…';
  render();

  const resolved = await resolvePaidProgram(email);
  if (!resolved.ok) {
    store.busy = false;
    store.message = '';
    store.error = resolved.message;
    render();
    return;
  }

  store.email = email;
  store.programId = resolved.programId;
  const result = await downloadDietPdfWithRetry(email, resolved.programId);
  store.busy = false;
  if (!result.ok) {
    store.message = '';
    store.error = result.message;
    render();
    return;
  }

  store.message = 'Download started. Check your Downloads folder.';
  store.error = '';
  render();
}

async function handleResend() {
  const input = document.getElementById('diet-email');
  const email = persistAppEmail(input?.value || '');
  if (!isValidEmail(email)) {
    store.error = 'Enter a valid email address.';
    store.message = '';
    render();
    return;
  }

  store.busy = true;
  store.error = '';
  store.message = 'Sending email…';
  render();

  const resolved = await resolvePaidProgram(email);
  if (!resolved.ok) {
    store.busy = false;
    store.message = '';
    store.error = resolved.message;
    render();
    return;
  }

  const result = await resendDietEmail(email, resolved.programId);
  store.busy = false;
  if (!result.ok) {
    store.message = '';
    store.error = result.message || 'Could not send email.';
    render();
    return;
  }

  store.email = email;
  store.programId = resolved.programId;
  store.message = result.emailSkipped
    ? 'Your diet is ready — use Download if you need the file now.'
    : `We emailed your Burn & Build Diet to ${email}.`;
  store.error = '';
  render();
}

store.email = getAppEmail();
render();
