import { View } from 'react-native';

import { Text, TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';

type ViewProps = React.ComponentProps<typeof View>;
type TextProps = React.ComponentProps<typeof Text>;

/** Surface for grouped content (RNR). Compose with CardHeader/Title/Description/Content/Footer. */
function Card({ className, ...props }: ViewProps) {
  return (
    <TextClassContext value="text-card-foreground">
      <View className={cn('gap-4 rounded-xl border border-border bg-card py-5', className)} {...props} />
    </TextClassContext>
  );
}

function CardHeader({ className, ...props }: ViewProps) {
  return <View className={cn('gap-1.5 px-5', className)} {...props} />;
}

function CardTitle({ className, ...props }: TextProps) {
  return <Text role="heading" className={cn('text-lg font-semibold leading-none', className)} {...props} />;
}

function CardDescription({ className, ...props }: TextProps) {
  return <Text className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

function CardContent({ className, ...props }: ViewProps) {
  return <View className={cn('px-5', className)} {...props} />;
}

function CardFooter({ className, ...props }: ViewProps) {
  return <View className={cn('flex-row items-center gap-2 px-5', className)} {...props} />;
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
