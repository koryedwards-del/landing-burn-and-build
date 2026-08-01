#!/usr/bin/env node
/**
 * Audit 8-Week Transformation meal prep images.
 * Run: npm run verify:meals
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mealImageFilename } from '../menuplanner/data/recipeImages.js';
import { transformationMealTemplates } from '../menuplanner/data/transformationMealLibrary.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mealsDir = path.join(root, 'menuplanner/assets/meals');
const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp'];

function fileExists(baseName) {
  return IMAGE_EXT.some((ext) => fs.existsSync(path.join(mealsDir, baseName + ext)));
}

function resolveFilename(templateId) {
  for (const ext of IMAGE_EXT) {
    const candidate = `${templateId}${ext}`;
    if (fs.existsSync(path.join(mealsDir, candidate))) return candidate;
  }
  return mealImageFilename(templateId);
}

const templates = transformationMealTemplates();
const onDisk = fs.readdirSync(mealsDir).filter((name) => IMAGE_EXT.includes(path.extname(name).toLowerCase()));
const usedFiles = new Set();
const missing = [];
const mapped = [];

for (const meal of templates) {
  const file = resolveFilename(meal.id);
  if (onDisk.includes(file)) {
    mapped.push({ id: meal.id, name: meal.name, file });
    usedFiles.add(file);
  } else {
    missing.push({ id: meal.id, name: meal.name, expected: `${meal.id}.jpg` });
  }
}

const orphans = onDisk.filter((file) => file !== 'plate-fallback.jpg' && !usedFiles.has(file));

console.log(`8-Week Transformation meals: ${templates.length}`);
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
  console.log('\nOrphan files (legacy — safe to delete once new images are uploaded):');
  for (const file of orphans) {
    console.log(`  ? ${file}`);
  }
}

if (missing.length) {
  process.exitCode = 1;
}
