import type { LoginInput, User } from '@/features/auth/types';
import type { AuthTokens } from '@/lib/auth/token-storage';

import { loginResponseSchema, tokensSchema, userSchema } from '@/features/auth/types';
import { http } from '@/lib/api/client';
import { parseResponse } from '@/lib/api/parse-response';
import { refreshClient } from '@/lib/auth/refresh';

/**
 * Auth endpoints — the ONLY file to change for a different backend contract.
 * dummyjson: POST auth/login, POST auth/refresh (rotates both tokens), GET auth/me, no logout.
 * All responses are validated strictly: this is the trust boundary of the app.
 */

/** Access-token lifetime requested from the demo API. Real backends decide this server-side. */
const TOKEN_TTL_MINUTES = 30;

export async function login(input: LoginInput): Promise<{ tokens: AuthTokens; user: User }> {
  const data = parseResponse(loginResponseSchema, await http.post('auth/login', { ...input, expiresInMins: TOKEN_TTL_MINUTES }));
  const { accessToken, refreshToken, ...user } = data;
  return { tokens: { accessToken, refreshToken }, user: userSchema.parse(user) };
}

/** Uses the bare `refreshClient` (no interceptors) — see lib/auth/refresh.ts. */
export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  const { data } = await refreshClient.post('auth/refresh', { refreshToken, expiresInMins: TOKEN_TTL_MINUTES });
  return parseResponse(tokensSchema, data);
}

export async function fetchCurrentUser(signal?: AbortSignal): Promise<User> {
  return parseResponse(userSchema, await http.get('auth/me', { signal }));
}

/**
 * Tell the backend to revoke the refresh token. dummyjson has no logout endpoint, so this is a
 * no-op here; with a real backend, uncomment the request. Always best-effort: sign-out must
 * succeed locally even when offline.
 */
export async function logoutRequest(_refreshToken: string | null): Promise<void> {
  // await http.post('auth/logout', { refreshToken: _refreshToken });
}
