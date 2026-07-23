/** Sidebar — purchased diet plans; switch active program. */

import {
  fetchProgramByIdFromServer,
  fetchProgramHistoryFromServer,
  getAppEmail,
  isValidEmail,
  persistAppEmail,
  normalizeEmail,
} from './programApi.js';
import { getActiveProgramId, setActiveProgramId } from './programActive.js';
import { summarizeProgram, sortProgramHistory } from './programHistory.js';
import { renderSidebarProgramCard } from './programHistoryUi.js';
import { persistProgramBridge } from './programBridgeHandoff.js';
import { flushProgramPersist } from './menuPlannerState.js';

function navListEl() {
  return document.getElementById('r-nav-list');
}

function resolveProgramEmail(programPackage) {
  const fromPackage = normalizeEmail(programPackage?.intake?.email);
  if (isValidEmail(fromPackage)) {
    persistAppEmail(fromPackage);
    return fromPackage;
  }
  return getAppEmail();
}

function syncProgramEmail(programPackage) {
  resolveProgramEmail(programPackage);
}

function summarizePaidPrograms(programRows = []) {
  return programRows
    .filter((row) => row?.package)
    .map((row) => summarizeProgram(row.package, {
      id: row.id,
      createdAt: row.createdAt,
      label: row.label,
    }));
}

let openingProgramId = null;
let switchHandler = null;
let beforeSwitchHandler = null;
let getProgramPackageHandler = null;
const LIBRARY_CACHE_KEY = 'bnb_sidebar_library';
let lastRenderedSignature = '';
let lastRenderedRows = [];
let lastRenderedActiveId = null;
let libraryMounted = false;
let libraryReady = false;
let dietPlansExpanded = false;

function libraryCacheKey(email) {
  return `${LIBRARY_CACHE_KEY}:${email}`;
}

