import type { InputProps } from '@/components/ui/input';
import { useId, useRef } from 'react';
import { View } from 'react-native';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

type TextFieldProps = InputProps & {
  label?: string;
  /** Hint shown below the field when there is no error. */
  helperText?: string;
  /** Error message; when set it replaces the helper text and marks the input invalid. */
  error?: string;
  containerClassName?: string;
};

/**
 * Label + Input + helper/error text, wired for accessibility.
 * Tapping the label focuses the input.
 */
function TextField({ label, helperText, error, containerClassName, ref, ...props }: TextFieldProps) {
  const id = useId();
  const localRef = useRef<React.ComponentRef<typeof Input>>(null);
  const inputRef = ref ?? localRef;
  const message = error ?? helperText;

  return (
    <View className={cn('gap-1.5', containerClassName)}>
      {label && (
        <Label nativeID={`${id}-label`} onPress={() => typeof inputRef === 'object' && inputRef?.current?.focus()}>
          {label}
        </Label>
      )}
      <Input
        ref={inputRef}
        invalid={Boolean(error)}
        aria-labelledby={label ? `${id}-label` : undefined}
        accessibilityHint={error ?? helperText}
        {...props}
      />
      {message && (
        <Text
          variant="muted"
          className={cn(error && 'text-destructive')}
          accessibilityLiveRegion={error ? 'polite' : 'none'}
          role={error ? 'alert' : undefined}
        >
          {message}
        </Text>
      )}
    </View>
  );
}

export { TextField };
export type { TextFieldProps };
