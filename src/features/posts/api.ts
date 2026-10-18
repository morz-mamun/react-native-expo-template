import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import type { PostListFilters } from '@/features/posts/keys';
import type { CreatePostInput, Post } from '@/features/posts/types';
import type { OffsetPage } from '@/lib/api/pagination';
import { infiniteQueryOptions, queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';

import { postKeys } from '@/features/posts/keys';
import { authorAvatarUrl, postSchema, postsResponseSchema } from '@/features/posts/types';
import { http } from '@/lib/api/client';
import { getNextOffset } from '@/lib/api/pagination';
import { parseResponse } from '@/lib/api/parse-response';

const PAGE_SIZE = 20;
/** The example API has no auth yet; Phase 4 replaces this with the signed-in user's id. */
const DEMO_USER_ID = 1;

export type PostsPage = OffsetPage<Post>;

// ─── Fetchers: plain async functions (easy to test, reusable outside React) ────────────────

async function fetchPostsPage({ skip, filters, signal }: { skip: number; filters: PostListFilters; signal?: AbortSignal }): Promise<PostsPage> {
  const path = filters.search ? 'posts/search' : 'posts';
  const data = await http.get(path, { params: { limit: PAGE_SIZE, skip, q: filters.search || undefined }, signal });
  // Large list → validated in dev/preview/tests, cast in production (see parseResponse).
  const page = parseResponse(postsResponseSchema, data, { strict: false });

  // Warm the image cache for this page's avatars so rows show images instantly when they
  // scroll into view (rows below the fold render later than the data arrives).
  void Image.prefetch([...new Set(page.posts.map(p => authorAvatarUrl(p.userId)))], 'memory-disk');

  return { items: page.posts, total: page.total, skip: page.skip, limit: page.limit };
}

async function fetchPost(id: number, signal?: AbortSignal): Promise<Post> {
  return parseResponse(postSchema, await http.get(`posts/${id}`, { signal }), { strict: false });
}

async function createPost(input: CreatePostInput): Promise<Post> {
  // Mutation responses are a trust boundary → always validated.
  return parseResponse(postSchema, await http.post('posts/add', { ...input, userId: DEMO_USER_ID }));
}

// ─── Query definitions: one object per resource, usable with useQuery / prefetch / ensure ──

export const postQueries = {
  /** Infinite, paginated list. `useInfiniteQuery(postQueries.list())` */
  list: (filters: PostListFilters = {}) =>
    infiniteQueryOptions({
      queryKey: postKeys.list(filters),
      queryFn: ({ pageParam, signal }) => fetchPostsPage({ skip: pageParam, filters, signal }),
      initialPageParam: 0,
      getNextPageParam: getNextOffset,
    }),

  /** Single post. `useQuery(postQueries.detail(id))` */
  detail: (id: number) =>
    queryOptions({
      queryKey: postKeys.detail(id),
      queryFn: ({ signal }) => fetchPost(id, signal),
    }),
};

/**
 * Finds a post already loaded in any list. Used as `placeholderData` so a detail screen renders
 * real content on its first frame while the full record loads.
 */
export function findPostInLists(queryClient: QueryClient, id: number): Post | undefined {
  for (const [, data] of queryClient.getQueriesData<InfiniteData<PostsPage>>({ queryKey: postKeys.lists() })) {
    const match = data?.pages.flatMap(page => page.items).find(post => post.id === id);
    if (match)
      return match;
  }
  return undefined;
}

// ─── Mutations ─────────────────────────────────────────────────────────────────────────────

type ListsSnapshot = Array<[readonly unknown[], InfiniteData<PostsPage> | undefined]>;

function updateLists(queryClient: QueryClient, update: (pages: PostsPage[]) => PostsPage[]) {
  queryClient.setQueriesData<InfiniteData<PostsPage>>({ queryKey: postKeys.lists() }, old =>
    old ? { ...old, pages: update(old.pages) } : old);
}

/**
 * Create a post with an optimistic update:
 * 1. onMutate: the new post appears at the top of every list immediately.
 * 2. onError: lists roll back to the snapshot (+ global error toast).
 * 3. onSuccess: the temporary post is swapped for the server's version (+ success toast via meta).
 * 4. onSettled: lists are marked stale so they re-sync with the server.
 */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPost,
    meta: { successMessage: 'Post published', errorMessage: 'Couldn\'t publish post' },

    onMutate: async (input) => {
      // Stop in-flight list fetches from overwriting the optimistic update.
      await queryClient.cancelQueries({ queryKey: postKeys.lists() });
      const snapshot: ListsSnapshot = queryClient.getQueriesData<InfiniteData<PostsPage>>({ queryKey: postKeys.lists() });

      const optimistic: Post = { id: -Date.now(), ...input, userId: DEMO_USER_ID, tags: [], reactions: { likes: 0, dislikes: 0 }, views: 0 };
      updateLists(queryClient, ([first, ...rest]) =>
        first ? [{ ...first, items: [optimistic, ...first.items], total: first.total + 1 }, ...rest] : []);

      return { snapshot, optimisticId: optimistic.id };
    },

    onError: (_error, _input, context) => {
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },

    onSuccess: (created, _input, context) => {
      updateLists(queryClient, pages => pages.map(page => ({
        ...page,
        items: page.items.map(post => (post.id === context?.optimisticId ? created : post)),
      })));
      queryClient.setQueryData(postKeys.detail(created.id), created);
    },

    onSettled: () =>
      // `refetchType: 'none'` marks lists stale without refetching right now: the demo API
      // (dummyjson) doesn't persist new posts, so an immediate refetch would remove it.
      // With a real backend, drop the option to re-sync visible lists immediately.
      queryClient.invalidateQueries({ queryKey: postKeys.lists(), refetchType: 'none' }),
  });
}
