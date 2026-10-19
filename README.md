# React Native Expo Template

A production-grade starter for React Native apps with Expo. The setup decisions are already made, measured and documented. Clone it, rename it, and start building features on day one.

**Built for:** smooth, native-feeling apps that are fast to start, work offline, update over the air, and stay maintainable as they grow.

## What's inside

| Area | Choice |
| --- | --- |
| Framework | **Expo SDK 58** · React Native 0.88 · React 19.3 · New Architecture · **React Compiler** |
| Language | TypeScript (strict, `noUncheckedIndexedAccess`) |
| Navigation | **Expo Router**: file-based and typed routes, **native tabs**, native stacks, `Stack.Protected` auth gating |
| Design system | **Uniwind** (Tailwind v4) + **React Native Reusables** components, semantic tokens, light/dark/system theme, WCAG AA contrast enforced by tests |
| Feedback | `sonner-native` toasts, semantic haptics, native Switch, Dialog, Bottom sheet |
| Data fetching | **TanStack Query v5** + Axios: typed `ApiError`, `queryOptions` + key factories, infinite lists, optimistic updates, prefetch on press, devtools |
| Forms | **TanStack Form** + Zod with bound field components and server error mapping |
| Auth | JWT, tokens in the **keychain** (`expo-secure-store`), single-flight refresh, no login flash |
| Lists and images | FlashList v2 with loading, error, empty and pagination states; `expo-image` with caching and prefetch |
| Offline | Persisted query cache (opt-in, versioned), offline banner, fail-fast or queued offline mutations |
| OTA and builds | EAS Build profiles and EAS Update channels per environment, fingerprint runtime versions, in-app update prompt |
| Config | Validated multi-environment config (`development` / `preview` / `production`), side-by-side installs, badged icons |
| Storage | MMKV v4 (app data), SecureStore (credentials) |
| Quality | ESLint (antfu flat config, formatting included), React Compiler rules, Tailwind class checks, Husky, lint-staged, commitlint |
| Testing | **Jest** + **React Native Testing Library** + **MSW**, a **Maestro** E2E smoke flow, **GitHub Actions** CI |

## Prerequisites

