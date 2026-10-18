import { Image } from 'expo-image';

import { withUniwind } from 'uniwind';
import { authorAvatarUrl } from '@/features/posts/types';
import { cn } from '@/lib/utils';

const StyledImage = withUniwind(Image);

/**
 * Author avatar via expo-image: memory+disk cache, `recyclingKey` so recycled list cells never
 * flash the previous row's image, and a short cross-fade.
 */
export function PostAvatar({ userId, className }: { userId: number; className?: string }) {
  return (
    <StyledImage
      source={authorAvatarUrl(userId)}
      recyclingKey={String(userId)}
      cachePolicy="memory-disk"
      transition={120}
      contentFit="cover"
      className={cn('size-11 rounded-full bg-muted', className)}
      accessibilityIgnoresInvertColors
      accessible={false}
    />
  );
}
