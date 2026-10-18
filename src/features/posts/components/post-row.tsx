import type { Post } from '@/features/posts/types';
import { Eye, ThumbsUp } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { PostAvatar } from '@/features/posts/components/post-avatar';
import { cn } from '@/lib/utils';

type PostRowProps = {
  post: Post;
  /** Fires on touch-down — start loading the detail before navigation commits. */
  onPressIn: (post: Post) => void;
  onPress: (post: Post) => void;
};

/** One list row. Keep rows cheap: no hooks that fetch, no heavy computation. */
export function PostRow({ post, onPressIn, onPress }: PostRowProps) {
  const isPending = post.id < 0; // optimistic, not yet saved

  return (
    <Pressable
      onPressIn={() => onPressIn(post)}
      onPress={() => onPress(post)}
      disabled={isPending}
      role="button"
      accessibilityHint="Opens the post"
      className={cn('flex-row gap-3 px-4 py-3 active:bg-accent', isPending && 'opacity-60')}
    >
      <PostAvatar userId={post.userId} />
      <View className="flex-1 gap-1">
        <Text className="font-semibold" numberOfLines={1}>{post.title}</Text>
        <Text variant="muted" numberOfLines={2}>{post.body}</Text>
        <View className="mt-1 flex-row items-center gap-4">
          <View className="flex-row items-center gap-1">
            <Icon as={ThumbsUp} className="size-3.5 text-muted-foreground" />
            <Text variant="muted" className="text-xs">{post.reactions.likes}</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Icon as={Eye} className="size-3.5 text-muted-foreground" />
            <Text variant="muted" className="text-xs">{post.views}</Text>
          </View>
          {isPending && <Text variant="muted" className="text-xs">Publishing…</Text>}
        </View>
      </View>
    </Pressable>
  );
}
