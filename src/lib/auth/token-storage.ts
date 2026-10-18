import * as SecureStore from 'expo-secure-store';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

const ACCESS_KEY = 'auth.accessToken';
const REFRESH_KEY = 'auth.refreshToken';

/**
 * Keychain (iOS) / Keystore-encrypted storage (Android). `AFTER_FIRST_UNLOCK` keeps tokens
 * readable for background work after the first unlock, and never syncs them to other devices.
 */
const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

/** In-memory copy: request interceptors read tokens synchronously, with no keychain I/O per request. */
let memory: AuthTokens | null = null;

/**
 * Where credentials live. Tokens are NEVER written to MMKV, AsyncStorage or logs.
 * `load()` runs once at startup; everything after that reads from memory.
 */
export const tokenStorage = {
  async load(): Promise<AuthTokens | null> {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_KEY, OPTIONS),
      SecureStore.getItemAsync(REFRESH_KEY, OPTIONS),
    ]);
    memory = accessToken && refreshToken ? { accessToken, refreshToken } : null;
    return memory;
  },

  async save(tokens: AuthTokens): Promise<void> {
    memory = tokens;
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken, OPTIONS),
      SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken, OPTIONS),
    ]);
  },

  async clear(): Promise<void> {
    memory = null;
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY, OPTIONS),
      SecureStore.deleteItemAsync(REFRESH_KEY, OPTIONS),
    ]);
  },

  getAccessToken: (): string | null => memory?.accessToken ?? null,
  getRefreshToken: (): string | null => memory?.refreshToken ?? null,

  /** Dev tooling only: replace the in-memory access token so the next request gets a 401. */
  debugInvalidateAccessToken() {
    if (memory)
      memory = { ...memory, accessToken: 'invalid-access-token' };
  },
  /** Dev tooling only: break the refresh token so the next refresh fails (→ forced sign-out). */
  debugInvalidateRefreshToken() {
    if (memory)
      memory = { accessToken: 'invalid-access-token', refreshToken: 'invalid-refresh-token' };
  },
};
