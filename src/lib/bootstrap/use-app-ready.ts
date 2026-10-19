import { useIsRestoring } from '@tanstack/react-query';
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
 * - Persisted query cache restored from MMKV (so lists render with data, even offline).
 * - Fonts: nothing to wait for — embedded at build time.
 *
 * Keep this list short: every item delays first paint.
 */
export function useAppReady(): boolean {
  const status = useSession(state => state.status);
  const isRestoringCache = useIsRestoring();

  useEffect(() => {
    void useSession.getState().hydrate();
  }, []);

  return status !== 'idle' && !isRestoringCache;
}
