import { NativeTabs } from 'expo-router/native-tabs';

import { haptics } from '@/lib/haptics';
import { useColorToken } from '@/lib/theme/use-color-token';

/**
 * Platform-native tab bar (UITabBarController on iOS, Material bottom navigation on Android).
 * Each tab nests its own Stack so it gets native headers and push navigation.
 *
 * Icons: `sf` = SF Symbols (iOS), `md` = Material Symbols (Android, needs `expo-symbols`).
 * Limits: max 5 tabs on Android; tabs can't be added/removed at runtime.
 */
export default function TabsLayout() {
  const primary = useColorToken('--color-primary');

  return (
    <NativeTabs tintColor={primary} screenListeners={{ tabPress: () => haptics.selection() }}>
      <NativeTabs.Trigger name="(home)">
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} md="settings" />
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
