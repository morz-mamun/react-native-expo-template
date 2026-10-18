import * as LabelPrimitive from '@rn-primitives/label';

import { MAX_FONT_SCALE } from '@/components/ui/text';
import { cn } from '@/lib/utils';

/** Form label (RNR). Pressing it can focus/toggle its control via `onPress`. */
function Label({ className, onPress, onLongPress, onPressIn, onPressOut, disabled, ...props }: React.ComponentProps<typeof LabelPrimitive.Text>) {
  return (
    <LabelPrimitive.Root
      className={cn('flex-row items-center gap-2', disabled && 'opacity-50')}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
    >
      <LabelPrimitive.Text
        className={cn('font-sans text-sm font-medium text-foreground', className)}
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        {...props}
      />
    </LabelPrimitive.Root>
  );
}

export { Label };
