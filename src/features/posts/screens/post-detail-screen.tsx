import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Eye, ThumbsDown, ThumbsUp } from 'lucide-react-native';
import { View } from 'react-native';

import { ErrorState } from '@/components/shared/error-state';
import { Screen } from '@/components/shared/screen';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { findPostInLists, postQueries, useLikePost } from '@/features/posts/api';
import { PostAvatar } from '@/features/posts/components/post-avatar';

function Stat({ icon, value, label }: { icon: typeof Eye; value: number; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5" accessible accessibilityLabel={`${value} ${label}`}>
      <Icon as={icon} className="size-4 text-muted-foreground" />
      <Text variant="muted">{value}</Text>
    </View>
  );
}

function DetailSkeleton() {
  return (
    <View className="gap-4 p-4">
      <View className="flex-row items-center gap-3">
        <Skeleton className="size-11 rounded-full" />
        <Skeleton className="h-4 w-28" />
      </View>
      <Skeleton className="h-7 w-4/5" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </View>
  );
}

export function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const postId = Number(id);
  const queryClient = useQueryClient();
  const likePost = useLikePost();

  const { data: post, isPending, isError, error, refetch, isRefetching } = useQuery({
    ...postQueries.detail(postId),
    enabled: Number.isInteger(postId) && postId > 0,
    // Seed from the list cache → real content on the first frame, full record replaces it.
    placeholderData: () => findPostInLists(queryClient, postId),
  });

  return (
    <>
      <Stack.Screen options={{ title: post ? `Post #${post.id}` : '' }} />
      {post
        ? (
            <Screen contentClassName="gap-4 p-4 pb-12">
              <View className="flex-row items-center gap-3">
                <PostAvatar userId={post.userId} />
                <Text variant="small">
                  User #
                  {post.userId}
                </Text>
              </View>
              <Text variant="h2">{post.title}</Text>
              {post.tags.length > 0 && (
                <View className="flex-row flex-wrap gap-2">
                  {post.tags.map(tag => (
                    <Badge key={tag} variant="secondary">
                      <Text>
                        #
                        {tag}
                      </Text>
                    </Badge>
                  ))}
                </View>
              )}
              <Text className="leading-7">{post.body}</Text>
              <Separator />
              <View className="flex-row items-center gap-6">
                <Button
                  variant="outline"
                  size="sm"
                  haptic="selection"
                  accessibilityLabel={`Like, ${post.reactions.likes} likes`}
                  onPress={() => likePost.mutate({ id: post.id, likes: post.reactions.likes + 1, dislikes: post.reactions.dislikes })}
                >
                  <Icon as={ThumbsUp} className="size-4" />
                  <Text>{post.reactions.likes}</Text>
                </Button>
                <Stat icon={ThumbsDown} value={post.reactions.dislikes} label="dislikes" />
                <Stat icon={Eye} value={post.views} label="views" />
              </View>
            </Screen>
          )
        : isError
          ? <ErrorState title="Couldn't load post" message={error.message} onRetry={() => void refetch()} retrying={isRefetching} />
          : isPending && <DetailSkeleton />}
    </>
  );
}
