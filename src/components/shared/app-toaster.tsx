import { Platform } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';
import { Toaster } from 'sonner-native';
import { useUniwind } from 'uniwind';

import { useColorToken } from '@/lib/theme/use-color-token';

/**
 * Toast host, themed with design tokens. Mounted once at the root (last, so toasts sit above
 * dialogs). On iOS, FullWindowOverlay keeps toasts visible above native modals.
 * Show toasts with `toast` from `@/lib/toast`.
 */
export function AppToaster() {
  const { theme } = useUniwind();
  const card = useColorToken('--color-card');
  const cardForeground = useColorToken('--color-card-foreground');
  const mutedForeground = useColorToken('--color-muted-foreground');
  const border = useColorToken('--color-border');

  return (
    <Toaster
      theme={theme === 'dark' ? 'dark' : 'light'}
      position="top-center"
      duration={4000}
      visibleToasts={3}
      swipeToDismissDirection="up"
      ToasterOverlayWrapper={Platform.OS === 'ios' ? FullWindowOverlay : undefined}
      toastOptions={{
        style: { backgroundColor: card, borderColor: border, borderWidth: 1, borderRadius: 14 },
        titleStyle: { color: cardForeground, fontFamily: 'Inter', fontWeight: '600' },
        descriptionStyle: { color: mutedForeground, fontFamily: 'Inter' },
      }}
    />
  );
}
