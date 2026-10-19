import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { Button } from '@/components/ui/button';

import { Icon } from '@/components/ui/icon';
import { Inbox } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: { label: string; onPress: () => void };
  className?: string;
};

/** "Nothing here yet" — for empty lists and screens. Always say what to do next. */
export function EmptyState({ title, description, icon = Inbox, action, className }: EmptyStateProps) {
  return (
    <View className={cn('flex-1 items-center justify-center gap-3 px-8 py-16', className)}>
      <View className="mb-1 size-14 items-center justify-center rounded-full bg-muted">
        <Icon as={icon} className="size-6 text-muted-foreground" />
      </View>
      <Text variant="h4" className="text-center">{title}</Text>
      {description && <Text variant="muted" className="text-center">{description}</Text>}
      {action && (
        <Button variant="outline" className="mt-2" onPress={action.onPress}>
          <Text>{action.label}</Text>
        </Button>
      )}
    </View>
  );
}
