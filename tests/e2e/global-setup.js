import { execSync } from 'node:child_process';
import { accessSync, constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const BUILDS = {
  chromium: { script: 'build:chrome', dist: 'chrome' },
  firefox: { script: 'build:firefox', dist: 'firefox' },
};

/**
 * Rebuild the bundles the selected projects need, so `npm run test:e2e` always
 * installs a fresh extension without requiring a separate build step.
 *
 * @param {import('@playwright/test').FullConfig} config
 */
export default async function globalSetup(config) {
  const targets = new Set(
    config.projects.map((project) => project.use?.target ?? 'chromium')
  );

  for (const target of targets) {
    const build = BUILDS[target];
    if (!build) throw new Error(`Unknown e2e target: ${target}`);

    console.log(`[e2e] Building extension (${target})…`);
    execSync(`npm run ${build.script}`, { cwd: root, stdio: 'inherit' });

    const dist = path.join(root, 'dist', build.dist);
    accessSync(path.join(dist, 'manifest.json'), constants.R_OK);
    console.log('[e2e] Using extension at', dist);
  }
}
