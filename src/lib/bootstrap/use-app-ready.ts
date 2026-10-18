import { useEffect } from 'react';

import { useSession } from '@/features/auth/session-store';

/**
 * Single source of truth for "can the first real frame be shown?".
 *
 * The native splash screen stays up until this returns true, so the user never sees
 * a half-initialised UI or the wrong initial route (e.g. login flashing before home).
 * Startup prerequisites run in parallel:
 *
 * - Session hydrated from secure storage (decides login vs. home).
 * - Fonts: nothing to wait for — embedded at build time.
 * - Phase 5: persisted query cache restored.
 *
 * Keep this list short: every item delays first paint.
 */
export function useAppReady(): boolean {
  const status = useSession(state => state.status);

  useEffect(() => {
    void useSession.getState().hydrate();
  }, []);

  return status !== 'idle';
}