function readLibraryCache(email) {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(libraryCacheKey(email)) || 'null');
    if (!parsed || !Array.isArray(parsed.rows)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeLibraryCache(email, rows, activeId) {
  try {
    sessionStorage.setItem(libraryCacheKey(email), JSON.stringify({ rows, activeId }));
  } catch {
    /* ignore quota errors */
  }
}

function rowsSignature(rows, activeId) {
  return `${activeId || ''}:${openingProgramId || ''}:${rows.map((row) => row.id).join(',')}`;
}

function bindLibraryEvents() {
  const list = navListEl();
  if (!list || list.dataset.libraryBound === '1') return;
  list.dataset.libraryBound = '1';

  list.addEventListener('click', (event) => {
    const toggleBtn = event.target.closest('[data-diet-plans-toggle]');
    if (toggleBtn) {
      const group = toggleBtn.closest('.pb-nav__group--diet-plans');
      if (!group) return;
      dietPlansExpanded = !dietPlansExpanded;
      group.classList.toggle('is-expanded', dietPlansExpanded);
      toggleBtn.setAttribute('aria-expanded', dietPlansExpanded ? 'true' : 'false');
      return;
    }

    const switchBtn = event.target.closest('[data-switch-program]');
    if (!switchBtn || switchBtn.disabled) return;
    const programId = switchBtn.getAttribute('data-switch-program');
    if (!programId) return;
    switchProgram(programId).catch((err) => console.error(err));
  });
}

function syncDietPlansExpandedState() {
  const group = navListEl()?.querySelector('.pb-nav__group--diet-plans');
  if (!group) return;
  group.classList.toggle('is-expanded', dietPlansExpanded);
  group.querySelector('[data-diet-plans-toggle]')
    ?.setAttribute('aria-expanded', dietPlansExpanded ? 'true' : 'false');
}

function removeDietPlansFromNav() {
  navListEl()?.querySelector('.pb-nav__group--diet-plans')?.remove();
  libraryMounted = false;
}

function libraryGroupHtml(programRowsHtml = '') {
  return `
    <li class="pb-nav__item pb-nav__group pb-nav__group--diet-plans">
      <div class="pb-nav__diet-panel">
        <button
          type="button"
          class="pb-nav__btn pb-nav__btn--group-head"
          data-diet-plans-toggle
          aria-expanded="false"
        >Your diet plans</button>
        <ul class="pb-nav__group-list pb-nav__group-list--diet-plans">
          ${programRowsHtml}
        </ul>
      </div>
    </li>`;
}

function nestedRowsHtml(rows, activeId) {
  if (!rows.length) {
    return `
      <li class="pb-nav__item pb-nav__item--nested pb-nav__item--empty">
        <span class="pb-nav__nested-empty">No purchased plans yet.</span>
      </li>`;
  }

  return rows.map((row) => renderSidebarProgramCard(row, {
    isActive: row.id === activeId,
    isOpening: row.id === openingProgramId,
  })).join('');
}

function mountLibraryGroup(rows, activeId, { errorMessage = '' } = {}) {
  const list = navListEl();
  if (!list) return;

  removeDietPlansFromNav();
  const rowsHtml = errorMessage
    ? `
      <li class="pb-nav__item pb-nav__item--nested pb-nav__item--empty">
        <span class="pb-nav__nested-empty pb-nav__nested-empty--error">${errorMessage}</span>
      </li>`
    : nestedRowsHtml(rows, activeId);
  list.insertAdjacentHTML('beforeend', libraryGroupHtml(rowsHtml));
  syncDietPlansExpandedState();
  libraryMounted = true;
}

function renderLibraryRows(rows, activeId) {
  const signature = rowsSignature(rows, activeId);
  if (signature === lastRenderedSignature && libraryMounted) {
    return;
  }

  lastRenderedSignature = signature;
  lastRenderedRows = rows;
  lastRenderedActiveId = activeId;
  libraryReady = true;
  mountLibraryGroup(rows, activeId);
}

/** Re-append diet plans after the main nav list is rebuilt. */
export function remountProgramLibraryNav() {
  if (!libraryReady) return;
  lastRenderedSignature = '';
  renderLibraryRows(lastRenderedRows, lastRenderedActiveId);
}

export async function refreshProgramLibrary({
  activeProgramId = getActiveProgramId(),
  programPackage = null,
} = {}) {
  bindLibraryEvents();

  const email = resolveProgramEmail(programPackage);
  if (!isValidEmail(email)) {
    removeDietPlansFromNav();
    lastRenderedSignature = '';
    lastRenderedRows = [];
    lastRenderedActiveId = null;
    libraryReady = false;
    return [];
  }

  const cached = readLibraryCache(email);
  if (cached?.rows?.length) {
    renderLibraryRows(cached.rows, activeProgramId);
  }

  const result = await fetchProgramHistoryFromServer(email);
  if (!result.ok) {
    mountLibraryGroup([], activeProgramId, {
      errorMessage: result.message || 'Could not load your plans.',
    });
    return [];
  }

  const rows = sortProgramHistory(summarizePaidPrograms(result.programs), activeProgramId);
  renderLibraryRows(rows, activeProgramId);
  writeLibraryCache(email, rows, activeProgramId);
  return rows;
}

export function initProgramLibrary({ onSwitch, beforeSwitch, getProgramPackage } = {}) {
  switchHandler = onSwitch || null;
  beforeSwitchHandler = beforeSwitch || null;
  getProgramPackageHandler = getProgramPackage || null;
  bindLibraryEvents();
}

export async function switchProgram(programId, { programPackage = null } = {}) {
  const activeId = getActiveProgramId();
  if (!programId || programId === activeId) return { ok: true, switched: false };

  const pkg = programPackage
    || (typeof getProgramPackageHandler === 'function' ? getProgramPackageHandler() : null);
  const email = resolveProgramEmail(pkg);
  if (!isValidEmail(email)) {
    return { ok: false, message: 'Sign in with your program email first.' };
  }

  openingProgramId = programId;
  await refreshProgramLibrary({ activeProgramId: activeId, programPackage: pkg });

  if (beforeSwitchHandler) {
    await beforeSwitchHandler();
  }

  const result = await fetchProgramByIdFromServer(email, programId);
  if (!result.ok || !result.package) {
    openingProgramId = null;
    await refreshProgramLibrary({ activeProgramId: activeId, programPackage: pkg });
    return { ok: false, message: result.message || 'Could not load that plan.' };
  }

  setActiveProgramId(programId);
  persistProgramBridge(result.package);
  await flushProgramPersist(result.package);

  openingProgramId = null;

  if (switchHandler) {
    await switchHandler(result.package);
  }

  await refreshProgramLibrary({ activeProgramId: programId, programPackage: result.package });
  return { ok: true, switched: true, package: result.package };
}

/** Shared sidebar boot — program report (pages 1–3) and menu planner (page 4). */
export function bootProgramBridgeAside({
  getProgramPackage,
  onSwitch,
  beforeSwitch,
  openAccessGate,
} = {}) {
  if (typeof openAccessGate === 'function') {
    window.__bnbOpenAccessGate = openAccessGate;
  }

  initProgramLibrary({ onSwitch, beforeSwitch, getProgramPackage });

  const pkg = typeof getProgramPackage === 'function' ? getProgramPackage() : null;
  syncProgramEmail(pkg);

  return refreshProgramLibrary({
    activeProgramId: pkg?.program?.id || getActiveProgramId(),
    programPackage: pkg,
  });
}
