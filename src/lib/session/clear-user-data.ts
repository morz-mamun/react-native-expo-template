import { queryClient } from '@/lib/api/query-client';

/**
 * Wipes everything that belongs to the signed-in user, so the next user on this device
 * never sees it. Called on sign-out and on session expiry.
 *
 * Add every per-user cache here (Phase 5 adds the persisted query cache).
 */
export function clearUserData() {
  void queryClient.cancelQueries();
  queryClient.clear();
}
