import { Appearance } from 'react-native';
import { Uniwind } from 'uniwind';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandMMKVStorage } from '@/lib/storage/zustand-storage';

export type ThemePreference = 'light' | 'dark' | 'system';

type PreferencesState = {
  theme: ThemePreference;
  hapticsEnabled: boolean;
  setTheme: (theme: ThemePreference) => void;
  setHapticsEnabled: (enabled: boolean) => void;
};

/**
 * Applies a theme preference everywhere at once:
 * - Uniwind → `dark:` variants and CSS tokens.
 * - Appearance override → native UI (tabs, headers, alerts, Switch, keyboard, `useColorScheme`,
 *   status bar `style="auto"`) matches the app, not just the OS.
 */
export function applyTheme(theme: ThemePreference) {
  Appearance.setColorScheme(theme === 'system' ? 'auto' : theme);
  Uniwind.setTheme(theme);
}

/** User preferences, persisted to MMKV (synchronous → hydrated before first render). */
export const usePreferences = create<PreferencesState>()(
  persist(
    set => ({
      theme: 'system',
      hapticsEnabled: true,
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      setHapticsEnabled: hapticsEnabled => set({ hapticsEnabled }),
    }),
    {
      name: 'preferences',
      version: 1,
      storage: zustandMMKVStorage,
      partialize: ({ theme, hapticsEnabled }) => ({ theme, hapticsEnabled }),
    },
  ),
);

// Apply the persisted theme at import time, before the first frame renders.
applyTheme(usePreferences.getState().theme);
