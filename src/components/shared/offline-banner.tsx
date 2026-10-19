import { onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp, ReduceMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/icon';

import { WifiOff } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';

function useIsOnline() {
  return useSyncExternalStore(onlineManager.subscribe.bind(onlineManager), () => onlineManager.isOnline());
}

/**
 * Small "You're offline" pill at the top of the screen. Non-blocking (touches pass through),
 * announced to screen readers, animated on the UI thread. Mounted once in the root layout.
 */
export function OfflineBanner() {
  const isOnline = useIsOnline();
  const insets = useSafeAreaInsets();

  if (isOnline)
    return null;

  return (
    <View pointerEvents="none" className="absolute inset-x-0 items-center" style={{ top: insets.top + 6 }}>
      <Animated.View
        entering={FadeInUp.duration(220).reduceMotion(ReduceMotion.System)}
        exiting={FadeOutUp.duration(180).reduceMotion(ReduceMotion.System)}
        className="flex-row items-center gap-2 rounded-full bg-foreground px-4 py-2"
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        <Icon as={WifiOff} className="size-4 text-background" />
        <Text className="text-sm font-medium text-background">You're offline — showing saved data</Text>
      </Animated.View>
    </View>
  );
}
