import type { LoginInput, User } from '@/features/auth/types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { fetchCurrentUser, login, logoutRequest, refreshTokens } from '@/features/auth/api';
import { configureApiAuth } from '@/lib/api/client';
import { createTokenRefresher } from '@/lib/auth/refresh';
import { tokenStorage } from '@/lib/auth/token-storage';
import { clearUserData } from '@/lib/session/clear-user-data';
import { zustandMMKVStorage } from '@/lib/storage/zustand-storage';
import { toast } from '@/lib/toast';

/**
 * - `idle`: not hydrated yet (splash screen still visible)
 * - `signedIn` / `signedOut`: drives `Stack.Protected` route gating in the root layout
 */
export type SessionStatus = 'idle' | 'signedIn' | 'signedOut';

type SessionState = {
  status: SessionStatus;
  /** Cached profile (persisted, non-secret) so the UI has a name/avatar on cold start. */
  user: User | null;
  /** Restore the session from secure storage. Safe to call repeatedly; runs once. */
  hydrate: () => Promise<void>;
  /** Throws `ApiError` on failure (e.g. invalid credentials) — the login screen shows it. */
  signIn: (input: LoginInput) => Promise<void>;
  /** Clears tokens + all user data and routes to login. `expired` shows a "session expired" toast. */
  signOut: (options?: { expired?: boolean }) => Promise<void>;
  /** Re-fetch the profile (`GET auth/me`). */
  refreshUser: () => Promise<void>;
};

let hydration: Promise<void> | null = null;

/**
 * The app's session — the one piece of auth state the UI reads.
 * Lives in features/auth but is the public API other features use for "who is signed in".
 */
export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      status: 'idle',
      user: null,

      hydrate: () => {
        hydration ??= (async () => {
          const tokens = await tokenStorage.load().catch(() => null);
          if (!tokens) {
            set({ status: 'signedOut', user: null });
            return;
          }
          // Optimistic: tokens exist → signed in now, profile refreshes in the background.
          // If the tokens turn out to be dead, the client's refresh flow signs the user out.
          set({ status: 'signedIn' });
          void get().refreshUser();
        })();
        return hydration;
      },

      signIn: async (input) => {
        const { tokens, user } = await login(input);
        await tokenStorage.save(tokens);
        set({ status: 'signedIn', user });
      },

      signOut: async ({ expired = false } = {}) => {
        if (get().status === 'signedOut')
          return; // several 401s can report expiry at once — sign out only once
        const refreshToken = tokenStorage.getRefreshToken();
        // Fire before clearing: the request picks up the access token synchronously.
        const revoke = logoutRequest(refreshToken).catch(() => {});

        set({ status: 'signedOut', user: null }); // Stack.Protected routes to login immediately
        clearUserData();
        await Promise.allSettled([revoke, tokenStorage.clear()]);

        if (expired)
          toast.info('Session expired', { description: 'Please sign in again.' });
      },

      refreshUser: async () => {
        try {
          const user = await fetchCurrentUser();
          set({ user });
        }
        catch {
          // Offline or server error → keep the cached profile. A dead session is handled by
          // the client (refresh fails → onSessionExpired → signOut).
        }
      },
    }),
    {
      name: 'session',
      version: 1,
      storage: zustandMMKVStorage,
      partialize: ({ user }) => ({ user }), // never tokens — those live in the keychain
    },
  ),
);

// Connect the HTTP client to the session (dependency injection — the client never imports this).
configureApiAuth({
  getAccessToken: tokenStorage.getAccessToken,
  refreshAccessToken: createTokenRefresher(refreshTokens),
  onSessionExpired: () => void useSession.getState().signOut({ expired: true }),
});
