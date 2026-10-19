import { server } from '@/test/msw/server';

// ─── App config: the runtime env normally comes from app.config.ts → expo.extra.env ───
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: { env: { APP_ENV: 'development', APP_NAME: 'Test App', VERSION: '1.0.0', API_URL: 'https://dummyjson.com' } },
    },
  },
}));

// ─── Native module mocks ─────────────────────────────────────────────────────────────
// MMKV v4 (Nitro) needs native code at import time → in-memory implementation per instance id.
jest.mock('react-native-mmkv', () => {
  const instances = new Map<string, Map<string, string | number | boolean>>();
  return {
    createMMKV: ({ id = 'default' }: { id?: string } = {}) => {
      if (!instances.has(id))
        instances.set(id, new Map());
      const data = instances.get(id)!;
      return {
        set: (key: string, value: string | number | boolean) => void data.set(key, value),
        getString: (key: string) => data.get(key) as string | undefined,
        getNumber: (key: string) => data.get(key) as number | undefined,
        getBoolean: (key: string) => data.get(key) as boolean | undefined,
        contains: (key: string) => data.has(key),
        remove: (key: string) => data.delete(key),
        getAllKeys: () => [...data.keys()],
        clearAll: () => data.clear(),
      };
    },
  };
});
// Reanimated 4: its own mock imports the real (native) entry point, which can't run in Node.
// A small explicit mock of the API surface the app uses — extend it when you use more.
jest.mock('react-native-reanimated', () => require('@/test/mocks/reanimated'));
jest.mock('react-native-worklets', () => ({ scheduleOnRN: (fn: (...args: unknown[]) => unknown, ...args: unknown[]) => fn(...args), scheduleOnUI: (fn: (...args: unknown[]) => unknown, ...args: unknown[]) => fn(...args) }));

// Toasts: sonner-native is UI-thread heavy; tests assert on these spies instead.
jest.mock('@/lib/toast', () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn(), warning: jest.fn(), promise: jest.fn((p: Promise<unknown>) => p), dismiss: jest.fn() },
}));

jest.mock('@react-native-community/netinfo', () => require('@react-native-community/netinfo/jest/netinfo-mock.js'));
jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'));

// In-memory keychain so token storage behaves like the real thing.
jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 0,
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => void store.set(key, value)),
    deleteItemAsync: jest.fn(async (key: string) => void store.delete(key)),
    __reset: () => store.clear(),
  };
});

// ─── Network: every test runs against MSW; unhandled requests fail loudly ─────────────
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
