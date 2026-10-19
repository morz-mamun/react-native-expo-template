import { Link } from 'expo-router';
import { Palette, Rocket } from 'lucide-react-native';

import { Screen } from '@/components/shared/screen';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Env } from '@/lib/env';

/** Placeholder home — replace with your app's first real screen. */
export function HomeScreen() {
  return (
    <Screen testID="home-screen">
      <Card>
        <CardHeader>
          <Badge variant="secondary">
            <Text>{Env.APP_ENV}</Text>
          </Badge>
          <CardTitle className="mt-2">Welcome 👋</CardTitle>
          <CardDescription>
            {Env.APP_NAME}
            {' '}
            v
            {Env.VERSION}
            {' '}
            — a production-ready Expo starter. Build your first feature in src/features.
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-2">
          <Text variant="muted">• Native tabs and stacks, typed routes</Text>
          <Text variant="muted">• Design tokens with light and dark themes</Text>
          <Text variant="muted">• Toasts, haptics, dialogs and bottom sheets</Text>
        </CardContent>
        {Env.APP_ENV !== 'production' && (
          <CardFooter>
            <Link href="/showcase" asChild>
              <Button variant="outline" className="flex-1">
                <Icon as={Palette} className="size-4" />
                <Text>Open design system</Text>
              </Button>
            </Link>
          </CardFooter>
        )}
      </Card>

      <Card>
        <CardHeader>
          <Icon as={Rocket} className="size-6 text-muted-foreground" />
          <CardTitle className="mt-1">Next up</CardTitle>
          <CardDescription>Data fetching, authentication and offline support arrive in the next phases.</CardDescription>
        </CardHeader>
      </Card>
    </Screen>
  );
}
