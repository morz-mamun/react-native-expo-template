import type { AuthTokens } from '@/lib/auth/token-storage';
import axios from 'axios';

import { toApiError } from '@/lib/api/errors';
import { tokenStorage } from '@/lib/auth/token-storage';
import { Env } from '@/lib/env';

/**
 * Bare HTTP client for the refresh call. It deliberately has NO interceptors: a refresh that
 * itself returned 401 must never trigger another refresh (infinite loop).
 */
export const refreshClient = axios.create({
  baseURL: Env.API_URL,
  timeout: 15_000,
  headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
});

/** Backend-specific: exchange a refresh token for new tokens. Provided by `features/auth/api.ts`. */
export type RefreshRequest = (refreshToken: string) => Promise<AuthTokens>;

let inFlight: Promise<string | null> | null = null;

/**
 * Returns a single-flight refresher: however many requests hit 401 at the same moment, exactly
 * ONE refresh request is made and every caller awaits the same result.
 *
 * Resolves:
 * - the new access token → callers retry their request
 * - `null` → the session is over (no refresh token, or the server rejected it) → sign out
 * Rejects (session kept): offline, timeout or a 5xx while refreshing — a flaky network must not
 * log the user out. The original request fails with that network/server error instead.
 */
export function createTokenRefresher(refreshRequest: RefreshRequest) {
  async function run(): Promise<string | null> {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken)
      return null;

    try {
      const tokens = await refreshRequest(refreshToken);
      await tokenStorage.save(tokens);
      return tokens.accessToken;
    }
    catch (error) {
      const apiError = toApiError(error);
      if (apiError.isNetworkError || apiError.kind === 'server')
        throw apiError;
      return null; // 400/401/403: refresh token invalid, expired or revoked
    }
  }

  return function refreshAccessToken(): Promise<string | null> {
    inFlight ??= run().finally(() => {
      inFlight = null;
    });
    return inFlight;
  };
}
