/**
 * Build-time environment configuration. Imported ONLY by `app.config.ts` (runs in Node).
 *
 * - `APP_ENV` (development | preview | production) selects `env/<APP_ENV>.env`.
 * - Precedence: shell / EAS env  >  env/local.env (git-ignored)  >  env/<APP_ENV>.env
 * - The `client` part is validated here and embedded into `expo.extra.env`;
 *   the app reads it at runtime through `@/lib/env`.
 *
 * Env files live in `env/` (not the project root) on purpose: Expo CLI auto-loads root
 * `.env*` files based on NODE_ENV, which would silently mix environments.
 */

import type { AppEnv } from './src/lib/env-schema';
import { resolve } from 'node:path';
import { config as loadDotenv } from 'dotenv';

import { z } from 'zod';
import packageJson from './package.json';
import { APP_ENVS, clientEnvSchema } from './src/lib/env-schema';

// ─── CUSTOMIZE: app identity (rename these when starting a new project) ─────────────
const APP = {
  name: 'Expo Template',
  slug: 'react-native-expo-template',
  /** Reverse-DNS id. Non-production envs get a `.development` / `.preview` suffix. */
  bundleId: 'com.example.expotemplate',
  scheme: 'expotemplate',
} as const;
// ──────────────────────────────────────────────────────────────────────────────────────

const appEnvResult = z.enum(APP_ENVS).safeParse(process.env.APP_ENV ?? 'development');
if (!appEnvResult.success) {
  throw new Error(`❌ APP_ENV must be one of: ${APP_ENVS.join(', ')} (got "${process.env.APP_ENV}")`);
}
const APP_ENV: AppEnv = appEnvResult.data;

// dotenv never overrides already-set variables, so load the highest-priority file first.
loadDotenv({ path: resolve(__dirname, 'env/local.env'), quiet: true });
loadDotenv({ path: resolve(__dirname, `env/${APP_ENV}.env`), quiet: true });

/**
 * Strict mode = we are producing a real binary (EAS Build or local prebuild).
 * Store-bound settings (EAS project id) are only required then, so a fresh clone
 * can `pnpm start` without an Expo account.
 */
const STRICT = process.env.STRICT_ENV_VALIDATION === '1' || process.env.EAS_BUILD === 'true';

const buildEnvSchema = z
  .object({
    client: clientEnvSchema,
    bundleId: z.string().regex(/^[a-z]\w*(\.[a-z]\w*)+$/i, 'Invalid bundle identifier'),
    scheme: z.string().regex(/^[a-z][a-z0-9+.-]*$/, 'Scheme must be lowercase URL-safe'),
    easProjectId: z.uuid().optional(),
    expoOwner: z.string().min(1).optional(),
  })
  .superRefine((env, ctx) => {
    if (STRICT && env.client.APP_ENV !== 'development' && !env.easProjectId) {
      ctx.addIssue({
        code: 'custom',
        path: ['easProjectId'],
        message: `EAS_PROJECT_ID is required for ${env.client.APP_ENV} builds (run \`eas init\`, then set it in env/${APP_ENV}.env)`,
      });
    }
  });

const suffix = APP_ENV === 'production' ? '' : `.${APP_ENV}`;
const nameSuffix = { development: ' (Dev)', preview: ' (Preview)', production: '' }[APP_ENV];

const parsed = buildEnvSchema.safeParse({
  client: {
    APP_ENV,
    APP_NAME: `${APP.name}${nameSuffix}`,
    VERSION: packageJson.version,
    API_URL: process.env.API_URL,
  },
  bundleId: `${APP.bundleId}${suffix}`,
  scheme: `${APP.scheme}${APP_ENV === 'production' ? '' : `-${APP_ENV}`}`,
  easProjectId: process.env.EAS_PROJECT_ID || undefined,
  expoOwner: process.env.EXPO_OWNER || undefined,
});

if (!parsed.success) {
  throw new Error(
    `\n❌ Invalid environment configuration for APP_ENV=${APP_ENV}:\n${z.prettifyError(parsed.error)}\n`
    + `💡 Check env/${APP_ENV}.env (or env/local.env), then restart with \`--clear\`.\n`,
  );
}

export const Env = {
  ...parsed.data,
  APP_ENV,
  app: APP,
  isProduction: APP_ENV === 'production',
} as const;
