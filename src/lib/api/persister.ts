import type { PersistQueryClientOptions } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

import { Env } from '@/lib/env';
import { queryCacheStorage } from '@/lib/storage/mmkv';

/**
 * Bump when cached data shapes change incompatibly (e.g. a schema change) — old caches
 * are then discarded on the next launch instead of being restored.
 */
const CACHE_VERSION = 1;

const DAY = 24 * 60 * 60 * 1000;

const persister = createSyncStoragePersister({
  storage: {
    getItem: key => queryCacheStorage.getString(key) ?? null,
    setItem: (key, value) => queryCacheStorage.set(key, value),
    removeItem: key => void queryCacheStorage.remove(key),
  },
  key: 'react-query',
  // Batch writes: at most one serialisation per second, off the hot path of each fetch.
  throttleTime: 1000,
});

/**
 * What survives an app restart (and therefore what's visible offline):
 * - only successful queries that opt in with `meta: { persist: true }` — keep it to what users
 *   need offline; everything else refetches as usual
 * - paused mutations (opt-in offline mutations queued while offline) so they resume after a restart
 * - nothing older than 24h (`maxAge`, must be ≤ QueryClient `gcTime`)
 * - nothing written by a different app version / CACHE_VERSION (`buster`)
 */
export const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  persister,
  maxAge: DAY,
  buster: `${Env.VERSION}-${CACHE_VERSION}`,
  dehydrateOptions: {
    shouldDehydrateQuery: query => query.state.status === 'success' && query.meta?.persist === true,
    shouldDehydrateMutation: mutation => mutation.state.isPaused,
  },
};

/** Removes the on-disk cache (sign-out). The in-memory cache is cleared separately. */
export function clearPersistedQueryCache() {
  queryCacheStorage.clearAll();
}
