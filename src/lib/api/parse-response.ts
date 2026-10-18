import type { z } from 'zod';

import { ApiError } from '@/lib/api/errors';
import { Env } from '@/lib/env';

type ParseOptions = {
  /**
   * `true` (default): always validate. Use for trust boundaries — auth/session, anything
   * persisted, anything a form submits.
   * `false`: validate in development/preview/tests only; in production just cast. Use for large
   * list payloads where per-item validation costs CPU on low-end Android.
   */
  strict?: boolean;
};

/**
 * Validates a response body against a Zod schema. Invalid data becomes an `ApiError`
 * (kind `parse`) instead of crashing a screen later with `undefined is not an object`.
 */
export function parseResponse<S extends z.ZodType>(schema: S, data: unknown, { strict = true }: ParseOptions = {}): z.infer<S> {
  if (!strict && Env.APP_ENV === 'production')
    return data as z.infer<S>;

  const result = schema.safeParse(data);
  if (!result.success) {
    if (__DEV__)
      console.warn('[parseResponse] Response does not match schema:', result.error.issues);
    throw new ApiError({ kind: 'parse', cause: result.error });
  }
  return result.data;
}
