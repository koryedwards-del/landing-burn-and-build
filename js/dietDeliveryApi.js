/** Download / resend personalized diet PDF after purchase. */

import { apiUrl } from './apiConfig.js';
import { fetchJson } from './apiFetch.js';
import { dietPdfFilename } from './dietPdfNaming.js';
import { normalizeEmail } from './programApi.js';

export function dietPdfDownloadUrl(email, programId) {
  const params = new URLSearchParams({
    email: normalizeEmail(email),
    program_id: String(programId || ''),
  });
  return apiUrl(`/api/programs/diet-pdf?${params}`);
}

function triggerBrowserDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename || dietPdfFilename();
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function filenameFromDisposition(headerValue) {
  if (!headerValue) return null;
  const match = /filename="([^"]+)"/i.exec(headerValue);
  return match?.[1] || null;
}

export async function downloadDietPdf(email, programId) {
  try {
    const res = await fetch(dietPdfDownloadUrl(email, programId));
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, message: data.message || 'Could not download your diet PDF.' };
    }
    const blob = await res.blob();
    const filename = filenameFromDisposition(res.headers.get('Content-Disposition'));
    triggerBrowserDownload(blob, filename);
    return { ok: true, filename };
  } catch {
    return { ok: false, message: 'Network error downloading your diet PDF.' };
  }
}

export async function downloadDietPdfWithRetry(email, programId, { attempts = 10, delayMs = 1500 } = {}) {
  let lastMessage = 'Could not download your diet PDF.';
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const result = await downloadDietPdf(email, programId);
    if (result.ok) return result;
    lastMessage = result.message || lastMessage;
    if (attempt < attempts - 1) {
      await new Promise((resolve) => { setTimeout(resolve, delayMs); });
    }
  }
  return { ok: false, message: lastMessage };
}

export async function resendDietEmail(email, programId) {
  try {
    const { res, data } = await fetchJson(apiUrl('/api/programs/resend-diet-email'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: normalizeEmail(email),
        programId: programId || undefined,
      }),
    });
    if (!res.ok) return { ok: false, message: data.message || 'Could not resend your diet email.' };
    return data;
  } catch {
    return { ok: false, message: 'Network error resending your diet email.' };
  }
}
