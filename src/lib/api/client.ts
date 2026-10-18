import type { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';

import { toApiError } from '@/lib/api/errors';
import { Env } from '@/lib/env';

/**
 * Auth hooks the client calls, registered by the auth layer at startup (`configureApiAuth`).
 * The client never imports the auth store → no circular dependency.
 */
export type ApiAuthHandlers = {
  /** Current access token (sync, in-memory). */
  getAccessToken: () => string | null | undefined;
  /** Single-flight token refresh. Resolves the new access token, or null if the session is over. */
  refreshAccessToken: () => Promise<string | null>;
  /** Called when a 401 can't be recovered (refresh failed) → sign out. */
  onSessionExpired: () => void;
};

let authHandlers: ApiAuthHandlers | null = null;

export function configureApiAuth(handlers: ApiAuthHandlers | null) {
  authHandlers = handlers;
}

/** Endpoints that must never trigger a refresh-and-retry (they ARE the auth flow). */
const AUTH_ENDPOINTS = ['auth/login', 'auth/refresh'];

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

/**
 * The single HTTP client. All requests go through it:
 * base URL per environment, 15s timeout, JSON, bearer token, 401 → refresh → retry once,
 * and every error normalised to `ApiError`.
 */
export const apiClient = axios.create({
  baseURL: Env.API_URL,
  timeout: 15_000,
  headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = authHandlers?.getAccessToken();
  if (token)
    config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(undefined, async (error) => {
  const config = error?.config as RetriableConfig | undefined;
  const isAuthEndpoint = AUTH_ENDPOINTS.some(path => config?.url?.includes(path));

  if (error?.response?.status === 401 && config && !config._retried && !isAuthEndpoint && authHandlers) {
    config._retried = true;
    // Sent with an old token that another request already refreshed → just retry with the new one.
    const current = authHandlers.getAccessToken();
    const sentWith = String(config.headers.Authorization ?? '').replace(/^Bearer /, '');
    const token = current && current !== sentWith ? current : await authHandlers.refreshAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      return apiClient(config);
    }
    authHandlers.onSessionExpired();
  }

  throw toApiError(error);
});

/**
 * Typed helpers returning the response body. Pass `signal` from React Query so requests are
 * cancelled when a query is no longer needed.
 */
export const http = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig) => apiClient.get<T>(url, config).then(r => r.data),
  post: <T = unknown>(url: string, body?: unknown, config?: AxiosRequestConfig) => apiClient.post<T>(url, body, config).then(r => r.data),
  put: <T = unknown>(url: string, body?: unknown, config?: AxiosRequestConfig) => apiClient.put<T>(url, body, config).then(r => r.data),
  patch: <T = unknown>(url: string, body?: unknown, config?: AxiosRequestConfig) => apiClient.patch<T>(url, body, config).then(r => r.data),
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig) => apiClient.delete<T>(url, config).then(r => r.data),
};
