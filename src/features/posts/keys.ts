/**
 * Query-key factory — the ONLY place post keys are built. Hierarchical, so invalidation can be
 * as broad or narrow as needed:
 *
 *   postKeys.all            ['posts']                         → everything about posts
 *   postKeys.lists()        ['posts', 'list']                 → every list (any filters)
 *   postKeys.list(filters)  ['posts', 'list', { … }]          → one list
 *   postKeys.details()      ['posts', 'detail']               → every detail
 *   postKeys.detail(id)     ['posts', 'detail', 7]            → one post
 */
export type PostListFilters = { search?: string };

export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (filters: PostListFilters = {}) => [...postKeys.lists(), filters] as const,
  details: () => [...postKeys.all, 'detail'] as const,
  detail: (id: number) => [...postKeys.details(), id] as const,
};
