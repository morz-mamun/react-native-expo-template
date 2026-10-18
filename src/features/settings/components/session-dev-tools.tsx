import { Pressable } from 'react-native';

import { Text } from '@/components/ui/text';
import { fetchCurrentUser } from '@/features/auth/api';
import { SettingsRow } from '@/features/settings/components/settings-section';
import { tokenStorage } from '@/lib/auth/token-storage';
import { toast } from '@/lib/toast';

/**
 * Dev/preview-only buttons to exercise the auth edge cases on a real device:
 * - expired access token → 401 → single refresh → original request retried transparently
 * - revoked refresh token → refresh fails → signed out with a "session expired" message
 */
export function SessionDevTools() {
  return (
    <>
      <Pressable
        className="active:bg-accent"
        role="button"
        onPress={async () => {
          tokenStorage.debugInvalidateAccessToken();
          try {
            await Promise.all([fetchCurrentUser(), fetchCurrentUser(), fetchCurrentUser()]);
            toast.success('Token refreshed', { description: '3 parallel 401s → 1 refresh → all retried.' });
          }
          catch (error) {
            toast.error('Refresh test failed', { description: String(error) });
          }
        }}
      >
        <SettingsRow label="Expire access token" description="Tests 401 → refresh → retry" right={<Text variant="muted">Run</Text>} />
      </Pressable>
      <Pressable
        className="active:bg-accent"
        role="button"
        onPress={() => {
          tokenStorage.debugInvalidateRefreshToken();
          fetchCurrentUser().catch(() => {}); // refresh fails → session store signs out
        }}
      >
        <SettingsRow label="Expire whole session" description="Tests forced sign-out" right={<Text variant="muted">Run</Text>} last />
      </Pressable>
    </>
  );
}
