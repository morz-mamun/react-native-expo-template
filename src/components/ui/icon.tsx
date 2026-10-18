import type { LucideIcon, LucideProps } from 'lucide-react-native';
import * as React from 'react';
import { withUniwind } from 'uniwind';

import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';

type IconProps = LucideProps & { as: LucideIcon };

function IconImpl({ as: IconComponent, ...props }: IconProps) {
  return <IconComponent {...props} />;
}

// Maps `className` → `size` (from width) and `color` (from text color).
const StyledIcon = withUniwind(IconImpl, {
  size: { fromClassName: 'className', styleProperty: 'width' },
  color: { fromClassName: 'className', styleProperty: 'color' },
});

/**
 * The ONE way to render an icon. Swapping icon libraries later only touches this file.
 * Inherits text color from Button/Badge via TextClassContext.
 *
 * @example <Icon as={ArrowRight} className="size-4 text-muted-foreground" />
 */
function Icon({ as: IconComponent, className, ...props }: IconProps) {
  const textClass = React.use(TextClassContext);
  return <StyledIcon as={IconComponent} className={cn('size-5 text-foreground', textClass, className)} {...props} />;
}

export { Icon };
export type { IconProps };
