import * as Updates from 'expo-updates';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { toast } from '@/lib/toast';

/** Don't hit the update server more than once per this interval. */
const CHECK_INTERVAL_MS = 15 * 60 * 1000;
/**
 * `true`: when an update has downloaded, offer "Restart" in a toast.
 * `false`: apply silently on the next cold start (least disruptive).
 */
const PROMPT_TO_RESTART = true;

let lastCheck = 0;

async function checkAndFetch() {
  if (Date.now() - lastCheck < CHECK_INTERVAL_MS)
    return;
  lastCheck = Date.now();

  try {
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable)
      return;
    const result = await Updates.fetchUpdateAsync();
    if (result.isNew && PROMPT_TO_RESTART) {
      toast.info('Update ready', {
        description: 'Restart to get the latest version.',
        duration: 10_000,
        action: { label: 'Restart', onPress: () => void Updates.reloadAsync() },
      });
    }
  }
  catch {
    // Offline / server unavailable — try again on the next foreground.
  }
}

/**
 * Over-the-air updates (EAS Update). The native layer already checks on launch
 * (`updates.checkAutomatically: 'ON_LOAD'`, never blocking startup) and applies downloads on
 * the next cold start. This hook adds a throttled check whenever the app returns to the
 * foreground, so long-running sessions also get fixes, plus an optional restart prompt.
 *
 * No-op in development and in builds without updates configured (no EAS project id).
 */
export function useAppUpdates() {
  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled)
      return;

    void checkAndFetch();
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active')
        void checkAndFetch();
    });
    return () => subscription.remove();
  }, []);
}

/** Build/update identity, for "About" screens and bug reports. */
export function getUpdateInfo() {
  return {
    channel: Updates.channel ?? 'none',
    runtimeVersion: Updates.runtimeVersion ?? 'n/a',
    updateId: Updates.isEmbeddedLaunch ? 'embedded' : (Updates.updateId?.slice(0, 8) ?? 'n/a'),
    publishedAt: Updates.isEmbeddedLaunch ? null : Updates.createdAt,
  };
}
