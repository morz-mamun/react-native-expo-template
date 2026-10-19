import type { RenderOptions } from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createQueryClient } from '@/lib/api/query-client';

const SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

/**
 * A fresh QueryClient per test with the app's real defaults (meta toasts, typed errors) —
 * except no retries/delays, so failures surface immediately and tests stay fast.
 */
export function createTestQueryClient() {
  const client = createQueryClient();
  client.setDefaultOptions({
    queries: { ...client.getDefaultOptions().queries, retry: false, gcTime: Infinity },
    // gcTime Infinity → React Query schedules no garbage-collection timers, so Jest exits cleanly.
    mutations: { ...client.getDefaultOptions().mutations, retry: false, gcTime: Infinity },
  });
  return client;
}

type Options = Omit<RenderOptions, 'wrapper'> & { queryClient?: ReturnType<typeof createTestQueryClient> };

/** `render` + the providers screens need (React Query, safe area). Await it (RNTL 14 is async). */
export async function renderWithProviders(ui: React.ReactElement, { queryClient = createTestQueryClient(), ...options }: Options = {}) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </SafeAreaProvider>
    );
  }
  const result = await render(ui, { wrapper: Wrapper, ...options });
  return { ...result, queryClient };
}

export * from '@testing-library/react-native';
