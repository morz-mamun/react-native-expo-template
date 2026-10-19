# Architecture

## Layers

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ src/app/            Routes (Expo Router): layouts, navigators, guards. No logic.│
├──────────────────────────────────────────────────────────────────────────────┤
│ src/features/<x>/   Screens, feature components, api.ts (queries/mutations),   │
│                     keys.ts, types.ts (Zod). auth/session-store = public API.  │
├───────────────────────────────┬──────────────────────────────────────────────┤
│ src/components/ui/            │ src/components/shared/   src/components/form/ │
│ Design-system primitives      │ Screen, List, states…    TanStack Form bindings│
├───────────────────────────────┴──────────────────────────────────────────────┤
│ src/providers/      Composition root: theme, React Query (+persistence), …    │
│ src/stores/         Cross-feature client state (Zustand + MMKV)                │
├──────────────────────────────────────────────────────────────────────────────┤
│ src/lib/            Pure infrastructure: api (client, errors, query client,    │
│                     persister), auth (tokens, refresh), storage, env, toast,   │
│                     haptics, theme tokens, utils. No screens.                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Dependencies point downwards.** Routes import features, features import components and lib, and lib imports nothing from above it. Two deliberate exceptions:
- `providers/` is the **composition root**. It may import feature modules to wire them up (for example registering offline mutation defaults).
- `features/auth/session-store.ts` is the public "who is signed in" API that any feature may use.

The HTTP client doesn't import the session. The session **injects** its callbacks into the client (`configureApiAuth`), which avoids a dependency cycle.

## Data flow

```
                ┌──────────── useQuery(postQueries.list()) ◄──────────┐
                ▼                                                     │
Screen ──► React Query cache ──stale/miss──► fetcher (api.ts) ──► http (Axios)
   ▲            │  ▲                              │                    │  Authorization: Bearer …
   │            │  └── persister (MMKV, opt-in) ◄─┘                    │  401 → refresh → retry
   │            │                                                       ▼
   └─ render ◄──┘◄────── parseResponse (Zod) ◄──── ApiError ◄──── API server

Client state: Zustand stores (preferences, session) ──► persist → MMKV
Secrets:      tokens ──► expo-secure-store (keychain/keystore), in-memory copy for requests
```

- **Server state** (anything that lives on a server) is owned by React Query: cached, deduplicated, refetched and persisted. It isn't copied into Zustand.
- **Client state** (theme, haptics, session status, cached profile) is owned by Zustand and persisted with MMKV.
- **Secrets** live only in the keychain, plus a memory copy.
- **Errors** are normalised once, at the client boundary, into `ApiError`.

## Provider order

From [`app-providers.tsx`](../src/providers/app-providers.tsx), outermost first:

1. `GestureHandlerRootView`: gestures for sheets, toasts and swipes
2. `SafeAreaProvider`: insets
3. `KeyboardProvider`: native keyboard tracking
4. `ThemeProvider`: navigation theme and window background from design tokens
5. `QueryProvider`: React Query + MMKV persistence + AppState/NetInfo wiring + devtools
6. `BottomSheetModalProvider`
7. *children* (the navigators), then `PortalHost` (dialogs) and `AppToaster` (toasts) on top

## Bootstrap sequence (cold start)

```
native splash visible
│
├─ JS loads: global.css, preferences store (applies saved theme before first frame),
│            session store (registers auth handlers with the HTTP client)
├─ QueryProvider starts restoring the persisted cache from MMKV ──┐
├─ useAppReady → session.hydrate(): read tokens from keychain ────┤ in parallel
│                                                                 │
└─ both done ─► splash hides (fade) on the right first screen ◄───┘
      • signed in  → (app) tabs, with cached data already rendered
      • signed out → (auth)/login
   then, in the background: GET auth/me (profile), refetch stale queries,
   expo-updates check, NetInfo subscription
```

Fonts are embedded natively, so they never block. Nothing on the critical path waits for the network.

## Navigation tree

```
Root Stack
├─ Stack.Protected guard={signedIn}   (app)
│   ├─ (tabs)  NativeTabs
│   │   ├─ (home)    Stack → index
│   │   ├─ posts     Stack → index, [id]
│   │   └─ settings  Stack → index
│   ├─ new-post      modal
│   └─ Stack.Protected guard={!production}  showcase
├─ Stack.Protected guard={!signedIn}  (auth) → login
└─ +not-found
```

Signing in or out flips the guards, and the navigator moves the user. No screen calls `router.replace` for auth.

## Where things live

| Concern | File(s) |
| --- | --- |
| Environments and app identity | `env.ts`, `env/*.env`, `app.config.ts`, `src/lib/env.ts` |
| Design tokens | `src/global.css` (+ `src/lib/theme/use-color-token.ts` for JS) |
| HTTP | `src/lib/api/client.ts`, `errors.ts`, `parse-response.ts` |
| Caching and offline | `src/lib/api/query-client.ts`, `persister.ts`, `src/providers/query-provider.tsx` |
| Auth | `src/features/auth/*`, `src/lib/auth/*`, `src/lib/session/clear-user-data.ts` |
| OTA updates | `src/features/app-updates/use-app-updates.ts`, `eas.json`, `fingerprint.config.js` |
| Feedback | `src/lib/toast.ts`, `src/lib/haptics.ts` |
| Tests | `jest.config.js`, `src/test/*`, `**/__tests__/*`, `.maestro/*` |

Further reading: [folder structure](./folder-structure.md) · [decisions](./decisions.md) · [data fetching](./data-fetching.md) · [auth](./auth.md) · [offline and OTA](./offline-and-ota.md).
