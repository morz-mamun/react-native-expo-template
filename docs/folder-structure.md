# Folder structure

The code is organised **feature-first, with thin routes**. Each feature owns its screens, components, API and hooks, so you can understand it, change it, or delete it in one place.

```
.
├── app.config.ts         # Expo config, driven by env.ts (names, ids, icons, plugins, updates)
├── env.ts                # Build-time env loading + validation (Node only)
├── env/                  # Per-environment values: development.env, preview.env, production.env
├── eas.json              # EAS Build profiles and update channels
├── assets/               # Icons, splash, badged per-env icons (pnpm icons:badge)
├── plugins/              # Local Expo config plugins (native config without touching android/ios)
├── scripts/              # Node scripts (icon badges, …)
├── docs/                 # These guides
└── src/
    ├── app/              # Expo Router: ONLY layouts and thin route files
    ├── features/         # Product features: everything a feature needs, together
    ├── components/
    │   ├── ui/           # Design-system primitives (Button, Text, Input, …)
    │   ├── shared/       # App-level composites (Screen, List, EmptyState, ErrorFallback, …)
    │   └── form/         # TanStack Form bindings (useAppForm, bound fields)
    ├── lib/              # Framework-agnostic infrastructure (env, storage, api, auth, utils)
    ├── providers/        # React context providers, composed in AppProviders
    ├── stores/           # Cross-feature client state (Zustand), e.g. preferences
    └── test/             # Test utilities and API mocks: Phase 6
```

## Rules

1. **Routes are thin.** A file in `src/app/` re-exports or composes a screen from `src/features/`. Routes contain no data fetching, business logic or styling:
   ```tsx
   // src/app/(app)/(tabs)/settings/index.tsx
   export { SettingsScreen as default } from '@/features/settings/screens/settings-screen';
   ```
   Layouts (`_layout.tsx`) define navigators and screen options only.
2. **Features are self-contained.** (One exception: `features/auth/session-store.ts` is the public "who is signed in" API that any feature may import.)
   Use this layout inside `src/features/<name>/`:
   ```
   features/posts/
   ├── screens/        # Full screens (exported to routes)
   ├── components/     # UI used only by this feature
   ├── hooks/          # Feature hooks
   ├── api.ts          # Fetchers, queryOptions, mutation hooks (see data-fetching.md)
   ├── keys.ts         # Query-key factory
   ├── types.ts        # Types and Zod schemas
   └── __tests__/
   ```
   If a second feature needs something, move it up to `components/`, `lib/` or `stores/`. Don't import across features.
3. **`lib/` has no UI.** Pure TypeScript only: clients, storage, helpers. React providers go in `providers/`.
4. **Use the `@/` alias** for any import outside the current folder (`@/lib/env`, `@/components/ui/button`). Parent-relative imports (`../`) fail lint.
5. **File names are kebab-case** (`settings-screen.tsx`). Components are PascalCase named exports. Use default exports only where Expo Router requires them (route files).

## Routing layout

```
src/app/
├── _layout.tsx                 # Root: providers, splash control, error boundary, root Stack
├── +not-found.tsx              # Unknown routes
├── (auth)/                     # Signed-out only (Stack.Protected guard={!isSignedIn})
│   ├── _layout.tsx
│   └── login.tsx               # "/login"
└── (app)/                      # Signed-in only (Stack.Protected guard={isSignedIn})
    ├── _layout.tsx             # Stack: tabs + full-screen flows/modals above the tabs
    ├── new-post.tsx            # "/new-post": modal (covers the tab bar)
    ├── showcase.tsx            # "/showcase": design system (dev/preview only, Stack.Protected)
    └── (tabs)/
        ├── _layout.tsx         # Native tabs (platform tab bar)
        ├── (home)/             # "/": a group, so the first tab needs no redirect
        │   ├── _layout.tsx     # Native stack with large title
        │   └── index.tsx
        ├── posts/              # "/posts" and "/posts/[id]": list → detail inside the tab
        │   ├── _layout.tsx
        │   ├── index.tsx
        │   └── [id].tsx
        └── settings/           # "/settings"
            ├── _layout.tsx
            └── index.tsx
```

- **Groups** `(name)` organise routes without adding a URL segment.
- **Each tab has its own Stack**, so it gets native headers and push navigation, and keeps its history when you switch tabs.
- **Screens that cover the tab bar** (a create form, a full-screen viewer) go in `(app)/` next to `(tabs)`, not inside a tab.
- **Typed routes** are on: `<Link href="/nope" />` is a type error. Route types are generated into `.expo/types/` whenever Metro runs.

## Error handling

Any route or layout can export an `ErrorBoundary`. The root layout exports [`ErrorFallback`](../src/components/shared/error-fallback.tsx), which shows a "Try again" screen instead of a crash. To isolate a risky screen, add the same export to that route file:

```tsx
export { ErrorFallback as ErrorBoundary } from '@/components/shared/error-fallback';
```

## Startup

`SplashScreenController` keeps the native splash visible until [`useAppReady()`](../src/lib/bootstrap/use-app-ready.ts) returns `true`. Every startup prerequisite (cache restore, session hydration) belongs in that hook and runs in parallel. Fonts are embedded natively, so they never delay startup.
