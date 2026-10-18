import { z } from 'zod';

/**
 * Shared between build time (`env.ts` → `app.config.ts`) and runtime (`@/lib/env`).
 * Keep this file dependency-free (zod only) — it is bundled into the app.
 */
export const APP_ENVS = ['development', 'preview', 'production'] as const;
export type AppEnv = (typeof APP_ENVS)[number];

/** Values the app can read at runtime. Never put secrets here — they ship in the bundle. */
export const clientEnvSchema = z.object({
  APP_ENV: z.enum(APP_ENVS),
  APP_NAME: z.string().min(1),
  VERSION: z.string().min(1),
  API_URL: z.url({ error: 'API_URL must be a full URL, e.g. https://api.example.com' }),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
