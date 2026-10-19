import type { Edge } from 'react-native-safe-area-context';
import { ScrollView, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

import { cn } from '@/lib/utils';

const StyledKeyboardAwareScrollView = withUniwind(KeyboardAwareScrollView);

type ScreenProps = {
  children: React.ReactNode;
  /**
   * - `scroll` (default): ScrollView that plays well with native large-title headers.
   * - `keyboard`: scroll view that keeps the focused input above the keyboard (forms).
   * - `static`: plain full-size View (lists, maps, custom layouts).
   */
  variant?: 'scroll' | 'keyboard' | 'static';
  /**
   * Safe-area edges to pad. Default none: native headers and tabs already handle insets.
   * Use `['top']` on header-less screens (e.g. login).
   */
  edges?: Edge[];
  className?: string;
  /** Classes for the scroll content (padding, gap). Default `gap-4 p-4`. */
  contentClassName?: string;
  refreshControl?: React.ComponentProps<typeof ScrollView>['refreshControl'];
  /** For E2E tests (Maestro `id:`) and component tests. */
  testID?: string;
};

/** Standard screen container. Every screen should start with it for consistent spacing and behavior. */
export function Screen({ children, variant = 'scroll', edges = [], className, contentClassName, refreshControl, testID }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const padding = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  };
  const content = cn('gap-4 p-4', contentClassName);

  if (variant === 'static') {
    return (
      <View className={cn('flex-1 bg-background', className)} style={padding} testID={testID}>
        {children}
      </View>
    );
  }

  if (variant === 'keyboard') {
    return (
      <StyledKeyboardAwareScrollView
        className={cn('flex-1 bg-background', className)}
        style={padding}
        testID={testID}
        contentContainerClassName={content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
        refreshControl={refreshControl}
      >
        {children}
      </StyledKeyboardAwareScrollView>
    );
  }

  return (
    <ScrollView
      className={cn('flex-1 bg-background', className)}
      style={padding}
      testID={testID}
      contentContainerClassName={content}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  );
}
