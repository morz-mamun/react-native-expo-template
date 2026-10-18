import type { FlashListProps } from '@shopify/flash-list';
import { FlashList } from '@shopify/flash-list';
import { ActivityIndicator, RefreshControl, View } from 'react-native';

import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { haptics } from '@/lib/haptics';
import { useColorToken } from '@/lib/theme/use-color-token';

type ListProps<T> = Omit<FlashListProps<T>, 'refreshControl' | 'ListEmptyComponent'> & {
  /** First load with no data yet → skeleton. */
  isLoading?: boolean;
  /** Failed with no data to show → ErrorState with retry. */
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  /** Loading the next page → footer spinner. */
  isFetchingNextPage?: boolean;
  /** Pull-to-refresh. */
  onRefresh?: () => void;
  isRefreshing?: boolean;
  empty?: { title: string; description?: string; action?: { label: string; onPress: () => void } };
  /** Custom loading placeholder (defaults to 6 skeleton rows). */
  skeleton?: React.ReactNode;
};

function DefaultSkeleton() {
  return (
    <View className="gap-3 p-4">
      {Array.from({ length: 6 }, (_, i) => (
        <View key={i} className="flex-row items-center gap-3">
          <Skeleton className="size-11 rounded-full" />
          <View className="flex-1 gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * The standard virtualized list (FlashList v2: cell recycling, no size estimates needed).
 * Handles the four states every data list has: loading → error → empty → data (+ next page).
 *
 * Performance: keep `renderItem` rows light and memo-friendly, give stable `keyExtractor`s,
 * and use `getItemType` when rows have different layouts.
 */
export function List<T>({ isLoading, isError, errorMessage, onRetry, isFetchingNextPage, onRefresh, isRefreshing = false, empty, skeleton, data, ...props }: ListProps<T>) {
  const tint = useColorToken('--color-muted-foreground');
  const hasData = (data?.length ?? 0) > 0;

  if (isLoading && !hasData)
    return <>{skeleton ?? <DefaultSkeleton />}</>;
  if (isError && !hasData)
    return <ErrorState message={errorMessage} onRetry={onRetry} />;

  return (
    <FlashList
      data={data}
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="on-drag"
      refreshControl={onRefresh && (
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => {
            haptics.tap();
            onRefresh();
          }}
          tintColor={tint}
          colors={[tint]}
        />
      )}
      ListEmptyComponent={empty && <EmptyState {...empty} />}
      ListFooterComponent={isFetchingNextPage ? <ActivityIndicator className="py-6" colorClassName="accent-muted-foreground" /> : null}
      {...props}
    />
  );
}
