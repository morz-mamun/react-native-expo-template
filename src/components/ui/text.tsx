import type { VariantProps } from 'class-variance-authority';
import type { Role } from 'react-native';
import { Slot } from '@rn-primitives/slot';
import { cva } from 'class-variance-authority';
import * as React from 'react';
import { Text as RNText } from 'react-native';

import { cn } from '@/lib/utils';

/**
 * Typography scale. Based on React Native Reusables (Uniwind), adapted for mobile:
 * left-aligned headings, body = 16px, and a capped font scale (see MAX_FONT_SCALE).
 */
const textVariants = cva('font-sans text-base text-foreground', {
  variants: {
    variant: {
      default: '',
      h1: 'text-3xl font-bold tracking-tight',
      h2: 'text-2xl font-semibold tracking-tight',
      h3: 'text-xl font-semibold tracking-tight',
      h4: 'text-lg font-semibold tracking-tight',
      lead: 'text-lg text-muted-foreground',
      large: 'text-lg font-semibold',
      small: 'text-sm font-medium leading-none',
      muted: 'text-sm text-muted-foreground',
      label: 'text-sm font-medium',
      code: 'rounded bg-muted px-1 py-0.5 font-mono text-sm font-semibold',
    },
  },
  defaultVariants: { variant: 'default' },
});

type TextVariant = NonNullable<VariantProps<typeof textVariants>['variant']>;

const ROLE: Partial<Record<TextVariant, Role>> = { h1: 'heading', h2: 'heading', h3: 'heading', h4: 'heading' };

/**
 * Upper bound for OS font scaling. Text still grows for accessibility, but layouts don't explode
 * at the largest accessibility sizes. Raise it if your screens can handle more.
 */
export const MAX_FONT_SCALE = 1.6;

/** Lets parents (Button, Badge, Card) set the text style of nested `<Text>` without props. */
const TextClassContext = React.createContext<string | undefined>(undefined);

type TextProps = React.ComponentProps<typeof RNText>
  & VariantProps<typeof textVariants> & {
    asChild?: boolean;
  };

function Text({ className, asChild = false, variant = 'default', ...props }: TextProps) {
  const textClass = React.use(TextClassContext);
  const Component = asChild ? Slot : RNText;
  return (
    <Component
      className={cn(textVariants({ variant }), textClass, className)}
      role={variant ? ROLE[variant] : undefined}
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      {...props}
    />
  );
}

export { Text, TextClassContext, textVariants };
export type { TextProps };
