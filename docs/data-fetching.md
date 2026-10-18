# Data fetching

The app fetches server data with **Axios** for HTTP and **TanStack Query v5** for caching and state. There are no wrapper libraries. Each feature defines its queries once with `queryOptions`, and screens use them with the standard hooks.

```
Screen ──useQuery(postQueries.detail(id))──► QueryClient cache ──miss/stale──► fetcher ──► http (Axios) ──► API
   ▲                                              │                                         │
   └──────────── cached data (instant) ◄──────────┘◄──── parseResponse (Zod) ◄── ApiError ◄──┘
```

| File | Role |
| --- | --- |
| [`src/lib/api/client.ts`](../src/lib/api/client.ts) | The one Axios instance: base URL, timeout, bearer token, 401 → refresh → retry, errors → `ApiError` |
| [`src/lib/api/errors.ts`](../src/lib/api/errors.ts) | `ApiError` + `toApiError()` normaliser |
| [`src/lib/api/query-client.ts`](../src/lib/api/query-client.ts) | `QueryClient` defaults, typed `meta`, global mutation toasts |
| [`src/providers/query-provider.tsx`](../src/providers/query-provider.tsx) | Provider, plus AppState (focus) and NetInfo (online) wiring, plus devtools |
| [`src/lib/api/parse-response.ts`](../src/lib/api/parse-response.ts) | Zod validation policy |
| [`src/lib/api/pagination.ts`](../src/lib/api/pagination.ts) | Offset and cursor page helpers |
| `src/features/<name>/{keys,api,types}.ts` | Per-feature keys, fetchers, query definitions and mutations |

The example feature [`src/features/posts/`](../src/features/posts) uses every pattern below.

## Errors: one shape everywhere

Every failure (HTTP status, offline, timeout, cancelled, or a response with the wrong shape) reaches your code as an **`ApiError`**:

```ts
error.kind; // 'network' | 'timeout' | 'unauthorized' | 'forbidden' | 'not_found' | 'conflict'
//            | 'validation' | 'rate_limited' | 'server' | 'parse' | 'cancelled' | 'unknown'
error.status; // HTTP status, if any
error.message; // user-friendly: the server message for 4xx, generic text for 5xx/network
error.fieldErrors; // { email: ['Already taken'] } for 400/422
error.isNetworkError; // offline/timeout: retry when back online
error.isClientError; // 4xx: retrying won't help
```

TanStack Query is told about this type (`Register.defaultError`), so `error` from `useQuery` and `useMutation` is typed as `ApiError` with no casts.

`extractFieldErrors()` in `errors.ts` understands the common backend formats (`{ errors: { field: [...] } }` and `{ errors: [{ field, message }] }`). If your backend uses something else, adapt that one function.

## QueryClient defaults (and why)

| Option | Value | Why |
| --- | --- | --- |
| `staleTime` | 30s | Going back to a screen within 30s renders from cache with **no request**. After that, cached data still shows instantly and refreshes in the background |
| `gcTime` | 24h | Unused data stays available for revisits and (in Phase 5) offline starts |
| `retry` | never on 4xx or parse errors, else 2× | Retrying a 404 or a validation error is wasted time; flaky networks get two retries |
| `retryDelay` | 2s, 4s… capped at 10s | Exponential backoff |
| `refetchOnWindowFocus` | on | "Focus" means the app returns to the foreground (AppState) |
| `refetchOnReconnect` / `networkMode: 'online'` | on | Queries pause offline and resume when NetInfo reports a connection |
| `mutations.retry` | off | Mutations aren't idempotent. Let the user retry |

Tune these per query when needed, for example `staleTime: Infinity` for data that never changes, or `staleTime: 0` for live data.

## Defining a feature's data layer

### 1. Types and schemas (`types.ts`)

```ts
export const postSchema = z.object({ id: z.number(), title: z.string() /* … */ });
export type Post = z.infer<typeof postSchema>;
```

### 2. Query keys (`keys.ts`)

Build keys **only** through a factory. The hierarchy makes invalidation precise:

```ts
export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (filters: PostListFilters = {}) => [...postKeys.lists(), filters] as const,
  details: () => [...postKeys.all, 'detail'] as const,
  detail: (id: number) => [...postKeys.details(), id] as const,
};

queryClient.invalidateQueries({ queryKey: postKeys.lists() }); // every list, any filters
queryClient.invalidateQueries({ queryKey: postKeys.detail(7) }); // just post 7
queryClient.invalidateQueries({ queryKey: postKeys.all }); // everything about posts
```

### 3. Fetchers and query definitions (`api.ts`)

Fetchers are plain async functions. Query definitions use `queryOptions` / `infiniteQueryOptions`, and the **same object** works for hooks, prefetching and cache reads:

```ts
async function fetchPost(id: number, signal?: AbortSignal) {
  return parseResponse(postSchema, await http.get(`posts/${id}`, { signal }), { strict: false });
}

export const postQueries = {
  detail: (id: number) => queryOptions({
    queryKey: postKeys.detail(id),
    queryFn: ({ signal }) => fetchPost(id, signal), // signal → cancelled if no longer needed
  }),
};

// In a screen:
const { data, isPending, isError, error, refetch } = useQuery(postQueries.detail(id));
// Before navigating:
queryClient.prefetchQuery(postQueries.detail(id));
// Typed cache read:
queryClient.getQueryData(postQueries.detail(id).queryKey); // Post | undefined
```

> CareLink used `react-query-kit` for this. It's no longer needed: v5's `queryOptions` gives the same type safety and reuse without an extra dependency.

### 4. Response validation: `parseResponse`

```ts
parseResponse(schema, data); // strict (default): always validated
parseResponse(schema, data, { strict: false }); // validated in dev/preview/tests, cast in production
```

