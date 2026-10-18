import type { StateStorage } from 'zustand/middleware';
import { createJSONStorage } from 'zustand/middleware';

import { appStorage } from './mmkv';

/**
 * Zustand `persist` storage backed by MMKV. MMKV is synchronous, so persisted stores
 * hydrate during store creation — values are ready before the first render (no flash).
 */
const mmkvStateStorage: StateStorage = {
  getItem: name => appStorage.getString(name) ?? null,
  setItem: (name, value) => appStorage.set(name, value),
  removeItem: name => void appStorage.remove(name),
};

export const zustandMMKVStorage = createJSONStorage(() => mmkvStateStorage);
