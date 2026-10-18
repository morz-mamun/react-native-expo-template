import { useEffect } from 'react';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { cn } from '@/lib/utils';

const DURATION = 900;

/**
 * Loading placeholder with a UI-thread pulse (Reanimated). Static when the OS
 * "Reduce motion" setting is on. Size it with classes: `<Skeleton className="h-4 w-32" />`.
 */
function Skeleton({ className, ...props }: React.ComponentProps<typeof Animated.View>) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion)
      return;
    opacity.set(withRepeat(withTiming(0.5, { duration: DURATION }), -1, true));
    return () => cancelAnimation(opacity);
  }, [opacity, reduceMotion]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  return (
    <Animated.View
      style={style}
      className={cn('rounded-md bg-secondary', className)}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      {...props}
    />
  );
}

export { Skeleton };
