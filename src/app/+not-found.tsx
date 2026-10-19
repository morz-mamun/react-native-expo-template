import { Link } from 'expo-router';

import { EmptyState } from '@/components/shared/empty-state';
import { Screen } from '@/components/shared/screen';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export default function NotFoundScreen() {
  return (
    <Screen variant="static" className="items-center justify-center">
      <EmptyState title="Page not found" description="This screen doesn't exist or was moved." className="flex-none" />
      <Link href="/" asChild>
        <Button variant="outline">
          <Text>Go to home</Text>
        </Button>
      </Link>
    </Screen>
  );
}
