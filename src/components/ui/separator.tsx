import * as SeparatorPrimitive from '@rn-primitives/separator';

import { cn } from '@/lib/utils';

/** Hairline divider (RNR). Decorative by default (hidden from screen readers). */
function Separator({ className, orientation = 'horizontal', decorative = true, ...props }: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      decorative={decorative}
      orientation={orientation}
      className={cn('shrink-0 bg-border', orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px', className)}
      {...props}
    />
  );
}

export { Separator };
