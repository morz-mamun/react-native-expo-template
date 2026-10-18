# React Native Expo Template

A production-grade starter for React Native apps built with Expo. It gives you a fast, smooth app foundation with all the setup decisions already made. You can clone it, rename it, and start building features on day one.

> **Status:** Phases 1–4 of 7 are complete (foundation, design system, data layer, auth). Upcoming phases add offline/OTA, testing and full docs. See [Roadmap](#roadmap).

## What's inside

| Area | Choice |
| --- | --- |
| Framework | **Expo SDK 58** · React Native 0.88 · React 19.3 · New Architecture · **React Compiler** |
| Language | TypeScript (strict, `noUncheckedIndexedAccess`) |
| Navigation | **Expo Router**: file-based and typed routes, **native tabs**, native stacks |
| Config | Validated multi-environment config (`development` / `preview` / `production`) |
| Design system | **Uniwind** (Tailwind v4) + **React Native Reusables** components, semantic tokens, light/dark/system theme, contrast-checked |
| Feedback | `sonner-native` toasts, semantic haptics, native Switch, Dialog, Bottom sheet |
| Data fetching | **TanStack Query v5** + Axios: typed `ApiError`, `queryOptions` + key factories, infinite lists, optimistic updates, prefetch-on-press, devtools |
| Forms | **TanStack Form** + Zod with bound field components and server error mapping |
| Auth | JWT login, tokens in the **keychain** (`expo-secure-store`), single-flight refresh, `Stack.Protected` routes, no login flash |
| Lists | FlashList v2 with loading, error, empty and pagination states |
| Storage | MMKV v4 (fast, synchronous) |
| Fonts | Inter, **embedded at build time** (no runtime font loading) |
| Builds & updates | EAS Build profiles + EAS Update channels, fingerprint runtime versions |
| Quality | ESLint (antfu flat config, formatting included), React Compiler lint rules, Husky, lint-staged, commitlint |

Coming in later phases: offline cache, OTA updates, Jest/RNTL/MSW, Maestro and CI.

## Prerequisites

- **Node.js 22+** (24 LTS recommended)
- **pnpm 11** (`corepack enable` or `npm i -g pnpm`)
- **Android:** Android Studio with an emulator. **iOS:** macOS with Xcode and a simulator.
- Optional: an [Expo account](https://expo.dev/signup) + `npm i -g eas-cli` for cloud builds and OTA updates.

> This template uses native modules (MMKV, keyboard controller, native tabs), so it runs in a **development build**, not Expo Go.

## Quick start

> Demo login: **`emilys` / `emilyspass`** (dummyjson). The login screen can fill it in for you.

```bash
pnpm install
pnpm android        # or: pnpm ios. Builds and installs the dev client, then starts Metro
```

After the first native build, you only need `pnpm start` to launch Metro. Rebuild (`pnpm android` / `pnpm ios`) only when native dependencies or `app.config.ts` change.

## Start a new project from this template

1. Copy the folder (or use it as a GitHub template), then run `git init`.
2. Edit the **app identity** block at the top of [`env.ts`](./env.ts): `name`, `slug`, `bundleId`, `scheme`.
3. Set your API URLs in [`env/*.env`](./env).
4. Replace the icons and splash in [`assets/`](./assets), then run `pnpm icons:badge`.
5. Optional, for cloud builds and OTA: `eas init`, then put the project id in `env/preview.env` and `env/production.env` (`EAS_PROJECT_ID`).
6. Run `pnpm install && pnpm android`.

A full rebrand checklist arrives in Phase 7.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm start` | Start Metro for the development environment (`start:preview`, `start:production` also exist) |
| `pnpm android` / `pnpm ios` | Build and run a local dev build (`:preview` variants exist) |
| `pnpm prebuild[:preview\|:production]` | Regenerate `android/` and `ios/` with strict env validation |
| `pnpm build:<profile>:<platform>` | EAS cloud build, e.g. `pnpm build:preview:android` |
| `pnpm icons:badge` | Regenerate the badged dev/preview icons |
| `pnpm lint` / `pnpm lint:fix` | Lint and format (ESLint handles formatting; there is no Prettier) |
| `pnpm type-check` | TypeScript check |
| `pnpm check-all` | Lint + type-check (tests are added in Phase 6) |
| `pnpm doctor` | `expo-doctor` dependency and config health check |

## Documentation

- [Folder structure](./docs/folder-structure.md): where code goes and why
- [Environments](./docs/environments.md): env files, validation, build profiles, side-by-side installs
- [Design system](./docs/design-system.md): tokens, theming, components, toasts, haptics, accessibility
- [Data fetching](./docs/data-fetching.md): API client, errors, caching defaults, queries, pagination, mutations
- [Forms](./docs/forms.md): TanStack Form + Zod, bound fields, server errors
- [Authentication](./docs/auth.md): session flows, token refresh, secure storage, adapting to your backend

## Roadmap

1. ✅ **Foundation**: scaffold, structure, env/config, EAS profiles, tooling, native tabs, splash and error handling
2. ✅ **Design system**: tokens, light/dark theme, core components, toasts, haptics, showcase
3. ✅ **Data layer**: API client, TanStack Query, pagination, forms, example `posts` feature
4. ✅ **Auth & session**: JWT, secure tokens, single-flight refresh, protected routes
5. ⬜ Offline & OTA: persisted cache, offline banner, EAS Update
6. ⬜ Testing & CI: Jest, RNTL, MSW, Maestro, GitHub Actions
7. ⬜ Performance, docs & polish
