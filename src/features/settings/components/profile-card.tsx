import { Image } from 'expo-image';
import { View } from 'react-native';
import { withUniwind } from 'uniwind';

import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useSession } from '@/features/auth/session-store';
import { displayName } from '@/features/auth/types';

const StyledImage = withUniwind(Image);

/** Signed-in user's name, email and avatar (cached profile → shows instantly on cold start). */
export function ProfileCard() {
  const user = useSession(state => state.user);

  return (
    <View className="flex-row items-center gap-4 rounded-xl border border-border bg-card p-4">
      {user?.image
        ? <StyledImage source={user.image} cachePolicy="memory-disk" transition={120} className="size-14 rounded-full bg-muted" accessible={false} />
        : <View className="size-14 rounded-full bg-muted" />}
      {user
        ? (
            <View className="flex-1 gap-0.5">
              <Text variant="large" numberOfLines={1}>{displayName(user)}</Text>
              <Text variant="muted" numberOfLines={1}>{user.email}</Text>
            </View>
          )
        : (
            <View className="flex-1 gap-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-44" />
            </View>
          )}
    </View>
  );
}
