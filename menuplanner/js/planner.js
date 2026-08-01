import {
  ASSET_VERSION as FALLBACK_ASSET_VERSION,
  FOODS_CATALOG_VERSION,
} from '../../js/assetVersion.js';
import { plannerStateFromPackage } from '../../js/menuPlannerState.js';
import { setActiveProgramId } from '../../js/programActive.js';
import {
  state,
  initMealSlotsFromProgram,
  persistPlannerToProgram,
  normalizeMealMakerDraft,
} from './plannerState.js';
import { applyPlannerStateWithDefaults } from './defaultPlannerTemplate.js';
import { ensureFoodPreferences } from './mealPlanGenerator.js';

const ASSET_VERSION = new URL(import.meta.url).searchParams.get('v') || FALLBACK_ASSET_VERSION;

let plannerShellReady = false;
let plannerBootPromise = null;
let views = null;
let reactiveViews = null;
let loadedFoodsCatalogVersion = null;

async function loadViews() {
  if (!views) {
    views = await import(`./plannerViews.js?v=${ASSET_VERSION}`);
  }
  return views;
}

async function loadReactiveViews() {
  if (!reactiveViews) {
    reactiveViews = await import(`./reactivePlannerViews.js?v=${ASSET_VERSION}`);
  }
  return reactiveViews;
}

async function loadFoodsCatalog({ force = false } = {}) {
  if (!force && loadedFoodsCatalogVersion === FOODS_CATALOG_VERSION && state.foods?.length) {
    return null;
  }

  const response = await fetch(
    `../data/foods.json?v=${encodeURIComponent(FOODS_CATALOG_VERSION)}`,
    { cache: 'no-store' },
  );
  if (!response.ok) {
    throw new Error('Could not load foods catalog.');
  }

  state.foods = await response.json();
  loadedFoodsCatalogVersion = FOODS_CATALOG_VERSION;
  return state.foods;
}

function renderReactiveSurface() {
  if (!plannerShellReady || !reactiveViews) return;
  views?.renderPlannerMeta();
  reactiveViews.renderReactivePlanner();
}

function applyProgramPackage(pkg) {
  state.programPackage = pkg;
  if (state.programPackage?.program?.id) {
    setActiveProgramId(state.programPackage.program.id);
  }
  initMealSlotsFromProgram(state.programPackage);
  const saved = plannerStateFromPackage(state.programPackage);
  const seeded = applyPlannerStateWithDefaults(saved, {
    preserveSessionUi: plannerShellReady,
  });
  normalizeMealMakerDraft();
  ensureFoodPreferences();
  if (seeded) {
    persistPlannerToProgram({ immediate: true });
  }
  if (!views) return;

  const pkgCatalog = pkg?.reference?.foodsCatalogVersion;
  const catalogStale = pkgCatalog && pkgCatalog !== FOODS_CATALOG_VERSION;

  if (plannerShellReady && catalogStale) {
    loadFoodsCatalog({ force: true })
      .then(() => {
        renderReactiveSurface();
        reactiveViews?.showReactiveToast('Food lists updated to the latest catalog.', { durationMs: 7000 });
      })
      .catch((err) => {
        console.error(err);
        reactiveViews?.showReactiveToast('Could not refresh food lists. Reload the page to try again.', {
          variant: 'error',
        });
      });
    return;
  }

  renderReactiveSurface();
  if (seeded) {
    reactiveViews?.showReactiveToast(
      'Your week is filled using your servings. Swap any protein, g/s, veggie, or fruit to personalize.',
      { durationMs: 9000 },
    );
  }
}

export function applyMenuPlannerProgram(pkg) {
  applyProgramPackage(pkg);
}

export function refreshMenuPlannerDisplay() {
  renderReactiveSurface();
}

export function isMenuPlannerHydrated() {
  return plannerShellReady && Boolean(state.programPackage?.program?.id);
}

export function persistMenuPlannerState() {
  persistPlannerToProgram({ immediate: true });
}

export async function bootMenuPlannerPage() {
  if (plannerShellReady) return;
  if (plannerBootPromise) {
    await plannerBootPromise;
    return;
  }

  plannerBootPromise = (async () => {
    let foodsLoadError = null;
    try {
      await loadFoodsCatalog({ force: true });
    } catch (err) {
      foodsLoadError = err;
      state.foods = Array.isArray(state.foods) ? state.foods : [];
      console.error(err);
    }

    await loadViews();
    const reactive = await loadReactiveViews();
    reactive.initReactivePlanner();
    views.initPlannerEngagementToggle();

    const { initPrintShop, openPrintShop } = await import(`./plannerPrint.js?v=${ASSET_VERSION}`);
    initPrintShop();
    document.getElementById('planner-print-open')?.addEventListener('click', openPrintShop);

    plannerShellReady = true;

    if (foodsLoadError) {
      reactive.showReactiveToast('Could not load foods. Refresh the page to try again.', {
        variant: 'error',
      });
    }
  })();

  try {
    await plannerBootPromise;
  } catch (err) {
    plannerBootPromise = null;
    throw err;
  }
}

window.addEventListener('beforeunload', () => {
  persistPlannerToProgram({ immediate: true });
});
