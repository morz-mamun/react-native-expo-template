import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { usePreferences } from '@/stores/preferences-store';

function run(feedback: () => Promise<void>) {
  if (Platform.OS === 'web' || !usePreferences.getState().hapticsEnabled)
    return;
  // Fire-and-forget: haptics must never block or throw into UI code.
  feedback().catch(() => {});
}

/**
 * Semantic haptics — call by intent, not by engine. Respects the user's "Haptics" setting.
 *
 * - `tap`: primary button press, pull-to-refresh trigger
 * - `selection`: toggles, pickers, tab/segment changes
 * - `success` / `warning` / `error`: outcome of an action (wired into toasts)
 */
export const haptics = {
  tap: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  selection: () => run(() => Haptics.selectionAsync()),
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};

export type HapticIntent = keyof typeof haptics;
