import { Link } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { Icon } from '@/components/ui/icon';

/** Header action that opens the create-post modal. */
export function NewPostButton() {
  return (
    <Link href="/new-post" asChild>
      <Pressable accessibilityLabel="New post" role="button" hitSlop={10} className="size-9 items-center justify-center">
        <Icon as={Plus} className="size-6 text-primary" />
      </Pressable>
    </Link>
  );
}
