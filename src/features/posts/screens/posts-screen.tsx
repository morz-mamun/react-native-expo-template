import type { Post } from '@/features/posts/types';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { List } from '@/components/shared/list';
import { Separator } from '@/components/ui/separator';
import { postQueries } from '@/features/posts/api';
import { PostRow } from '@/features/posts/components/post-row';
import { flattenPages } from '@/lib/api/pagination';

/** Module-level component: a stable type, so FlashList never remounts separators. */
function PostSeparator() {
  return <Separator className="ml-18" />;
}

export function PostsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: posts, isPending, isError, error, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    ...postQueries.list(),
    select: flattenPages,
  });

  // Touch-down → start fetching the detail ~100–200ms before navigation commits.
  // prefetchQuery respects staleTime, so it's a no-op when the detail is already fresh.
  const prefetchDetail = (post: Post) => {
    if (post.id > 0)
      void queryClient.prefetchQuery(postQueries.detail(post.id));
  };

  return (
    <List
      data={posts}
      keyExtractor={post => String(post.id)}
      renderItem={({ item }) => (
        <PostRow
          post={item}
          onPressIn={prefetchDetail}
          onPress={post => router.push({ pathname: '/posts/[id]', params: { id: String(post.id) } })}
        />
      )}
      ItemSeparatorComponent={PostSeparator}
      isLoading={isPending}
      isError={isError}
      errorMessage={error?.message}
      onRetry={() => void refetch()}
      onRefresh={() => void refetch()}
      isRefreshing={isRefetching && !isFetchingNextPage}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage)
          void fetchNextPage();
      }}
      onEndReachedThreshold={0.5}
      isFetchingNextPage={isFetchingNextPage}
      empty={{ title: 'No posts yet', description: 'Tap + to write the first one.' }}
    />
  );
}
