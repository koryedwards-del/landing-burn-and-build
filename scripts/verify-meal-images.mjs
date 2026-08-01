#!/usr/bin/env node
/**
 * Audit meal idea images vs recipeLibrary template ids.
 * Run: npm run verify:meals
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mealImageFilename, MEAL_IMAGE_LEGACY } from '../menuplanner/data/recipeImages.js';
import { allMealTemplates } from '../menuplanner/data/recipeLibrary.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mealsDir = path.join(root, 'menuplanner/assets/meals');
const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp'];

function fileExists(baseName) {
  return IMAGE_EXT.some((ext) => fs.existsSync(path.join(mealsDir, baseName + ext)));
}

function resolveFilename(templateId) {
  const legacy = MEAL_IMAGE_LEGACY[templateId];
  if (legacy) {
    const ext = path.extname(legacy);
    const stem = path.basename(legacy, ext);
    for (const tryExt of IMAGE_EXT) {
      const candidate = stem + tryExt;
      if (fs.existsSync(path.join(mealsDir, candidate))) return candidate;
    }
    return legacy;
  }
  for (const ext of IMAGE_EXT) {
    const candidate = `${templateId}${ext}`;
    if (fs.existsSync(path.join(mealsDir, candidate))) return candidate;
  }
  return `${templateId}.jpg`;
}

const templates = allMealTemplates();
const onDisk = fs.readdirSync(mealsDir).filter((name) => IMAGE_EXT.includes(path.extname(name).toLowerCase()));
const usedFiles = new Set();
const missing = [];
const mapped = [];

for (const meal of templates) {
  const file = resolveFilename(meal.id);
  const exists = onDisk.includes(file) || fileExists(path.basename(file, path.extname(file)));
  if (exists && onDisk.includes(file)) {
    mapped.push({ id: meal.id, name: meal.name, file });
    usedFiles.add(file);
  } else {
    missing.push({ id: meal.id, name: meal.name, expected: mealImageFilename(meal.id) });
  }
}

const orphans = onDisk.filter((file) => file !== 'plate-fallback.jpg' && !usedFiles.has(file));

console.log(`Meal templates: ${templates.length}`);
console.log(`Image files on disk: ${onDisk.length}\n`);

console.log('Mapped:');
for (const row of mapped) {
  console.log(`  ✓ ${row.id}`);
  console.log(`      ${row.name}`);
  console.log(`      → ${row.file}`);
}

console.log('\nMissing (shows plate-fallback in UI):');
for (const row of missing) {
  console.log(`  ✗ ${row.id}`);
  console.log(`      ${row.name}`);
  console.log(`      → upload menuplanner/assets/meals/${row.expected}`);
}

if (orphans.length) {
  console.log('\nOrphan files (no meal card — safe to delete or remap):');
  for (const file of orphans) {
    console.log(`  ? ${file}`);
  }
}

if (missing.length) {
  process.exitCode = 1;
}
