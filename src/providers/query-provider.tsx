import type { AppStateStatus } from 'react-native';
import { useReactQueryDevTools } from '@dev-plugins/react-query';
import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { AppState, Platform } from 'react-native';

import { persistOptions } from '@/lib/api/persister';
import { queryClient } from '@/lib/api/query-client';
// Mutation defaults must be registered BEFORE the cache is restored, so paused (offline)
// mutations restored from disk know which function to run when they resume.
import '@/features/posts/mutation-defaults';

// React Query was built for browsers. Teach it React Native's equivalents, once, at startup:

// "Window focus" = app comes back to the foreground → stale queries on screen refetch.
focusManager.setEventListener((setFocused) => {
  const subscription = AppState.addEventListener('change', (status: AppStateStatus) => {
    if (Platform.OS !== 'web')
      setFocused(status === 'active');
  });
  return () => subscription.remove();
});

// "Online" = NetInfo connectivity → queries pause while offline and resume/refetch on reconnect.
onlineManager.setEventListener(setOnline =>
  NetInfo.addEventListener((state) => {
    setOnline(state.isConnected !== false);
  }),
);

/**
 * React Query + on-device persistence. Opted-in queries (`meta.persist`) are restored from MMKV
 * on launch — the splash screen waits for that (see useAppReady) — so previously viewed data
 * shows instantly, even offline. Paused mutations are resumed once restore finishes.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Dev only (no-op in production): press `shift+m` in the Expo CLI → "@dev-plugins/react-query"
  // to inspect queries, cache contents and refetch/invalidate from your browser.
  useReactQueryDevTools(queryClient);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}
      onSuccess={() => void queryClient.resumePausedMutations()}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
