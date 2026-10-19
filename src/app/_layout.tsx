import { Stack } from 'expo-router';

import { StatusBar } from 'expo-status-bar';
import { OfflineBanner } from '@/components/shared/offline-banner';
import { SplashScreenController } from '@/components/shared/splash-screen-controller';

import { useAppUpdates } from '@/features/app-updates/use-app-updates';
import { useSession } from '@/features/auth/session-store';
import { AppProviders } from '@/providers/app-providers';
import '@/global.css';

export { ErrorFallback as ErrorBoundary } from '@/components/shared/error-fallback';

function RootNavigator() {
  const isSignedIn = useSession(state => state.status === 'signedIn');

  // Stack.Protected: a group is only reachable while its guard is true — including via deep
  // links. Flipping `isSignedIn` (sign in/out, session expiry) moves the user automatically.
  // While the session hydrates, the splash screen covers everything (no login flash).
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
      </Stack.Protected>
      <Stack.Screen name="+not-found" options={{ headerShown: true, title: 'Not found' }} />
    </Stack>
  );
}

export default function RootLayout() {
  useAppUpdates();

  return (
    <AppProviders>
      <SplashScreenController />
      {/* "auto" follows the app's theme (Appearance override), not just the OS. */}
      <StatusBar style="auto" />
      <RootNavigator />
      <OfflineBanner />
    </AppProviders>
  );
}