- **Node.js 22+** (24 LTS recommended) and **pnpm 11** (`corepack enable`)
- **Android:** Android Studio with an emulator. **iOS:** macOS with Xcode and a simulator.
- Optional: an [Expo account](https://expo.dev/signup) and `npm i -g eas-cli`, for cloud builds and OTA updates

> This template uses native modules (MMKV, SecureStore, keyboard controller, native tabs), so it runs in a **development build**, not Expo Go.

## Quick start

```bash
pnpm install
pnpm android        # or: pnpm ios. Builds and installs the dev client, then starts Metro
```

Sign in with the demo account **`emilys` / `emilyspass`** ([dummyjson](https://dummyjson.com)). The login screen can fill it in for you. After the first native build, `pnpm start` is enough. Rebuild only when native dependencies or `app.config.ts` change.

## Start a new project from this template

1. **Copy and initialise:** copy the folder (or use it as a GitHub template), then `git init && pnpm install`. This also activates the git hooks.
2. **App identity:** edit the block at the top of [`env.ts`](./env.ts):
   ```ts
   const APP = { name: 'My App', slug: 'my-app', bundleId: 'com.mycompany.myapp', scheme: 'myapp' };
   ```
   Development and preview builds get `.development` / `.preview` suffixes, names such as "My App (Dev)", and schemes such as `myapp-development`.
3. **E2E ids:** update the bundle ids and scheme in the `e2e` / `e2e:dev` scripts in [`package.json`](./package.json) to match.
4. **Backend:** set `API_URL` in [`env/development.env`, `preview.env`, `production.env`](./env).
   - Adapt the auth contract in [`src/features/auth/api.ts`](./src/features/auth/api.ts) (see [auth.md](./docs/auth.md#adapting-to-your-backend)).
   - Remove the demo-account hint in [`login-screen.tsx`](./src/features/auth/screens/login-screen.tsx).
5. **Brand:**
   - **Colors:** change the tokens in [`src/global.css`](./src/global.css). `pnpm test` checks contrast.
   - **Font:** optional; change it in `app.config.ts` and set `--font-sans`.
   - **Icons and splash:** replace `assets/icon.png`, `android-icon-*.png`, `splash-icon.png` and `favicon.png` (keep the sizes). Update the adaptive-icon `backgroundColor` and the splash colors in [`app.config.ts`](./app.config.ts). Then run `pnpm icons:badge`.
6. **EAS** (cloud builds and OTA): run `eas login && eas init`. Copy the project id into `EAS_PROJECT_ID` in `env/preview.env` and `env/production.env` (plus `EXPO_OWNER` for an organisation).
7. **Remove the example feature** when you're ready: see [adding-a-feature.md → Removing the example](./docs/adding-a-feature.md#removing-the-example-posts-feature).
8. **Housekeeping:**
   - Update `LICENSE` and `name`/`version` in `package.json`.
   - Rewrite this README.
   - Keep or adapt [`CLAUDE.md`](./CLAUDE.md) for AI assistants.
9. **Run it:** `pnpm check-all && pnpm android`.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm start` | Start Metro for development (`start:preview`, `start:production` also exist) |
| `pnpm android` / `pnpm ios` | Build and run a local dev build (`:preview` variants exist) |
| `pnpm prebuild[:preview\|:production]` | Regenerate `android/` and `ios/` with strict env validation |
| `pnpm build:<profile>:<platform>` | EAS cloud build, e.g. `pnpm build:preview:android` |
| `pnpm update:preview` / `update:production` | Publish an OTA update to that channel |
| `pnpm fingerprint:runtime` | Print the native runtime fingerprint (OTA compatibility) |
| `pnpm icons:badge` | Regenerate the badged development and preview icons |
| `pnpm lint` / `pnpm lint:fix` | Lint and format (ESLint handles formatting; there is no Prettier) |
| `pnpm type-check` | TypeScript |
| `pnpm test` / `test:watch` / `test:coverage` | Jest unit and integration tests |
| `pnpm check-all` | Lint + type-check + tests (what CI runs) |
| `pnpm e2e` / `pnpm e2e:dev` | Maestro smoke test against a preview or development build |
| `pnpm doctor` | `expo-doctor` dependency and config health check |

## Documentation

**Start here:** [Architecture](./docs/architecture.md) · [Folder structure](./docs/folder-structure.md) · [Adding a feature](./docs/adding-a-feature.md)

| Guide | Covers |
| --- | --- |
| [Environments](./docs/environments.md) | Env files, validation, build profiles, side-by-side installs |
| [Design system](./docs/design-system.md) | Tokens, theming, components, toasts, haptics, accessibility |
| [Data fetching](./docs/data-fetching.md) | API client, errors, caching defaults, queries, pagination, mutations |
| [Forms](./docs/forms.md) | TanStack Form + Zod, bound fields, server errors |
| [Authentication](./docs/auth.md) | Session flows, token refresh, secure storage, adapting to your backend |
| [Offline & OTA](./docs/offline-and-ota.md) | Persisted cache, offline mutations, EAS Update, runtime versions |
| [Performance](./docs/performance.md) | What's built in, measured bundle size, rules, profiling |
| [Testing](./docs/testing.md) | Jest + RNTL + MSW, mocks, Maestro, CI |
| [Release](./docs/release.md) | EAS build/submit/update, checklist, hotfixes, rollback |
| [Decisions](./docs/decisions.md) | Why each technology was chosen, and what was rejected |
| [Recipes](./docs/recipes.md) | Sentry, push notifications, i18n, other icon sets, offline-first, biometrics, analytics |
| [Troubleshooting](./docs/troubleshooting.md) | Install, Metro, native build, OTA, auth and test problems |
