import { View } from 'react-native';
import { Button } from '@/components/ui/button';

import { Icon } from '@/components/ui/icon';
import { RefreshCw, TriangleAlert } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  /** Shows the retry button as loading (e.g. while refetching). */
  retrying?: boolean;
  className?: string;
};

/** Inline error with retry — for failed queries. Keeps the user in context instead of crashing. */
export function ErrorState({ title = 'Something went wrong', message = 'Please check your connection and try again.', onRetry, retrying = false, className }: ErrorStateProps) {
  return (
    <View className={cn('flex-1 items-center justify-center gap-3 px-8 py-16', className)} role="alert">
      <View className="mb-1 size-14 items-center justify-center rounded-full bg-destructive/10">
        <Icon as={TriangleAlert} className="size-6 text-destructive" />
      </View>
      <Text variant="h4" className="text-center">{title}</Text>
      <Text variant="muted" className="text-center">{message}</Text>
      {onRetry && (
        <Button variant="outline" className="mt-2" loading={retrying} onPress={onRetry}>
          <Icon as={RefreshCw} className="size-4" />
          <Text>Try again</Text>
        </Button>
      )}
    </View>
  );
}
