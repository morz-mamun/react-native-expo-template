import { Stack } from 'expo-router';

import { Env } from '@/lib/env';
import { defaultStackOptions } from '@/lib/navigation/stack-options';

/** Developer screens (design-system showcase) exist in development and preview builds only. */
const showDevTools = Env.APP_ENV !== 'production';

/**
 * Main app area. The tab navigator lives in `(tabs)`; screens that should cover the
 * tab bar (full-screen flows, modals) are added to this stack next to it.
 */
export default function AppLayout() {
  return (
    <Stack screenOptions={{ ...defaultStackOptions, headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Protected guard={showDevTools}>
        <Stack.Screen name="showcase" options={{ headerShown: true, title: 'Design system' }} />
      </Stack.Protected>
    </Stack>
  );
}
