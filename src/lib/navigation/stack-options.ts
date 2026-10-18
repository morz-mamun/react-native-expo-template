import type { NativeStackNavigationOptions } from 'expo-router/native-stack';

/**
 * Shared native-stack screen options so every stack looks the same.
 * Colors come from the navigation theme (ThemeProvider); this only sets typography/behavior.
 * Scroll views under large titles need `contentInsetAdjustmentBehavior="automatic"` (see Screen).
 */
export const defaultStackOptions: NativeStackNavigationOptions = {
  headerTitleStyle: { fontFamily: 'Inter', fontWeight: '600' },
  headerLargeTitleStyle: { fontFamily: 'Inter', fontWeight: '700' },
  headerBackButtonDisplayMode: 'minimal',
  headerShadowVisible: false,
};
