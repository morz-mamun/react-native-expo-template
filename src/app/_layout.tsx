import { Stack } from 'expo-router';

import { StatusBar } from 'expo-status-bar';
import { SplashScreenController } from '@/components/shared/splash-screen-controller';

import { AppProviders } from '@/providers/app-providers';
import '@/global.css';

export { ErrorFallback as ErrorBoundary } from '@/components/shared/error-fallback';

export default function RootLayout() {
  return (
    <AppProviders>
      <SplashScreenController />
      {/* "auto" follows the app's theme (Appearance override), not just the OS. */}
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(app)" />
        <Stack.Screen name="+not-found" options={{ headerShown: true, title: 'Not found' }} />
      </Stack>
    </AppProviders>
  );
}
