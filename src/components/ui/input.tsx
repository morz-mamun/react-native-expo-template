import type { TextInput as RNTextInput } from 'react-native';
import { TextInput } from 'react-native';

import { MAX_FONT_SCALE } from '@/components/ui/text';
import { cn } from '@/lib/utils';

type InputProps = React.ComponentProps<typeof RNTextInput> & {
  /** Red border + announced as invalid. Usually set by TextField from an error message. */
  invalid?: boolean;
};

/**
 * Bare text input (RNR-based, 44pt tall). For label/helper/error use `TextField`.
 * Pass `ref` for focus management (`ref.current?.focus()`).
 */
function Input({ className, invalid = false, editable, ...props }: InputProps) {
  return (
    <TextInput
      className={cn(
        'h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 font-sans text-base text-foreground dark:bg-input/30',
        'placeholder:text-muted-foreground',
        invalid && 'border-destructive',
        editable === false && 'opacity-50',
        className,
      )}
      editable={editable}
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      aria-invalid={invalid}
      {...props}
    />
  );
}

export { Input };
export type { InputProps };