- **Strict:** use at trust boundaries: auth/session payloads, mutation responses, anything persisted. A bad payload becomes an `ApiError` of kind `parse` instead of crashing a screen later.
- **Non-strict:** use for large lists. Per-item validation costs CPU on low-end Android. Development and preview builds still catch backend drift early.

## Screen states

Every data screen handles **loading, error, empty and data**. The shared components make that one line each:

```tsx
const { data, isPending, isError, error, refetch, isRefetching } = useQuery(postQueries.detail(id));

if (data)
  return <PostView post={data} />;
if (isError)
  return <ErrorState message={error.message} onRetry={refetch} retrying={isRefetching} />;
return <DetailSkeleton />;
```

Check `data` first. When a background refetch fails, keep showing the data you already have.

## Pagination (infinite lists)

```ts
export const postQueries = {
  list: (filters = {}) => infiniteQueryOptions({
    queryKey: postKeys.list(filters),
    queryFn: ({ pageParam, signal }) => fetchPostsPage({ skip: pageParam, filters, signal }),
    initialPageParam: 0,
    getNextPageParam: getNextOffset, // or getNextCursor for cursor APIs
  }),
};
```

Fetchers return a normalised `OffsetPage<T>` (`{ items, total, skip, limit }`) or `CursorPage<T>` (`{ items, nextCursor }`). In the screen, flatten the pages with `select`. The flattened array is memoised by React Query:

```tsx
const q = useInfiniteQuery({ ...postQueries.list(), select: flattenPages });

<List
  data={q.data}
  isLoading={q.isPending}
  isError={q.isError}
  onRetry={q.refetch}
  onRefresh={q.refetch}
  isRefreshing={q.isRefetching && !q.isFetchingNextPage}
  onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
  isFetchingNextPage={q.isFetchingNextPage}
/>
```

The `!isFetchingNextPage` guard prevents duplicate page requests while scrolling quickly.

## Instant navigation: prefetch + placeholder

Two techniques make detail screens open with content already on screen:

1. **Prefetch on touch-down.** Rows call `queryClient.prefetchQuery(postQueries.detail(id))` in `onPressIn`. That's about 100–200ms before navigation commits, and it's free if the data is already fresh.
2. **Seed from the list.** The detail query uses data already in the list cache as `placeholderData`:
   ```ts
   useQuery({ ...postQueries.detail(id), placeholderData: () => findPostInLists(queryClient, id) });
   ```
   The screen renders on its first frame, and the full record replaces it seamlessly.

Images get the same treatment: when a page of posts arrives, `Image.prefetch()` warms the avatar cache, and rows use `expo-image` with `recyclingKey` and `cachePolicy="memory-disk"`.

## Mutations

### Feedback through `meta`

```ts
useMutation({
  mutationFn: createPost,
  meta: {
    successMessage: 'Post published', // toast.success (+ haptic)
    errorMessage: 'Couldn\'t publish post', // toast.error title; description = ApiError.message
    // silent: true,                       // skip the global error toast
  },
});
```

`meta` is typed (`Register.mutationMeta`), so typos are compile errors.

### Optimistic updates (with rollback)

`useCreatePost` in [`features/posts/api.ts`](../src/features/posts/api.ts) is the reference implementation:

```ts
onMutate: async (input) => {
  await queryClient.cancelQueries({ queryKey: postKeys.lists() }); // stop in-flight fetches clobbering us
  const snapshot = queryClient.getQueriesData({ queryKey: postKeys.lists() });
  /* insert an optimistic item into every list */
  return { snapshot, optimisticId };
},
onError: (_e, _v, context) => context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data)),
onSuccess: (created, _v, context) => { /* replace the optimistic item; seed the detail cache */ },
onSettled: () => queryClient.invalidateQueries({ queryKey: postKeys.lists() }),
```

Use optimistic updates for actions that almost always succeed (likes, toggles, creating your own content). For risky actions (payments, deletes of shared data), wait for the server and show a loading button.

> The demo API (dummyjson) doesn't persist new posts, so the example uses `refetchType: 'none'` on invalidation. Otherwise an immediate refetch would remove the new post. With a real backend, drop that option.

## Devtools

In development, press **`shift+m`** in the Expo CLI terminal and pick **@dev-plugins/react-query**. It inspects every query, its cache contents and its state, and lets you refetch or invalidate from the browser. It's a no-op in production builds.

## Pointing at your own backend

1. Set `API_URL` in `env/<env>.env`.
2. Replace the paths and response mapping in each feature's fetchers. Normalise pages to `OffsetPage` / `CursorPage`.
3. If your error body format differs, adapt `extractFieldErrors()` / `serverMessage()` in `errors.ts`.
4. Auth (bearer token, refresh on 401) is already wired in the client. Phase 4 connects it to a session.

**Example: CareLink's backend.** Its routes live under `/api` (e.g. `API_URL=https://api-carelink.example.com/api`), and auth uses `/auth/login`, `/auth/refresh` and `/auth/me`. Those auth paths are the ones the client already excludes from the refresh-and-retry logic. Map each list response onto `OffsetPage` or `CursorPage` in its fetcher.

## Checklist for a new endpoint

- [ ] Zod schema and type in `types.ts`
- [ ] Key in `keys.ts`, built from the feature's root key
- [ ] Fetcher in `api.ts` that passes `signal` and uses `parseResponse` (strict, or non-strict for big lists)
- [ ] `queryOptions` / `infiniteQueryOptions` entry, or a `useXxx` mutation hook with `meta` messages
- [ ] Screen handles loading, error, empty and data
- [ ] Mutations invalidate exactly the keys they affect
