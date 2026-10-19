import type { MMKV } from 'react-native-mmkv';
import { createMMKV } from 'react-native-mmkv';

/**
 * Fast synchronous key-value storage (MMKV v4, Nitro).
 *
 * - `appStorage`: preferences and small app state (theme, first launch, flags).
 * - Never store credentials here — tokens go to the platform keychain (`expo-secure-store`).
 * - Separate instances can be wiped independently (e.g. the query cache on logout).
 */
export const appStorage: MMKV = createMMKV({ id: 'app' });

/** Persisted React Query cache (offline support). Wiped wholesale on sign-out. */
export const queryCacheStorage: MMKV = createMMKV({ id: 'query-cache' });

/** Every key used with `appStorage`, in one place, to avoid typos and collisions. */
export const StorageKeys = {
  isFirstLaunch: 'app.isFirstLaunch',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];

/** Reads a JSON value; returns `undefined` if missing or unparsable (never throws). */
export function getJSON<T>(key: StorageKey, storage: MMKV = appStorage): T | undefined {
  const raw = storage.getString(key);
  if (raw === undefined)
    return undefined;
  try {
    return JSON.parse(raw) as T;
  }
  catch {
    storage.remove(key);
    return undefined;
  }
}

export function setJSON<T>(key: StorageKey, value: T, storage: MMKV = appStorage): void {
  storage.set(key, JSON.stringify(value));
}
