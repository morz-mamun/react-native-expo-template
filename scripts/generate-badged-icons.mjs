#!/usr/bin/env node
/**
 * Generates badged launcher icons for non-production builds:
 *
 *   pnpm icons:badge
 *
 * Writes assets/icon-<env>.png and assets/android-icon-foreground-<env>.png, which
 * app.config.ts picks per APP_ENV. Commit the output.
 * Re-run after changing the base icons or package.json `version` (shown on the ribbon).
 *
 * Why a script and not the app-icon-badge config plugin: the plugin writes its PNGs without
 * awaiting them while the Android icon step is already reading them, which breaks EAS builds.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { addBadge } from 'app-icon-badge';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENVS = ['development', 'preview'];
const { version } = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

function badgesFor(env) {
  return [
    { text: env, type: 'banner', color: 'white' },
    { text: version, type: 'ribbon', color: 'white' },
  ];
}

for (const env of ENVS) {
  const badges = badgesFor(env);
  await addBadge({
    icon: join(ROOT, 'assets/icon.png'),
    dstPath: join(ROOT, `assets/icon-${env}.png`),
    badges,
  });
  await addBadge({
    icon: join(ROOT, 'assets/android-icon-foreground.png'),
    dstPath: join(ROOT, `assets/android-icon-foreground-${env}.png`),
    badges,
    isAdaptiveIcon: true,
  });
  console.log(`• ${env}: assets/icon-${env}.png, assets/android-icon-foreground-${env}.png`);
}
// addBadge does not await its own file write; Node stays alive until pending writes finish.
