import type { LucideIcon } from 'lucide-react-native';
import type { ThemePreference } from '@/stores/preferences-store';
import { Moon, Smartphone, Sun } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { usePreferences } from '@/stores/preferences-store';

const OPTIONS: { value: ThemePreference; label: string; icon: LucideIcon }[] = [
  { value: 'system', label: 'System', icon: Smartphone },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
];

/** Segmented control for light / dark / system theme. Applied instantly and persisted. */
export function ThemePicker() {
  const theme = usePreferences(state => state.theme);
  const setTheme = usePreferences(state => state.setTheme);

  return (
    <View className="flex-row gap-1 rounded-lg bg-muted p-1" role="radiogroup" accessibilityLabel="Theme">
      {OPTIONS.map((option) => {
        const selected = option.value === theme;
        return (
          <Pressable
            key={option.value}
            role="radio"
            accessibilityState={{ selected, checked: selected }}
            onPress={() => {
              if (selected)
                return;
              haptics.selection();
              setTheme(option.value);
            }}
            className={cn('h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-md', selected && 'bg-background')}
          >
            <Icon as={option.icon} className={cn('size-4', selected ? 'text-foreground' : 'text-muted-foreground')} />
            <Text className={cn('text-sm font-medium', selected ? 'text-foreground' : 'text-muted-foreground')}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
