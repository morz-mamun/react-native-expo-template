import type { ClientEnv } from './env-schema';
import Constants from 'expo-constants';

import { z } from 'zod';
import { clientEnvSchema } from './env-schema';

/**
 * Runtime environment, validated once at startup.
 * Source: `expo.extra.env`, written by `app.config.ts` from the root `env.ts`.
 */
function readEnv(): ClientEnv {
  const result = clientEnvSchema.safeParse(Constants.expoConfig?.extra?.env);
  if (!result.success) {
    throw new Error(`Invalid runtime env (expo.extra.env):\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

export const Env = readEnv();

export const isDev = Env.APP_ENV === 'development';
export const isProduction = Env.APP_ENV === 'production';
