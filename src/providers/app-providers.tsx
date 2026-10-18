import type { PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * Global providers, outermost first. Order matters:
 * 1. GestureHandlerRootView — must wrap everything that uses gestures (sheets, swipes).
 * 2. SafeAreaProvider — insets for every screen/overlay.
 * 3. KeyboardProvider — native keyboard tracking for smooth keyboard-aware layouts.
 *
 * Later phases add: theme, React Query (+ persistence), bottom sheet, toasts, portal host.
 */
export function AppProviders({ children }: PropsWithChildren) {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <KeyboardProvider>{children}</KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
