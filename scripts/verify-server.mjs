#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';

const entry = 'server/index.js';

execSync(`node --check ${entry}`, { stdio: 'inherit' });

const src = fs.readFileSync(entry, 'utf8');
const lines = src.split('\n');
const issues = [];

for (let i = 0; i < lines.length; i++) {
  if (!lines[i].match(/app\.(get|post|put|patch|delete)\(/)) continue;

  let j = i;
  let header = lines[i];
  while (!header.includes('=>') && j + 1 < lines.length) {
    j += 1;
    header += `\n${lines[j]}`;
  }

  const isAsync = /async\s*\(/.test(header);
  let body = '';
  for (let k = i + 1; k < lines.length; k++) {
    if (lines[k].match(/^app\.(get|post|put|patch|delete)\(/)) break;
    body += `${lines[k]}\n`;
    if (lines[k].trim() === '});') break;
  }

  if (body.includes('await ') && !isAsync) {
    issues.push(`Line ${i + 1}: await used in non-async route handler`);
  }
}

if (issues.length) {
  console.error('Server route verification failed:\n' + issues.join('\n'));
  process.exit(1);
}

console.log('Server verification OK:', entry);
