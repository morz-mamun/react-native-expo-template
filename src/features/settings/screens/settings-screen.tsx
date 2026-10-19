import { Link } from 'expo-router';
import { Alert, Pressable, View } from 'react-native';
import { Screen } from '@/components/shared/screen';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ChevronRight, LogOut } from '@/components/ui/icons';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { getUpdateInfo } from '@/features/app-updates/use-app-updates';
import { useSession } from '@/features/auth/session-store';
import { ProfileCard } from '@/features/settings/components/profile-card';
import { SessionDevTools } from '@/features/settings/components/session-dev-tools';
import { SettingsRow, SettingsSection } from '@/features/settings/components/settings-section';
import { ThemePicker } from '@/features/settings/components/theme-picker';
import { Env } from '@/lib/env';
import { usePreferences } from '@/stores/preferences-store';

export function SettingsScreen() {
  const hapticsEnabled = usePreferences(state => state.hapticsEnabled);
  const setHapticsEnabled = usePreferences(state => state.setHapticsEnabled);
  const signOut = useSession(state => state.signOut);
  const update = getUpdateInfo();

  const confirmSignOut = () =>
    Alert.alert('Sign out?', 'You\'ll need to sign in again to use the app.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
    ]);

  return (
    <Screen contentClassName="gap-6 p-4">
      <ProfileCard />

      <SettingsSection title="Appearance">
        <SettingsRow label="Theme" last />
        <View className="px-4 pb-4">
          <ThemePicker />
        </View>
      </SettingsSection>

      <SettingsSection title="Feedback">
        <SettingsRow
          label="Haptics"
          description="Vibration feedback on taps and actions"
          last
          right={<Switch checked={hapticsEnabled} onCheckedChange={setHapticsEnabled} accessibilityLabel="Haptics" />}
        />
      </SettingsSection>

      {Env.APP_ENV !== 'production' && (
        <SettingsSection title="Developer" footer="Only visible in development and preview builds.">
          <Link href="/showcase" asChild>
            <Pressable className="active:bg-accent" role="link">
              <SettingsRow label="Design system" description="All components and variants" right={<Icon as={ChevronRight} className="size-5 text-muted-foreground" />} />
            </Pressable>
          </Link>
          <SessionDevTools />
        </SettingsSection>
      )}

      <SettingsSection title="About" footer="Include these details when reporting a bug.">
        <SettingsRow label="Version" right={<Text variant="muted">{Env.VERSION}</Text>} />
        <SettingsRow label="Environment" right={<Text variant="muted">{Env.APP_ENV}</Text>} />
        <SettingsRow label="Update channel" right={<Text variant="muted">{update.channel}</Text>} />
        <SettingsRow label="Runtime version" right={<Text variant="muted" numberOfLines={1} className="max-w-40">{update.runtimeVersion}</Text>} />
        <SettingsRow label="Update" right={<Text variant="muted">{update.updateId}</Text>} />
        <SettingsRow label="API" last right={<Text variant="muted" numberOfLines={1} className="max-w-48">{Env.API_URL}</Text>} />
      </SettingsSection>

      <Button variant="outline" onPress={confirmSignOut} testID="sign-out">
        <Icon as={LogOut} className="size-4 text-destructive" />
        <Text className="text-destructive">Sign out</Text>
      </Button>
    </Screen>
  );
}
