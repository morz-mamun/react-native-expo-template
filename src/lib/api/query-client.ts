import { MutationCache, QueryClient } from '@tanstack/react-query';

import { ApiError } from '@/lib/api/errors';
import { toast } from '@/lib/toast';

/** Extra options features can attach to queries/mutations via `meta`. */
type AppQueryMeta = {
  /** Keep this query in the on-device cache across app restarts (Phase 5, offline). */
  persist?: boolean;
};

type AppMutationMeta = {
  /** Toast shown on success, e.g. 'Post published'. */
  successMessage?: string;
  /** Overrides the toast text on failure (default: the ApiError's message). */
  errorMessage?: string;
  /** Don't show the global error toast (the screen handles the error itself). */
  silent?: boolean;
};

declare module '@tanstack/react-query' {
  // eslint-disable-next-line ts/consistent-type-definitions -- module augmentation needs an interface
  interface Register {
    /** Every query/mutation error is an ApiError (the client normalises them). */
    defaultError: ApiError;
    queryMeta: AppQueryMeta;
    mutationMeta: AppMutationMeta;
  }
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

function shouldRetry(failureCount: number, error: unknown) {
  // 4xx won't succeed on retry; parse errors won't either. Network/5xx get up to 2 retries.
  if (error instanceof ApiError && (error.isClientError || error.kind === 'parse' || error.kind === 'cancelled'))
    return false;
  return failureCount < 2;
}

/**
 * The app's single QueryClient. Defaults are tuned for mobile:
 *
 * - staleTime 30s: data shown within 30s of fetching is "fresh" → navigating back to a screen
 *   renders instantly from cache with no request. After that, cached data still renders
 *   instantly and refreshes in the background.
 * - gcTime 24h: unused data stays in memory (and later on disk) for a day, so revisits and
 *   offline starts have something to show. Must be ≥ the persister's maxAge (Phase 5).
 * - retry: never on 4xx/parse errors; network/5xx retried twice with exponential backoff.
 * - refetchOnWindowFocus: "window focus" = app returns to foreground (wired to AppState).
 * - Mutations never retry automatically (not idempotent) and report errors via toast.
 * - Offline policy for mutations (`networkMode: 'always'`): FAIL FAST — the request runs, the
 *   client rejects instantly with a network ApiError and the user gets a toast. Opt in to
 *   queue-while-offline per mutation with `networkMode: 'online'` + `setMutationDefaults`
 *   (see features/posts/mutation-defaults.ts and docs/offline-and-ota.md).
 */
export function createQueryClient() {
  return new QueryClient({
    mutationCache: new MutationCache({
      onSuccess: (_data, _variables, _result, mutation) => {
        const message = mutation.meta?.successMessage;
        if (message)
          toast.success(message);
      },
      onError: (error, _variables, _result, mutation) => {
        if (mutation.meta?.silent || error.kind === 'cancelled')
          return;
        if (error.isNetworkError) {
          toast.error('You\'re offline', { description: 'This action needs an internet connection. Try again when you\'re back online.' });
          return;
        }
        toast.error(mutation.meta?.errorMessage ?? 'Something went wrong', { description: error.message });
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30 * SECOND,
        gcTime: 24 * HOUR,
        retry: shouldRetry,
        retryDelay: attempt => Math.min(1000 * 2 ** attempt, 10 * SECOND),
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        networkMode: 'online',
      },
      mutations: {
        retry: false,
        networkMode: 'always',
      },
    },
  });
}

/** The app's singleton client. Tests use `createQueryClient()` for isolation. */
export const queryClient = createQueryClient();
