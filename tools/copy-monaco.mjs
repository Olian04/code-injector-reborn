#!/usr/bin/env node
/**
 * Copy a trimmed Monaco AMD build into public/ so MV3 can load workers from
 * chrome-extension:// origins (blob: workers are blocked by CSP).
 *
 * Only JavaScript, CSS, and HTML are used by the popup editors — skip the rest
 * of basic-languages, TypeScript/JSON language services, and locale packs.
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'node_modules', 'monaco-editor', 'min', 'vs');
const dest = path.join(root, 'public', 'monaco', 'vs');

/** basic-languages folders required for our three editors. */
const BASIC_LANGUAGES = new Set(['javascript', 'typescript', 'css', 'html']);

/** Rich language services (workers). Omit json — unused by the popup editors. */
const LANGUAGE_SERVICES = new Set(['css', 'html', 'typescript']);

function copyFile(from, to) {
  mkdirSync(path.dirname(to), { recursive: true });
  cpSync(from, to);
}

function copyDir(from, to) {
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

function bytes(dir) {
  if (!existsSync(dir)) return 0;
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    total += entry.isDirectory() ? bytes(full) : statSync(full).size;
  }
  return total;
}

function formatMb(n) {
  return (n / (1024 * 1024)).toFixed(2) + ' MB';
}

if (!existsSync(src)) {
  console.warn('[copy-monaco] monaco-editor not installed yet; skipping');
  process.exit(0);
}

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });

// Core AMD runtime + editor bundle
copyFile(path.join(src, 'loader.js'), path.join(dest, 'loader.js'));
copyDir(path.join(src, 'editor'), path.join(dest, 'editor'));
copyDir(path.join(src, 'base'), path.join(dest, 'base'));

// Syntax highlighters only for the languages we edit
const basicSrc = path.join(src, 'basic-languages');
const basicDest = path.join(dest, 'basic-languages');
mkdirSync(basicDest, { recursive: true });
for (const name of readdirSync(basicSrc)) {
  if (!BASIC_LANGUAGES.has(name)) continue;
  copyDir(path.join(basicSrc, name), path.join(basicDest, name));
}

// Optional language-service workers for CSS/HTML (small). Omit TS/JSON.
const langSrc = path.join(src, 'language');
const langDest = path.join(dest, 'language');
if (existsSync(langSrc)) {
  mkdirSync(langDest, { recursive: true });
  for (const name of readdirSync(langSrc)) {
    if (!LANGUAGE_SERVICES.has(name)) continue;
    copyDir(path.join(langSrc, name), path.join(langDest, name));
  }
}

const fullSize = bytes(src);
const keptSize = bytes(dest);
console.log(
  `[copy-monaco] trimmed monaco vs → public/monaco/vs (${formatMb(keptSize)} kept of ${formatMb(fullSize)}; languages: ${[...BASIC_LANGUAGES].join(', ')})`
);
