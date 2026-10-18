import type { AppStateStatus } from 'react-native';
import { useReactQueryDevTools } from '@dev-plugins/react-query';
import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager, QueryClientProvider } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

import { queryClient } from '@/lib/api/query-client';

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

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Dev only (no-op in production): press `shift+m` in the Expo CLI → "@dev-plugins/react-query"
  // to inspect queries, cache contents and refetch/invalidate from your browser.
  useReactQueryDevTools(queryClient);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
