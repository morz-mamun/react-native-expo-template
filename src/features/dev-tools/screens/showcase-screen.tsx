import { useState } from 'react';
import { View } from 'react-native';
import { EmptyState } from '@/components/shared/empty-state';

import { ErrorState } from '@/components/shared/error-state';
import { Screen } from '@/components/shared/screen';
import { Badge } from '@/components/ui/badge';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
import { Bell, Heart, Plus, Trash2 } from '@/components/ui/icons';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { ThemePicker } from '@/features/settings/components/theme-picker';
import { toast } from '@/lib/toast';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-3">
      <Text variant="h4">{title}</Text>
      {children}
      <Separator className="mt-3" />
    </View>
  );
}

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Every design-system component and variant on one screen (development/preview only).
 * Use it to review theming, rebranding and accessibility (try large OS font sizes).
 */
export function ShowcaseScreen() {
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(true);
  const [email, setEmail] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const emailError = email.length > 0 && !email.includes('@') ? 'Enter a valid email address' : undefined;

  return (
    <Screen variant="keyboard" contentClassName="gap-6 p-4 pb-16">
      <Section title="Theme">
        <ThemePicker />
      </Section>

      <Section title="Typography">
        <Text variant="h1">Heading 1</Text>
        <Text variant="h2">Heading 2</Text>
        <Text variant="h3">Heading 3</Text>
        <Text variant="h4">Heading 4</Text>
        <Text variant="lead">Lead paragraph for introductions.</Text>
        <Text>Body text — the default. Inter, 16px, foreground color.</Text>
        <Text variant="large">Large emphasis</Text>
        <Text variant="small">Small label</Text>
        <Text variant="muted">Muted helper text</Text>
        <Text variant="code">const answer = 42;</Text>
      </Section>

      <Section title="Buttons">
        <View className="flex-row flex-wrap gap-2">
          <Button><Text>Default</Text></Button>
          <Button variant="secondary"><Text>Secondary</Text></Button>
          <Button variant="outline"><Text>Outline</Text></Button>
          <Button variant="ghost"><Text>Ghost</Text></Button>
          <Button variant="destructive"><Text>Destructive</Text></Button>
          <Button variant="link"><Text>Link</Text></Button>
        </View>
        <View className="flex-row flex-wrap items-center gap-2">
          <Button size="sm"><Text>Small</Text></Button>
          <Button size="lg"><Text>Large</Text></Button>
          <Button size="icon" variant="outline" accessibilityLabel="Like"><Icon as={Heart} /></Button>
          <Button>
            <Icon as={Plus} className="size-4" />
            <Text>With icon</Text>
          </Button>
          <Button disabled><Text>Disabled</Text></Button>
        </View>
        <Button
          loading={loading}
          onPress={async () => {
            setLoading(true);
            await wait(1500);
            setLoading(false);
            toast.success('Saved', { description: 'Loading state keeps the button width stable.' });
          }}
        >
          <Text>Save changes (loading demo)</Text>
        </Button>
      </Section>

      <Section title="Inputs">
        <TextField
          label="Email"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
          helperText="We'll never share your email."
          error={emailError}
        />
        <TextField label="Disabled" value="Read only" editable={false} />
        <View className="flex-row items-center justify-between">
          <Text>Notifications</Text>
          <Switch checked={checked} onCheckedChange={setChecked} accessibilityLabel="Notifications" />
        </View>
      </Section>

      <Section title="Badges">
        <View className="flex-row flex-wrap gap-2">
          <Badge><Text>Default</Text></Badge>
          <Badge variant="secondary"><Text>Secondary</Text></Badge>
          <Badge variant="outline"><Text>Outline</Text></Badge>
          <Badge variant="success"><Text>Success</Text></Badge>
          <Badge variant="warning"><Text>Warning</Text></Badge>
          <Badge variant="destructive"><Text>Destructive</Text></Badge>
        </View>
      </Section>

      <Section title="Card">
        <Card>
          <CardHeader>
            <CardTitle>Card title</CardTitle>
            <CardDescription>Cards group related content and actions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Text>Card content goes here.</Text>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="flex-1"><Text>Cancel</Text></Button>
            <Button className="flex-1"><Text>Confirm</Text></Button>
          </CardFooter>
        </Card>
      </Section>

      <Section title="Skeleton">
        <View className="flex-row items-center gap-3">
          <Skeleton className="size-12 rounded-full" />
          <View className="flex-1 gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </View>
        </View>
      </Section>

      <Section title="Feedback">
        <View className="flex-row flex-wrap gap-2">
          <Button variant="outline" onPress={() => toast.success('Profile updated')}><Text>Success toast</Text></Button>
          <Button variant="outline" onPress={() => toast.error('Could not save', { description: 'Check your connection and try again.' })}><Text>Error toast</Text></Button>
          <Button variant="outline" onPress={() => toast.info('Heads up', { action: { label: 'Undo', onPress: () => toast.success('Undone') } })}><Text>Toast + action</Text></Button>
          <Button variant="outline" onPress={() => toast.promise(wait(1500), { loading: 'Uploading…', success: 'Uploaded', error: 'Upload failed' })}><Text>Promise toast</Text></Button>
        </View>
      </Section>

      <Section title="Overlays">
        <View className="flex-row flex-wrap gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline"><Text>Open dialog</Text></Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete item?</DialogTitle>
                <DialogDescription>This action cannot be undone.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline"><Text>Cancel</Text></Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button variant="destructive" onPress={() => toast.success('Deleted')}>
                    <Icon as={Trash2} className="size-4" />
                    <Text>Delete</Text>
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onPress={() => setSheetOpen(true)}><Text>Open bottom sheet</Text></Button>
        </View>
        <BottomSheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <View className="gap-3">
            <Text variant="h4">Bottom sheet</Text>
            <Text variant="muted">Sizes to its content. Swipe down or tap outside to close.</Text>
            <Button onPress={() => setSheetOpen(false)}><Text>Done</Text></Button>
          </View>
        </BottomSheet>
      </Section>

      <Section title="States">
        <Card className="py-0">
          <EmptyState icon={Bell} title="No notifications" description="You're all caught up." action={{ label: 'Refresh', onPress: () => toast.info('Refreshed') }} className="py-8" />
        </Card>
        <Card className="py-0">
          <ErrorState onRetry={() => toast.info('Retrying…')} className="py-8" />
        </Card>
      </Section>
    </Screen>
  );
}
