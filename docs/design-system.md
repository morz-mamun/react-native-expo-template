# Design system

The UI is built from **design tokens**, a small set of **primitives** and a few **shared composites**. Everything is themeable (light, dark or system) and accessible by default.

| Layer | Where | What |
| --- | --- | --- |
| Tokens | [`src/global.css`](../src/global.css) | Colors, radii and fonts as CSS variables, with light and dark values |
| Primitives | [`src/components/ui/`](../src/components/ui) | Text, Button, Input, TextField, Label, Card, Badge, Separator, Skeleton, Switch, Dialog, BottomSheet, Icon |
| Composites | [`src/components/shared/`](../src/components/shared) | Screen, List, EmptyState, ErrorState, ErrorFallback, AppToaster |
| Feedback | [`src/lib/toast.ts`](../src/lib/toast.ts), [`src/lib/haptics.ts`](../src/lib/haptics.ts) | Toasts and semantic haptics |

**Stack:** [Uniwind](https://docs.uniwind.dev) (Tailwind v4 for React Native) plus components based on [React Native Reusables](https://reactnativereusables.com) (shadcn/ui for React Native), with `class-variance-authority` (`cva`) for variants.

> **Live preview:** in development and preview builds, open **Settings → Developer → Design system** (route `/showcase`). It renders every component and variant in the current theme. Production builds can't reach it.

## Tokens

Components use **semantic tokens only**. They never use raw hex values or palette classes like `bg-zinc-900`:

| Token | Use for |
| --- | --- |
| `background` / `foreground` | Screen background, default text |
| `card` / `card-foreground` | Cards, sheets, grouped lists |
| `popover` / `popover-foreground` | Dialogs, menus |
| `primary` / `primary-foreground` | Main actions, selected state, brand |
| `secondary` / `secondary-foreground` | Secondary actions |
| `muted` / `muted-foreground` | Subtle backgrounds, helper text |
| `accent` / `accent-foreground` | Pressed or hover highlights |
| `destructive`, `success`, `warning` (+ `-foreground`) | Status and danger |
| `border`, `input`, `ring` | Borders, input outlines, focus |

Use them as classes: `bg-primary`, `text-muted-foreground`, `border-border`.

### Rebranding

1. Edit the values under `@variant light` and `@variant dark` in `src/global.css`. Usually `--color-primary` and `--color-primary-foreground` are enough.
2. Keep each `*-foreground` readable on its pair: **WCAG AA contrast is at least 4.5:1**. `pnpm test` enforces this: [`contrast.test.ts`](../src/lib/theme/__tests__/contrast.test.ts) parses `global.css` and fails on any pair below AA in either theme.
3. Optionally change the font: embed it in `app.config.ts` (`expo-font` plugin) and set `--font-sans`.

You don't need to change any component code.

### Tokens in JavaScript

Some props can't take a `className`: navigation theme, native `Switch` colors, charts and maps. For those, read a token with:

```ts
import { useColorToken } from '@/lib/theme/use-color-token';

const primary = useColorToken('--color-primary'); // '#18181b' in light, '#fafafa' in dark
```

It updates automatically when the theme changes. Uniwind only ships tokens that some `className` uses, and all built-in tokens are used.

## Theming

The theme preference (`system`, `light` or `dark`) lives in [`usePreferences`](../src/stores/preferences-store.ts) and is persisted with MMKV. `setTheme()` applies the choice everywhere at once:

- **Uniwind** handles `dark:` variants and token values.
- **The `Appearance` override** makes native UI match the app, not the OS: headers, native tabs, alerts, `Switch`, the keyboard, `useColorScheme()` and the status bar.
- **`ThemeProvider`** handles the React Navigation theme and the window background, so there's no white flash during transitions in dark mode.

The stored preference is applied when the store module loads, before the first frame, so there's no wrong-theme flash on launch.

```tsx
const setTheme = usePreferences(s => s.setTheme);
setTheme('dark');
```

`<ThemePicker />` (`src/features/settings/components/`) is a ready-made segmented control.

## Components

All components accept `className` and merge it last, so you can override any default: `cn(defaults, className)`.

### Text

```tsx
<Text variant="h1">Title</Text>        // h1 h2 h3 h4 lead large small muted label code
<Text className="text-primary">Custom</Text>
```

Font scaling follows the OS accessibility size, capped at `MAX_FONT_SCALE` (1.6) so layouts survive the largest sizes.

### Button

```tsx
<Button onPress={save} loading={isSaving}>
  <Icon as={Check} className="size-4" />
  <Text>Save</Text>
</Button>

<Button variant="outline" size="sm"><Text>Cancel</Text></Button>
<Button size="icon" variant="ghost" accessibilityLabel="Close"><Icon as={X} /></Button>
```

- Variants: `default`, `secondary`, `outline`, `ghost`, `destructive`, `link`. Sizes: `default` (44pt), `sm`, `lg`, `icon` (44×44).
- `loading` shows a spinner, ignores presses, keeps the width stable, and is announced as busy.
- `haptic` defaults to `'tap'` for `default` and `destructive`. Pass another intent, or `false`.
- `<Text>` and `<Icon>` inside a Button automatically get the right color (`TextClassContext`).

### TextField and Input

```tsx
<TextField
  label="Email"
  value={email}
  onChangeText={setEmail}
  helperText="We'll never share it."
  error={errors.email}        // replaces the helper, red border, announced to screen readers
  keyboardType="email-address"
  autoCapitalize="none"
/>
```

`Input` is the bare 44pt field. `TextField` adds a label (tapping it focuses the input), helper and error text. Put forms inside `<Screen variant="keyboard">` so the focused field stays above the keyboard.

### Card, Badge, Separator, Skeleton

```tsx
<Card>
  <CardHeader><CardTitle>Plan</CardTitle><CardDescription>Monthly</CardDescription></CardHeader>
  <CardContent><Text>…</Text></CardContent>
  <CardFooter><Button className="flex-1"><Text>Upgrade</Text></Button></CardFooter>
</Card>

<Badge variant="success"><Text>Active</Text></Badge>   // default secondary outline success warning destructive
<Separator />
<Skeleton className="h-4 w-32" />                      // static when the OS "Reduce motion" setting is on
```

### Switch

A platform-native switch (`UISwitch` or Material) colored with tokens, with selection haptics:

```tsx
<Switch checked={enabled} onCheckedChange={setEnabled} accessibilityLabel="Notifications" />
```

### Dialog

```tsx
<Dialog>
  <DialogTrigger asChild><Button variant="destructive"><Text>Delete</Text></Button></DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete item?</DialogTitle>
      <DialogDescription>This can't be undone.</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose asChild><Button variant="outline"><Text>Cancel</Text></Button></DialogClose>
      <DialogClose asChild><Button variant="destructive" onPress={remove}><Text>Delete</Text></Button></DialogClose>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

For control from code, use `open` and `onOpenChange` on `<Dialog>`. For a simple yes/no confirmation, the fully native `Alert.alert()` is often the better choice.

### BottomSheet

```tsx
const [open, setOpen] = useState(false);

<Button onPress={() => setOpen(true)}><Text>Options</Text></Button>
<BottomSheet open={open} onOpenChange={setOpen}>
  <Text variant="h4">Options</Text>
</BottomSheet>
```

It sizes to its content, closes on swipe-down or a backdrop tap, is keyboard-aware and respects the bottom safe area. Pass `snapPoints` (for example `['50%', '90%']`) for fixed heights.

### Icon

```tsx
import { Bell } from 'lucide-react-native';

<Icon as={Bell} className="size-5 text-muted-foreground" />
```

Size and color come from classes. Always render icons through `Icon`; switching icon libraries then only touches `icon.tsx`.

## Shared composites

### Screen

Every screen starts with `<Screen>`:

| `variant` | Use for |
| --- | --- |
| `scroll` (default) | Content screens. Works with native large-title headers |
| `keyboard` | Forms. Keeps the focused input above the keyboard |
| `static` | Lists, maps and custom layouts (no scroll view) |

Native headers and tabs handle insets. Pass `edges={['top']}` on screens without a header.

### List

FlashList v2 with the four states every data list needs:

```tsx
<List
  data={posts}
  renderItem={({ item }) => <PostRow post={item} />}
  keyExtractor={p => String(p.id)}
  isLoading={isPending}
  isError={isError}
  onRetry={refetch}
  onRefresh={refetch}
  isRefreshing={isRefetching}
  onEndReached={fetchNextPage}
  isFetchingNextPage={isFetchingNextPage}
  empty={{ title: 'No posts yet', description: 'Create your first post.' }}
/>
```

The states are a skeleton on first load, an error with retry, an empty state, then data with a next-page spinner. Pull-to-refresh includes a haptic.

### EmptyState and ErrorState

```tsx
<EmptyState icon={Bell} title="No notifications" description="You're all caught up." action={{ label: 'Refresh', onPress: refetch }} />
<ErrorState message="Couldn't load posts." onRetry={refetch} retrying={isRefetching} />
```

## Feedback: toasts and haptics

```ts
import { toast } from '@/lib/toast';

toast.success('Saved');
toast.error('Could not save', { description: 'Check your connection.' });
toast.info('Archived', { action: { label: 'Undo', onPress: undo } });
await toast.promise(upload(), { loading: 'Uploading…', success: 'Uploaded', error: 'Upload failed' });
```

Toasts stack (at most 3 visible), can be swiped up to dismiss, and appear above native modals on iOS. Success, warning and error toasts also fire the matching haptic. Screens import `@/lib/toast`, never `sonner-native` directly.

```ts
import { haptics } from '@/lib/haptics';

haptics.tap(); // light impact: presses
haptics.selection(); // toggles, pickers, tabs
haptics.success(); // also .warning() / .error(): outcomes
```

Haptics respect the user's **Settings → Haptics** toggle. They're wired into Button, Switch, tab changes, pull-to-refresh and toasts.

## Accessibility checklist (built in)

- [x] Touch targets are at least 44×44pt (`sm` buttons use `hitSlop`)
- [x] Roles and states: `button`, `switch`, `radio`, `alert`, `header`, `busy`, `disabled`, `checked`
- [x] Font scaling respected and capped at 1.6× (`MAX_FONT_SCALE`)
- [x] WCAG AA contrast for text tokens in both themes
- [x] Reduce motion: Skeleton is static, and Dialog animations follow the system setting
- [x] Errors are announced (`TextField` error, `ErrorState`)

When you build new components, keep these properties.

## Adding more components

Components come from the React Native Reusables **Uniwind** registry and are adapted for mobile: web-only classes removed, 44pt targets, the font-scale cap, and haptics. To add one (for example `tabs` or `dropdown-menu`):

1. Get the source from `https://reactnativereusables.com/r/uniwind/<name>.json` (the `files[].content` field). You can also try `pnpm dlx @react-native-reusables/cli add --styling-library uniwind <name>`. It prompts interactively, so run it in a terminal.
2. Save it to `src/components/ui/<name>.tsx`, change imports to `@/components/ui/*` and `@/lib/utils`, and install the `@rn-primitives/*` package it lists.
3. Apply the same mobile adaptations, and add it to the showcase.

`pnpm lint` checks every class against `global.css` (`better-tailwindcss`), so a typo like `bg-primry` or a deleted token is caught immediately.

## Recipes

- **Different icon set (for example Hugeicons):** change `IconImpl` in `src/components/ui/icon.tsx`. Call sites keep using `<Icon as={…} />`.
- **Extra brand color:** add `--color-brand` and `--color-brand-foreground` to both `@variant` blocks, then use `bg-brand` and `text-brand-foreground`.
- **More themes** (for example high contrast): see [Uniwind custom themes](https://docs.uniwind.dev/theming/custom-themes).
