# Adding a feature

A walkthrough that builds a **Products** feature (a list, a detail screen and a "favorite" mutation), following the same patterns as the example [`posts`](../src/features/posts) feature. Copy from `posts` whenever you're unsure.

```
src/features/products/
├── types.ts            # 1. Zod schemas + types
├── keys.ts             # 2. query-key factory
├── api.ts              # 3. fetchers, queryOptions, mutation hooks
├── components/
│   └── product-row.tsx # 4. UI pieces used only by this feature
├── screens/
│   ├── products-screen.tsx
│   └── product-detail-screen.tsx
└── __tests__/          # 6. tests
src/app/(app)/(tabs)/products/   # 5. thin routes + a stack for the tab
```

## 1. Types (`types.ts`)

```ts
import { z } from 'zod';

export const productSchema = z.object({
  id: z.number(),
  title: z.string(),
  price: z.number(),
  thumbnail: z.string(),
});
export type Product = z.infer<typeof productSchema>;

export const productsResponseSchema = z.object({
  products: z.array(productSchema),
  total: z.number(),
  skip: z.number(),
  limit: z.number(),
});
```

## 2. Query keys (`keys.ts`)

```ts
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: { category?: string } = {}) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: number) => [...productKeys.details(), id] as const,
};
```

## 3. API (`api.ts`)

```ts
import { infiniteQueryOptions, queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';

import { productKeys } from '@/features/products/keys';
import { productSchema, productsResponseSchema } from '@/features/products/types';
import { http } from '@/lib/api/client';
import { getNextOffset } from '@/lib/api/pagination';
import { parseResponse } from '@/lib/api/parse-response';

async function fetchProductsPage(skip: number, signal?: AbortSignal) {
  const data = parseResponse(productsResponseSchema, await http.get('auth/products', { params: { limit: 20, skip }, signal }), { strict: false });
  return { items: data.products, total: data.total, skip: data.skip, limit: data.limit };
}

export const productQueries = {
  list: () => infiniteQueryOptions({
    queryKey: productKeys.list(),
    queryFn: ({ pageParam, signal }) => fetchProductsPage(pageParam, signal),
    initialPageParam: 0,
    getNextPageParam: getNextOffset,
    meta: { persist: true }, // optional: available offline
  }),
  detail: (id: number) => queryOptions({
    queryKey: productKeys.detail(id),
    queryFn: async ({ signal }) => parseResponse(productSchema, await http.get(`auth/products/${id}`, { signal }), { strict: false }),
  }),
};

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => http.delete(`auth/products/${id}`),
    meta: { successMessage: 'Product deleted', errorMessage: 'Couldn\'t delete product' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.lists() }),
  });
}
```

For optimistic updates, follow `useCreatePost` / `useLikePost` in [`posts/api.ts`](../src/features/posts/api.ts). For actions that should queue while offline, see [offline-and-ota.md](./offline-and-ota.md).

## 4. Screens

```tsx
// screens/products-screen.tsx
export function ProductsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const q = useInfiniteQuery({ ...productQueries.list(), select: flattenPages });

  return (
    <List
      data={q.data}
      keyExtractor={p => String(p.id)}
      renderItem={({ item }) => (
        <ProductRow
          product={item}
          onPressIn={() => void queryClient.prefetchQuery(productQueries.detail(item.id))}
          onPress={() => router.push({ pathname: '/products/[id]', params: { id: String(item.id) } })}
        />
      )}
      isLoading={q.isPending}
      isError={q.isError}
      errorMessage={q.error?.message}
      onRetry={() => void q.refetch()}
      onRefresh={() => void q.refetch()}
      isRefreshing={q.isRefetching && !q.isFetchingNextPage}
      onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && void q.fetchNextPage()}
      isFetchingNextPage={q.isFetchingNextPage}
      empty={{ title: 'No products yet' }}
    />
  );
}
```

Use the design system: `Screen`, `List`, `Card`, `Text`, `Button` and `Icon`. For icons, add the ones you need to [`src/components/ui/icons.ts`](../src/components/ui/icons.ts). See [design-system.md](./design-system.md).

## 5. Routes and a tab

```
src/app/(app)/(tabs)/products/_layout.tsx   → <Stack screenOptions={defaultStackOptions}> with index + [id]
src/app/(app)/(tabs)/products/index.tsx     → export { ProductsScreen as default } from '@/features/products/screens/products-screen';
src/app/(app)/(tabs)/products/[id].tsx      → export { ProductDetailScreen as default } from '…/product-detail-screen';
```

Then add the tab to [`src/app/(app)/(tabs)/_layout.tsx`](../src/app/%28app%29/%28tabs%29/_layout.tsx):

```tsx
<NativeTabs.Trigger name="products">
  <NativeTabs.Trigger.Icon sf={{ default: 'bag', selected: 'bag.fill' }} md="shopping_bag" />
  <NativeTabs.Trigger.Label>Products</NativeTabs.Trigger.Label>
</NativeTabs.Trigger>
```

Android allows at most 5 tabs. A full-screen flow or modal goes in `src/app/(app)/` (next to `(tabs)`), with a `<Stack.Screen>` entry in `src/app/(app)/_layout.tsx`. Typed routes update when Metro runs, and then `router.push('/products/…')` is type-checked.

## 6. Tests

```ts
// __tests__/products-screen.test.tsx
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

it('shows products', async () => {
  server.use(msw.get(`${API}/auth/products`, () => HttpResponse.json({ products: [{ id: 1, title: 'Phone', price: 9, thumbnail: '' }], total: 1, skip: 0, limit: 20 })));
  await renderWithProviders(<ProductsScreen />);
  expect(await screen.findByText('Phone')).toBeOnTheScreen();
});
```

Add default handlers for the new endpoints to [`src/test/msw/handlers.ts`](../src/test/msw/handlers.ts) if several tests use them. See [testing.md](./testing.md).

## Checklist

- [ ] `types.ts`: Zod schemas, with strict parsing for mutations and auth, non-strict for big lists
- [ ] `keys.ts`: a key factory rooted at the feature name
- [ ] `api.ts`: fetchers pass `signal`; `queryOptions` / `infiniteQueryOptions`; mutation `meta` messages; precise invalidation
- [ ] Screens handle loading, error, empty and data, using `Screen` / `List` / `EmptyState` / `ErrorState`
- [ ] Routes are thin re-exports, and the tab or stack entry is added
- [ ] Accessibility: roles and labels on custom pressables, 44pt targets, `testID`s for E2E
- [ ] Tests for the screen states and any optimistic logic
- [ ] `pnpm check-all` passes

---

## Removing the example `posts` feature

Verified: after these steps `pnpm check-all` passes and the app bundles.

1. Delete the feature and its routes:
   ```bash
   rm -rf src/features/posts "src/app/(app)/(tabs)/posts" "src/app/(app)/new-post.tsx"
   ```
2. In `src/app/(app)/(tabs)/_layout.tsx`, remove the `<NativeTabs.Trigger name="posts">…</NativeTabs.Trigger>` block.
3. In `src/app/(app)/_layout.tsx`, remove `<Stack.Screen name="new-post" … />`.
4. In `src/providers/query-provider.tsx`, remove `import '@/features/posts/mutation-defaults';` and its comment. Keep the pattern in mind for your own offline mutations.
5. Optional cleanup:
   - Delete the posts handlers and `makePost` in `src/test/msw/handlers.ts`.
   - Remove unused icons from `src/components/ui/icons.ts`.
   - Update the copy on the home screen.
6. Run `pnpm check-all`.

The Developer tools in Settings use `GET auth/me`, so they keep working without posts.
