import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { useAppReady } from '@/lib/bootstrap/use-app-ready';

// Module scope: runs before the first render so the splash can't auto-hide too early.
void SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 200, fade: true });

/** Hides the native splash screen once the app is ready. Renders nothing. */
export function SplashScreenController() {
  const isReady = useAppReady();

  useEffect(() => {
    if (isReady)
      SplashScreen.hide();
  }, [isReady]);

  return null;
}
