import { toast as sonner } from 'sonner-native';

import { haptics } from '@/lib/haptics';

interface ToastOptions {
  description?: string;
  /** ms; defaults to the Toaster's duration. */
  duration?: number;
  action?: { label: string; onPress: () => void };
}

function toSonner({ description, duration, action }: ToastOptions = {}) {
  return {
    description,
    duration,
    action: action && { label: action.label, onClick: action.onPress },
  };
}

/**
 * App toast API. Screens import THIS, never `sonner-native` directly, so the library can be
 * swapped in one file. Success/error toasts also fire the matching haptic.
 */
export const toast = {
  success(title: string, options?: ToastOptions) {
    haptics.success();
    return sonner.success(title, toSonner(options));
  },
  error(title: string, options?: ToastOptions) {
    haptics.error();
    return sonner.error(title, toSonner(options));
  },
  info(title: string, options?: ToastOptions) {
    return sonner.info(title, toSonner(options));
  },
  warning(title: string, options?: ToastOptions) {
    haptics.warning();
    return sonner.warning(title, toSonner(options));
  },
  /** Loading → success/error toast that follows a promise. Returns the original promise. */
  promise<T>(promise: Promise<T>, messages: { loading: string; success: string | ((result: T) => string); error: string | ((error: unknown) => string) }) {
    sonner.promise(promise, {
      loading: messages.loading,
      success: (result) => {
        haptics.success();
        return typeof messages.success === 'function' ? messages.success(result) : messages.success;
      },
      error: (error) => {
        haptics.error();
        return typeof messages.error === 'function' ? messages.error(error) : messages.error;
      },
    });
    return promise;
  },
  dismiss(id?: string | number) {
    sonner.dismiss(id);
  },
};
