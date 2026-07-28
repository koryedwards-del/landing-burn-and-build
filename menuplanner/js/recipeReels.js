import { recipesForMealSlot } from '../data/recipeLibrary.js';

const REEL_CARD_HEIGHT = 88;
const spinningColumns = new Set();
const columnPicks = new Map();

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function allMealsForRecipeColumn(mealSlotId) {
  return recipesForMealSlot(mealSlotId);
}

function reelCardHtml(meal) {
  return `
    <div class="recipe-reel__card" data-recipe-id="${escapeHtml(meal.id)}">
      <span class="recipe-reel__card-emoji" aria-hidden="true">${escapeHtml(meal.emoji)}</span>
      <p class="recipe-reel__card-name">${escapeHtml(meal.name)}</p>
    </div>
  `;
}

function buildReelStripHtml(recipes) {
  if (!recipes.length) return '';
  let html = '';
  for (let repeat = 0; repeat < 12; repeat += 1) {
    recipes.forEach((recipe) => {
      html += reelCardHtml(recipe);
    });
  }
  return html;
}

function getStripY(strip) {
  const match = strip.style.transform.match(/translateY\((-?\d+\.?\d*)px\)/);
  return match ? parseFloat(match[1]) : 0;
}

function easeOut(t) {
  return 1 - (1 - t) ** 3;
}

function animateStripTo(strip, targetY, durationMs) {
  return new Promise((resolve) => {
    const startY = getStripY(strip);
    const startTime = performance.now();
    strip.classList.add('recipe-reel__strip--spinning');

    function frame(now) {
      const progress = Math.min(1, (now - startTime) / durationMs);
      const y = startY + (targetY - startY) * easeOut(progress);
      strip.style.transform = `translateY(${y}px)`;
      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        strip.classList.remove('recipe-reel__strip--spinning');
        resolve();
      }
    }

    requestAnimationFrame(frame);
  });
}

function winY(recipes, index) {
  const mid = 6 * recipes.length;
  return -((mid + index) * REEL_CARD_HEIGHT);
}

function spinDurationForSlot(mealSlotId) {
  if (mealSlotId === 'lunch') return 2000;
  if (mealSlotId === 'dinner') return 2200;
  return 1800;
}

function spinOvershootExtra(mealSlotId) {
  if (mealSlotId === 'lunch') return 5;
  if (mealSlotId === 'dinner') return 6;
  return 4;
}

export function refreshRecipeReelStrips() {
  document.querySelectorAll('[data-reel-strip]').forEach((strip) => {
    const slotId = strip.dataset.reelStrip;
    const recipes = allMealsForRecipeColumn(slotId);
    strip.innerHTML = buildReelStripHtml(recipes);
    strip.style.transform = 'translateY(0px)';

    if (!recipes.length) return;

    if (!columnPicks.has(slotId)) {
      columnPicks.set(slotId, recipes[0]);
    }

    const picked = columnPicks.get(slotId);
    let index = picked ? recipes.findIndex((recipe) => recipe.id === picked.id) : 0;
    if (index < 0) index = 0;
    columnPicks.set(slotId, recipes[index]);
    strip.style.transform = `translateY(${winY(recipes, index)}px)`;
  });
}

export async function spinRecipeColumn(mealSlotId) {
  const recipes = allMealsForRecipeColumn(mealSlotId);
  if (!recipes.length || spinningColumns.has(mealSlotId)) return null;

  const strip = document.querySelector(`[data-reel-strip="${mealSlotId}"]`);
  const button = document.querySelector(`[data-reel-spin="${mealSlotId}"]`);
  const column = document.querySelector(`.recipe-column[data-meal-slot="${mealSlotId}"]`);
  if (!strip || !button) return null;

  spinningColumns.add(mealSlotId);
  button.disabled = true;
  column?.classList.remove('recipe-column--won');

  const pickIndex = Math.floor(Math.random() * recipes.length);
  const targetY = winY(recipes, pickIndex);
  const overshootY = targetY - (REEL_CARD_HEIGHT * recipes.length * spinOvershootExtra(mealSlotId));

  await animateStripTo(strip, overshootY, spinDurationForSlot(mealSlotId));
  await animateStripTo(strip, targetY, 450);

  const picked = recipes[pickIndex];
  columnPicks.set(mealSlotId, picked);
  column?.classList.add('recipe-column--won');

  spinningColumns.delete(mealSlotId);
  button.disabled = false;
  return picked;
}

export function initRecipeReels() {
  const container = document.getElementById('recipe-cards');
  if (!container || container.dataset.reelsInit) return;
  container.dataset.reelsInit = '1';

  container.addEventListener('click', (event) => {
    const button = event.target.closest('[data-reel-spin]');
    if (!button || button.disabled) return;
    spinRecipeColumn(button.dataset.reelSpin).catch((err) => {
      console.error('Recipe reel spin failed:', err);
    });
  });
}

export function pickedMealForColumn(mealSlotId) {
  return columnPicks.get(mealSlotId) || null;
}
