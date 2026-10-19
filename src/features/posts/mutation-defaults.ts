import type { Post } from '@/features/posts/types';

import { postKeys } from '@/features/posts/keys';
import { postSchema } from '@/features/posts/types';
import { http } from '@/lib/api/client';
import { parseResponse } from '@/lib/api/parse-response';
import { queryClient } from '@/lib/api/query-client';

export type LikePostVariables = { id: number; likes: number; dislikes: number };

/** Mutation key for "like a post" — the opt-in OFFLINE-QUEUED mutation example. */
export const likePostKey = [...postKeys.all, 'like'] as const;

async function likePost({ id, likes, dislikes }: LikePostVariables): Promise<Post> {
  return parseResponse(postSchema, await http.put(`auth/posts/${id}`, { reactions: { likes, dislikes } }));
}

/**
 * Registered at startup (imported by QueryProvider) so that a "like" made offline — and even
 * persisted across an app restart — still knows its mutationFn when connectivity returns.
 *
 * `networkMode: 'online'` = pause while offline, run when back online (instead of the app-wide
 * fail-fast default). Use this only for actions that are safe to apply late and in order.
 */
queryClient.setMutationDefaults(likePostKey, {
  mutationFn: likePost,
  networkMode: 'online',
  retry: 2,
});
