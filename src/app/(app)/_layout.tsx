import { Stack } from 'expo-router';

/**
 * Authenticated area. The tab navigator lives in `(tabs)`; screens that should cover the
 * tab bar (full-screen flows, modals) are added to this stack next to it.
 */
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
