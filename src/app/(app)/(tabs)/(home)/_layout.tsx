import { Stack } from 'expo-router';

import { defaultStackOptions } from '@/lib/navigation/stack-options';

export default function HomeStackLayout() {
  return (
    <Stack screenOptions={defaultStackOptions}>
      <Stack.Screen name="index" options={{ title: 'Home', headerLargeTitle: true }} />
    </Stack>
  );
}
