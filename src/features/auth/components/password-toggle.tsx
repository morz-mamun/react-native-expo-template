import { Eye, EyeOff } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { Icon } from '@/components/ui/icon';

/** Show/hide button for a password field (use as `TextField` `trailing`). */
export function PasswordToggle({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <Pressable
      onPress={onToggle}
      role="button"
      accessibilityLabel={visible ? 'Hide password' : 'Show password'}
      hitSlop={6}
      className="size-11 items-center justify-center"
    >
      <Icon as={visible ? EyeOff : Eye} className="size-5 text-muted-foreground" />
    </Pressable>
  );
}
