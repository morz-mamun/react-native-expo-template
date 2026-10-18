import { Platform, Switch as RNSwitch } from 'react-native';

import { haptics } from '@/lib/haptics';
import { useColorToken } from '@/lib/theme/use-color-token';

type SwitchProps = Omit<React.ComponentProps<typeof RNSwitch>, 'value' | 'onValueChange'> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

/**
 * Platform-native switch (UISwitch / Material): native feel and accessibility for free,
 * colored with design tokens, with selection haptics. Give it an `accessibilityLabel`
 * (or place it in a row whose label describes it).
 */
function Switch({ checked, onCheckedChange, ...props }: SwitchProps) {
  const primary = useColorToken('--color-primary');
  const primaryForeground = useColorToken('--color-primary-foreground');
  const input = useColorToken('--color-input');
  const mutedForeground = useColorToken('--color-muted-foreground');
  // Unchecked thumb: white on iOS (system look), muted on Android (Material "off" state).
  const offThumb = Platform.OS === 'ios' ? '#ffffff' : mutedForeground;

  return (
    <RNSwitch
      value={checked}
      onValueChange={(value) => {
        haptics.selection();
        onCheckedChange(value);
      }}
      trackColor={{ true: primary, false: input }}
      thumbColor={checked ? primaryForeground : offThumb}
      ios_backgroundColor={input}
      role="switch"
      accessibilityState={{ checked, disabled: props.disabled ?? undefined }}
      {...props}
    />
  );
}

export { Switch };
export type { SwitchProps };
