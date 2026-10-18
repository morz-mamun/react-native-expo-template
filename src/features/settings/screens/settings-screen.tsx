import { Link } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Screen } from '@/components/shared/screen';
import { Icon } from '@/components/ui/icon';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { SettingsRow, SettingsSection } from '@/features/settings/components/settings-section';
import { ThemePicker } from '@/features/settings/components/theme-picker';
import { Env } from '@/lib/env';
import { usePreferences } from '@/stores/preferences-store';

export function SettingsScreen() {
  const hapticsEnabled = usePreferences(state => state.hapticsEnabled);
  const setHapticsEnabled = usePreferences(state => state.setHapticsEnabled);

  return (
    <Screen contentClassName="gap-6 p-4">
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
              <SettingsRow label="Design system" description="All components and variants" last right={<Icon as={ChevronRight} className="size-5 text-muted-foreground" />} />
            </Pressable>
          </Link>
        </SettingsSection>
      )}

      <SettingsSection title="About">
        <SettingsRow label="Version" right={<Text variant="muted">{Env.VERSION}</Text>} />
        <SettingsRow label="Environment" right={<Text variant="muted">{Env.APP_ENV}</Text>} />
        <SettingsRow label="API" last right={<Text variant="muted" numberOfLines={1} className="max-w-48">{Env.API_URL}</Text>} />
      </SettingsSection>
    </Screen>
  );
}
