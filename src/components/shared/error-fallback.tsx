import type { ErrorBoundaryProps } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Route-level error fallback. Export it as `ErrorBoundary` from any route or layout:
 *
 *   export { ErrorFallback as ErrorBoundary } from '@/components/shared/error-fallback';
 *
 * It may render outside app providers (when a layout itself crashes), so it only uses
 * plain React Native primitives — no theme, query client or design-system components.
 */
export function ErrorFallback({ error, retry }: ErrorBoundaryProps) {
  const isDark = useColorScheme() === 'dark';

  useEffect(() => {
    // Extension point: report to your crash reporter here (e.g. Sentry.captureException).
    console.error('[ErrorBoundary]', error);
  }, [error]);

  return (
    <SafeAreaView style={[styles.root, isDark && styles.rootDark]}>
      <View style={styles.content}>
        <Text style={[styles.title, isDark && styles.textDark]} accessibilityRole="header">
          Something went wrong
        </Text>
        <Text style={[styles.message, isDark && styles.mutedDark]}>
          {__DEV__ ? error.message : 'An unexpected error occurred. Please try again.'}
        </Text>
        <Pressable
          onPress={() => void retry()}
          accessibilityRole="button"
          accessibilityLabel="Try again"
          style={({ pressed }) => [styles.button, isDark && styles.buttonDark, pressed && styles.pressed]}
        >
          <Text style={[styles.buttonLabel, isDark && styles.buttonLabelDark]}>Try again</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  rootDark: { backgroundColor: '#09090B' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  title: { fontFamily: 'Inter', fontSize: 20, fontWeight: '600', color: '#09090B' },
  textDark: { color: '#FAFAFA' },
  message: { fontFamily: 'Inter', fontSize: 15, color: '#71717A', textAlign: 'center' },
  mutedDark: { color: '#A1A1AA' },
  button: {
    marginTop: 8,
    minHeight: 44,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingHorizontal: 20,
    backgroundColor: '#18181B',
  },
  buttonDark: { backgroundColor: '#FAFAFA' },
  pressed: { opacity: 0.8 },
  buttonLabel: { fontFamily: 'Inter', fontSize: 15, fontWeight: '600', color: '#FAFAFA' },
  buttonLabelDark: { color: '#18181B' },
});
