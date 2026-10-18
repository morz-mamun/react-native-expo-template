import type { Theme } from 'expo-router';
import type { PropsWithChildren } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { useUniwind } from 'uniwind';

import { useColorToken } from '@/lib/theme/use-color-token';

// Importing the store applies the persisted theme before the first frame.
import '@/stores/preferences-store';

/**
 * Bridges design tokens to native UI that can't use classNames:
 * - React Navigation theme (native headers, back buttons, screen backgrounds)
 * - Root window background (no white flash during transitions/keyboard in dark mode)
 */
export function ThemeProvider({ children }: PropsWithChildren) {
  const { theme } = useUniwind();
  const isDark = theme === 'dark';
  const base = isDark ? DarkTheme : DefaultTheme;

  const background = useColorToken('--color-background');
  const foreground = useColorToken('--color-foreground');
  const card = useColorToken('--color-card');
  const border = useColorToken('--color-border');
  const primary = useColorToken('--color-primary');
  const destructive = useColorToken('--color-destructive');

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(background).catch(() => {});
  }, [background]);

  const navigationTheme: Theme = {
    ...base,
    colors: { ...base.colors, background, card, text: foreground, border, primary, notification: destructive },
  };

  return <NavigationThemeProvider value={navigationTheme}>{children}</NavigationThemeProvider>;
}
