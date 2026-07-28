import { state, savedMealFitsMealSlot } from './plannerState.js';
import { RECIPE_COLUMN_ORDER, recipeImageUrl } from '../data/recipeImages.js';

const REEL_CARD_HEIGHT = 136;
const spinningColumns = new Set();
const columnPicks = new Map();

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function mealsByPopularity() {
  return [...state.savedMeals].sort((a, b) => b.pickCount - a.pickCount);
}

export function allMealsForRecipeColumn(mealSlotId) {
  const byId = new Map(state.savedMeals.map((meal) => [meal.id, meal]));
  const preferredIds = RECIPE_COLUMN_ORDER[mealSlotId] || [];
  const ordered = preferredIds.map((id) => byId.get(id)).filter(Boolean);
  const seen = new Set(ordered.map((meal) => meal.id));

  const extras = mealsByPopularity()
    .filter((meal) => savedMealFitsMealSlot(meal, mealSlotId) && !seen.has(meal.id));
  return [...ordered, ...extras];
}

function mealIngredientNames(meal) {
  return (meal.items || [])
    .map((item) => item.foodName)
    .filter(Boolean);
}

function reelCardHtml(meal) {
  const imgUrl = recipeImageUrl(meal.id);
  const ingredientsHtml = mealIngredientNames(meal)
    .map((name) => `<li class="recipe-reel__card-ingredient">${escapeHtml(name)}</li>`)
    .join('');

  return `
    <div class="recipe-reel__card" data-meal-id="${escapeHtml(meal.id)}">
      <div class="recipe-reel__card-media">
        <img class="recipe-reel__card-img" src="${escapeHtml(imgUrl)}" alt="" loading="lazy" decoding="async" />
      </div>
      <div class="recipe-reel__card-body">
        <p class="recipe-reel__card-name">${escapeHtml(meal.name)}</p>
        <ul class="recipe-reel__card-ingredients">${ingredientsHtml}</ul>
      </div>
    </div>
  `;
}

function buildReelStripHtml(meals) {
  if (!meals.length) return '';
  let html = '';
  for (let repeat = 0; repeat < 12; repeat += 1) {
    meals.forEach((meal) => {
      html += reelCardHtml(meal);
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

function winY(meals, index) {
  const mid = 6 * meals.length;
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
    const meals = allMealsForRecipeColumn(slotId);
    strip.innerHTML = buildReelStripHtml(meals);
    strip.style.transform = 'translateY(0px)';

    if (!meals.length) return;

    if (!columnPicks.has(slotId)) {
      columnPicks.set(slotId, meals[0]);
    }

    const picked = columnPicks.get(slotId);
    let index = picked ? meals.findIndex((meal) => meal.id === picked.id) : 0;
    if (index < 0) index = 0;
    strip.style.transform = `translateY(${winY(meals, index)}px)`;
  });
}

export async function spinRecipeColumn(mealSlotId) {
  const meals = allMealsForRecipeColumn(mealSlotId);
  if (!meals.length || spinningColumns.has(mealSlotId)) return null;

  const strip = document.querySelector(`[data-reel-strip="${mealSlotId}"]`);
  const button = document.querySelector(`[data-reel-spin="${mealSlotId}"]`);
  const column = document.querySelector(`.recipe-column[data-meal-slot="${mealSlotId}"]`);
  if (!strip || !button) return null;

  spinningColumns.add(mealSlotId);
  button.disabled = true;
  column?.classList.remove('recipe-column--won');

  const pickIndex = Math.floor(Math.random() * meals.length);
  const targetY = winY(meals, pickIndex);
  const overshootY = targetY - (REEL_CARD_HEIGHT * meals.length * spinOvershootExtra(mealSlotId));

  await animateStripTo(strip, overshootY, spinDurationForSlot(mealSlotId));
  await animateStripTo(strip, targetY, 450);

  const picked = meals[pickIndex];
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
