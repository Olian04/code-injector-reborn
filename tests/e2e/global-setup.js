import { execSync } from 'node:child_process';
import { accessSync, constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const distManifest = path.join(root, 'dist', 'chrome', 'manifest.json');

/**
 * Rebuild dist/chrome before the suite so `npm run test:e2e` always loads a
 * fresh extension without requiring a separate build step.
 */
export default async function globalSetup() {
  console.log('[e2e] Building extension (chrome)…');
  execSync('npm run build:chrome', { cwd: root, stdio: 'inherit' });
  accessSync(distManifest, constants.R_OK);
  console.log('[e2e] Using extension at', path.join(root, 'dist', 'chrome'));
}
