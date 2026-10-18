import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

/** Grouped settings block: small uppercase title + card containing rows. */
export function SettingsSection({ title, footer, children }: { title: string; footer?: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text variant="muted" className="px-1 text-xs font-semibold uppercase tracking-wider">{title}</Text>
      <View className="overflow-hidden rounded-xl border border-border bg-card">{children}</View>
      {footer && <Text variant="muted" className="px-1 text-xs">{footer}</Text>}
    </View>
  );
}

/** One settings row: label (+ optional description) on the left, control/value on the right. */
export function SettingsRow({ label, description, right, last = false }: { label: string; description?: string; right?: React.ReactNode; last?: boolean }) {
  return (
    <View className={cn('min-h-12 flex-row items-center gap-3 px-4 py-3', !last && 'border-b border-border')}>
      <View className="flex-1 gap-0.5">
        <Text>{label}</Text>
        {description && <Text variant="muted">{description}</Text>}
      </View>
      {right}
    </View>
  );
}
