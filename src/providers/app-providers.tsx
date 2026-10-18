import type { PropsWithChildren } from 'react';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { PortalHost } from '@rn-primitives/portal';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppToaster } from '@/components/shared/app-toaster';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';

/**
 * Global providers, outermost first. Order matters:
 * 1. GestureHandlerRootView — wraps everything that uses gestures (sheets, toasts, swipes).
 * 2. SafeAreaProvider — insets for screens and overlays.
 * 3. KeyboardProvider — native keyboard tracking for smooth keyboard-aware layouts.
 * 4. ThemeProvider — navigation theme + window background from design tokens.
 * 5. QueryProvider — server-state cache (React Query) + native focus/online wiring.
 * 6. BottomSheetModalProvider — host for `BottomSheet` modals (inside Query so sheets can fetch).
 * Overlays render last (on top): PortalHost (dialogs, menus), then the toast host.
 */
export function AppProviders({ children }: PropsWithChildren) {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <ThemeProvider>
            <QueryProvider>
              <BottomSheetModalProvider>
                {children}
                <PortalHost />
                <AppToaster />
              </BottomSheetModalProvider>
            </QueryProvider>
          </ThemeProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
