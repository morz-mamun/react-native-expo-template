import { ScrollView, StyleSheet, Text, useColorScheme } from 'react-native';

import { Env } from '@/lib/env';

/** Placeholder — replaced by the design-system version in Phase 2. */
export function HomeScreen() {
  const isDark = useColorScheme() === 'dark';

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <Text style={[styles.title, isDark && styles.light]}>Welcome 👋</Text>
      <Text style={styles.muted}>
        {Env.APP_NAME}
        {' '}
        · v
        {Env.VERSION}
        {' '}
        ·
        {Env.APP_ENV}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 8 },
  title: { fontFamily: 'Inter', fontSize: 22, fontWeight: '600', color: '#09090B' },
  light: { color: '#FAFAFA' },
  muted: { fontFamily: 'Inter', fontSize: 15, color: '#71717A' },
});
