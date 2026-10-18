import { Stack } from 'expo-router';

import { NewPostButton } from '@/features/posts/components/new-post-button';
import { defaultStackOptions } from '@/lib/navigation/stack-options';

export default function PostsStackLayout() {
  return (
    <Stack screenOptions={defaultStackOptions}>
      <Stack.Screen name="index" options={{ title: 'Posts', headerLargeTitle: true, headerRight: () => <NewPostButton /> }} />
      <Stack.Screen name="[id]" options={{ title: '' }} />
    </Stack>
  );
}
