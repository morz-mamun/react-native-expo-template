import { ScrollView, StyleSheet, Text } from 'react-native';

import { Env } from '@/lib/env';

/** Placeholder — theme, haptics, account and "About" sections arrive in later phases. */
export function SettingsScreen() {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <Text style={styles.muted}>
        API:
        {Env.API_URL}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 8 },
  muted: { fontFamily: 'Inter', fontSize: 15, color: '#71717A' },
});
