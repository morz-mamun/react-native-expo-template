import type { VariantProps } from 'class-variance-authority';
import type { GestureResponderEvent } from 'react-native';
import type { HapticIntent } from '@/lib/haptics';
import { cva } from 'class-variance-authority';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { TextClassContext } from '@/components/ui/text';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';

/**
 * Based on React Native Reusables (Uniwind). Mobile adaptations:
 * - ≥ 44pt touch targets (default/lg/icon are 44+; `sm` extends its hit area with hitSlop)
 * - `loading`: spinner, presses ignored, size stays stable, announced as busy
 * - `haptic`: semantic feedback on press (defaults to `tap` for primary/destructive)
 */
const buttonVariants = cva('group shrink-0 flex-row items-center justify-center gap-2 rounded-lg', {
  variants: {
    variant: {
      default: 'bg-primary active:opacity-90',
      destructive: 'bg-destructive active:opacity-90',
      outline: 'border border-border bg-background active:bg-accent dark:border-input dark:bg-input/30',
      secondary: 'bg-secondary active:opacity-80',
      ghost: 'active:bg-accent',
      link: '',
    },
    size: {
      default: 'h-11 px-4',
      sm: 'h-9 gap-1.5 px-3',
      lg: 'h-12 px-6',
      icon: 'size-11',
    },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

const buttonTextVariants = cva('font-sans text-base font-medium text-foreground', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      destructive: 'text-destructive-foreground',
      outline: 'group-active:text-accent-foreground',
      secondary: 'text-secondary-foreground',
      ghost: 'group-active:text-accent-foreground',
      link: 'text-primary group-active:underline',
    },
    size: { default: '', sm: 'text-sm', lg: '', icon: '' },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

const spinnerVariants = cva('', {
  variants: {
    variant: {
      default: 'accent-primary-foreground',
      destructive: 'accent-destructive-foreground',
      outline: 'accent-foreground',
      secondary: 'accent-secondary-foreground',
      ghost: 'accent-foreground',
      link: 'accent-primary',
    },
  },
  defaultVariants: { variant: 'default' },
});

type ButtonProps = React.ComponentProps<typeof Pressable>
  & VariantProps<typeof buttonVariants> & {
    /** Shows a spinner, blocks presses and marks the button busy. */
    loading?: boolean;
    /** Haptic on press. `false` disables. Defaults to `tap` for default/destructive variants. */
    haptic?: HapticIntent | false;
  };

const SMALL_HIT_SLOP = { top: 4, bottom: 4, left: 0, right: 0 };

function Button({ className, variant, size, loading = false, haptic, disabled, onPress, children, ...props }: ButtonProps) {
  const isDisabled = Boolean(disabled) || loading;
  const hapticIntent = haptic ?? (variant === 'default' || variant === 'destructive' || variant == null ? 'tap' : false);

  function handlePress(event: GestureResponderEvent) {
    if (hapticIntent)
      haptics[hapticIntent]();
    onPress?.(event);
  }

  return (
    <TextClassContext value={buttonTextVariants({ variant, size })}>
      <Pressable
        role="button"
        className={cn(isDisabled && !loading && 'opacity-50', buttonVariants({ variant, size }), className)}
        disabled={isDisabled}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        hitSlop={size === 'sm' ? SMALL_HIT_SLOP : undefined}
        onPress={handlePress}
        {...props}
      >
        {state => (
          <>
            {/* Content stays laid out (invisible) while loading, so the width never jumps. */}
            <View className={cn('flex-row items-center justify-center gap-2', loading && 'opacity-0')}>
              {typeof children === 'function' ? children(state) : children}
            </View>
            {loading && (
              <View className="absolute inset-0 items-center justify-center">
                <ActivityIndicator colorClassName={spinnerVariants({ variant })} size="small" />
              </View>
            )}
          </>
        )}
      </Pressable>
    </TextClassContext>
  );
}

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
