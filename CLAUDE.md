# CLAUDE.md

Context for AI coding assistants. Read [`AGENTS.md`](./AGENTS.md) first (Expo-specific guidance: check the versioned Expo docs for SDK 58 before touching Expo APIs). The rules below are this project's conventions. Follow them exactly.

## Stack

Expo SDK 58 · React Native 0.88 · React 19.3 (React Compiler on) · TypeScript strict · Expo Router (native tabs, `Stack.Protected`) · Uniwind (Tailwind v4) + React Native Reusables · TanStack Query v5 + Axios · TanStack Form + Zod · Zustand + MMKV v4 · expo-secure-store · FlashList v2 · Reanimated 4 · sonner-native · Jest + RNTL 14 + MSW v3 · Maestro · pnpm 11.

## Commands

```bash
pnpm start | pnpm android | pnpm ios      # dev (needs a development build, not Expo Go)
pnpm check-all                            # lint + type-check + tests. Run before saying a task is done
pnpm lint:fix                             # also formats (no Prettier)
pnpm test -- <path or -t name>            # Jest
npx expo install <pkg>                    # ALWAYS for adding RN/Expo packages (SDK-compatible versions)
```

## Where code goes

- `src/app/`: **routes only**. Re-export screens (`export { XScreen as default } from '@/features/x/screens/x-screen'`). Layouts hold navigators and options only.
- `src/features/<name>/`: `screens/`, `components/`, `api.ts`, `keys.ts`, `types.ts`, `__tests__/`. Features don't import each other. The exception is `@/features/auth/session-store` (the session's public API).
- `src/components/ui/`: design-system primitives. `src/components/shared/`: Screen, List, EmptyState, ErrorState, … `src/components/form/`: form bindings.
- `src/lib/`: infrastructure with no screens (api, auth, storage, env, toast, haptics, theme, utils). `src/providers/`: the composition root. `src/stores/`: cross-feature Zustand state.
- Reference implementation for everything: `src/features/posts/`.

## Rules

- **Imports:** use the `@/` alias, never `../`.
- **Icons:** import them from `@/components/ui/icons` (add per-icon deep imports there) and render with `<Icon as={X} className="size-5 …" />`. Never import values from `lucide-react-native` (it bundles all icons; lint-enforced).
- **Styling:**
  - Use Uniwind classes with **semantic tokens only** (`bg-primary`, `text-muted-foreground`, `border-border`). No hex values or palette classes.
  - Variants use `cva` + `cn()`. Token values for non-className props come from `useColorToken('--color-x')`.
- **Typography and UI:** use `Text` (never a raw RN `Text`), `Button`, `TextField`, `Card`, `Screen`, `List`, `EmptyState`/`ErrorState` from the design system. Touch targets are at least 44pt, with roles and labels on custom pressables.
- **Data:**
  - Server data goes through React Query only. Define queries with `queryOptions`/`infiniteQueryOptions` in the feature's `api.ts`, with keys from the feature's `keys.ts` factory.
  - Fetchers pass `signal` and validate with `parseResponse(schema, data, { strict })`: strict for auth, mutations and persisted data; `strict: false` for large lists.
  - Never put server data into Zustand.
- **Errors:** errors are `ApiError` (`kind`, `status`, `message`, `fieldErrors`). Don't inspect raw axios errors.
- **Mutations:**
  - Give user feedback with `meta: { successMessage, errorMessage }` (toasts are automatic), and invalidate precise keys.
  - Use optimistic updates with rollback for low-risk actions (see `useCreatePost`).
  - Offline default is fail-fast. To queue while offline, use `setMutationDefaults` + `networkMode: 'online'` (see `features/posts/mutation-defaults.ts`).
- **Every data screen** handles loading (skeleton), error (retry), empty and data.
- **Forms:** use `useAppForm` with a Zod schema → `<form.AppField name>{f => <f.TextField …/>}</form.AppField>` → `<form.SubmitButton>`. Map server errors with `applyServerFieldErrors`.
- **Storage:** credentials go **only** in `expo-secure-store` (`lib/auth/token-storage.ts`). Everything else goes in MMKV via `lib/storage`. Never use AsyncStorage.
- **Feedback:** import `toast` from `@/lib/toast` and `haptics` from `@/lib/haptics`, never the underlying libraries.
- **Env and config:** add runtime env vars to `src/lib/env-schema.ts` and `env.ts`, and read them via `Env` from `@/lib/env`. Never use `process.env` in app code. Never edit `android/` or `ios/`; use `app.config.ts` and config plugins.
- **TypeScript:** use `type`, not `interface` (lint-enforced), except for module augmentation.
- **React Compiler:** don't add `useMemo`/`useCallback`/`memo` by default. Keep components pure.
- **Lists:** use `List` (FlashList); pass module-level components (not inline arrows) to `ItemSeparatorComponent` and similar.
- **Tests:**
  - Test behaviour with RNTL (`await render(...)`, `findBy*`) and mock HTTP with MSW (`server.use(...)`). Unhandled requests fail.
  - Use `renderWithProviders` / `createTestQueryClient` from `@/test/test-utils`.
- **Git:** use Conventional Commits (`feat:`, `fix:`, …), enforced by commitlint.

## Gotchas

- Native modules need a rebuild (`pnpm android`/`ios`). After adding one, check `pnpm doctor`.
- Typed routes and `src/uniwind-types.d.ts` are generated when Metro runs.
- `@tanstack/*` packages must share one version (one `query-core`).
- New ESM-only packages used in tests must go into `TRANSPILE` in `jest.config.js`. New Reanimated APIs used in code must go into `src/test/mocks/reanimated.tsx`.

Docs: `docs/` (start with `architecture.md`, `adding-a-feature.md`).
