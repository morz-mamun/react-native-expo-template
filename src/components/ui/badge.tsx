import type { VariantProps } from 'class-variance-authority';
import { Slot } from '@rn-primitives/slot';
import { cva } from 'class-variance-authority';
import { View } from 'react-native';

import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';

const badgeVariants = cva('shrink-0 flex-row items-center justify-center gap-1 self-start overflow-hidden rounded-full border px-2 py-0.5', {
  variants: {
    variant: {
      default: 'border-transparent bg-primary',
      secondary: 'border-transparent bg-secondary',
      destructive: 'border-transparent bg-destructive',
      success: 'border-transparent bg-success',
      warning: 'border-transparent bg-warning',
      outline: 'border-border',
    },
  },
  defaultVariants: { variant: 'default' },
});

const badgeTextVariants = cva('font-sans text-xs font-medium', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      destructive: 'text-destructive-foreground',
      success: 'text-success-foreground',
      warning: 'text-warning-foreground',
      outline: 'text-foreground',
    },
  },
  defaultVariants: { variant: 'default' },
});

type BadgeProps = React.ComponentProps<typeof View> & VariantProps<typeof badgeVariants> & { asChild?: boolean };

/** Small status label (RNR + success/warning variants). Put `<Text>` inside. */
function Badge({ className, variant, asChild, ...props }: BadgeProps) {
  const Component = asChild ? Slot : View;
  return (
    <TextClassContext value={badgeTextVariants({ variant })}>
      <Component className={cn(badgeVariants({ variant }), className)} {...props} />
    </TextClassContext>
  );
}

export { Badge, badgeTextVariants, badgeVariants };
export type { BadgeProps };
