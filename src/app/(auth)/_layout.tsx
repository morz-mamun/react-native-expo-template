import { Stack } from 'expo-router';

/** Signed-out area. Add sign-up / forgot-password screens here. */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
