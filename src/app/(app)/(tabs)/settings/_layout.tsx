import { Stack } from 'expo-router';

import { defaultStackOptions } from '@/lib/navigation/stack-options';

export default function SettingsStackLayout() {
  return (
    <Stack screenOptions={defaultStackOptions}>
      <Stack.Screen name="index" options={{ title: 'Settings', headerLargeTitle: true }} />
    </Stack>
  );
}
