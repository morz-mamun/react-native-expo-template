# Testing

| Layer | Tooling | What it covers | Command |
| --- | --- | --- | --- |
| Unit and integration | **Jest 30** + `jest-expo` + **React Native Testing Library 14** | Components, hooks, stores, API client, auth flows, screens | `pnpm test` |
| HTTP mocking | **MSW v3** (`msw/node`) | The real Axios client, interceptors and error handling, against fake endpoints | (used by Jest) |
| End-to-end | **Maestro** | A real build on an emulator or simulator: launch → login → home | `pnpm e2e` / `pnpm e2e:dev` |
| Static | ESLint, `tsc`, design-token contrast test | Code style, types, accessibility of the palette | `pnpm check-all` |

`pnpm check-all` (lint, type-check, tests) runs in CI on every push and pull request, and the pre-commit hook runs the tests related to your staged files.

## Commands

```bash
pnpm test                 # all tests
pnpm test:watch           # re-run on change
pnpm test:coverage        # with coverage report (coverage/lcov-report/index.html)
pnpm test src/features/posts         # one folder
pnpm test -t "single refresh"        # tests whose name matches
```

## What's tested (examples to copy)

| File | Shows how to test |
| --- | --- |
| [`components/ui/__tests__/button.test.tsx`](../src/components/ui/__tests__/button.test.tsx) | A component: press, loading (busy, no press), disabled |
| [`components/ui/__tests__/text-field.test.tsx`](../src/components/ui/__tests__/text-field.test.tsx) | Helper and error text, accessibility role `alert`, typing |
| [`lib/api/__tests__/errors.test.ts`](../src/lib/api/__tests__/errors.test.ts) | Error normalisation through the **real client**: 404, 422/400 field errors, 500, network |
| [`features/auth/__tests__/session.test.ts`](../src/features/auth/__tests__/session.test.ts) | Sign-in, bad credentials, **3 parallel 401s → 1 refresh**, rejected refresh → sign-out and data wiped, offline refresh keeps the session, cold-start hydration |
| [`features/posts/__tests__/posts-screen.test.tsx`](../src/features/posts/__tests__/posts-screen.test.tsx) | A screen: data, error → retry → success, empty state |
| [`features/posts/__tests__/create-post.test.tsx`](../src/features/posts/__tests__/create-post.test.tsx) | Optimistic update: shows immediately, swaps in the server version, rolls back on failure |
| [`lib/theme/__tests__/contrast.test.ts`](../src/lib/theme/__tests__/contrast.test.ts) | Every text/background token pair in `global.css` meets WCAG AA in both themes |

## Writing tests

### Components

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';

it('submits', async () => {
  const onPress = jest.fn();
  await render(<Button onPress={onPress}><Text>Save</Text></Button>); // RNTL 14: render is async
  await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
  expect(onPress).toHaveBeenCalled();
});
```

Query by what the user perceives: `getByRole`, `getByText`, `getByPlaceholderText`, or `getByTestId` as a last resort. Matchers come from RNTL: `toBeOnTheScreen`, `toBeDisabled`, `toBeBusy`, `toHaveTextContent`, `toBeChecked`, and so on.

### Screens and hooks that fetch data

Use `renderWithProviders` from [`src/test/test-utils.tsx`](../src/test/test-utils.tsx). It wraps the screen in a **fresh** React Query client (the app's real defaults, minus retries and timers) plus a safe area:

```tsx
import { renderWithProviders, screen } from '@/test/test-utils';

await renderWithProviders(<PostsScreen />);
expect(await screen.findByText('Post 1')).toBeOnTheScreen(); // findBy* waits for the request
```

### Mocking the API with MSW

Default handlers in [`src/test/msw/handlers.ts`](../src/test/msw/handlers.ts) mirror the backend's happy path. Override per test; overrides reset after each test:

```ts
import { http as msw, HttpResponse } from 'msw';
import { API } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';

server.use(msw.get(`${API}/auth/posts`, () => HttpResponse.json({ message: 'boom' }, { status: 500 }), { once: true }));
server.use(msw.get(`${API}/auth/posts/1`, () => HttpResponse.error())); // network failure
```

- **Any request without a handler fails the test** (`onUnhandledFrame: 'error'`), so tests never hit the real network.
- Requests go through the **real** Axios client and interceptors (auth header, refresh, error normalisation). Only the network is fake.

### Toasts, haptics and other side effects

`@/lib/toast` is replaced by Jest spies globally (`src/test/setup.ts`):

```ts
import { toast } from '@/lib/toast';
expect(toast.info).toHaveBeenCalledWith('Session expired', expect.anything());
```

## Test setup: what's mocked and why

[`jest.config.js`](../jest.config.js), [`src/test/setup-env.ts`](../src/test/setup-env.ts) and [`src/test/setup.ts`](../src/test/setup.ts):

| Mocked | Why |
| --- | --- |
| `expo-constants` | Supplies the runtime env (`expo.extra.env`) that `app.config.ts` normally provides |
| `react-native-mmkv` | MMKV v4 loads a native Nitro module on import. Replaced with an in-memory store per instance |
| `expo-secure-store` | In-memory keychain, so token storage behaves realistically |
| `react-native-reanimated`, `react-native-worklets` | Reanimated 4's own mock imports its native entry point. [`src/test/mocks/reanimated.tsx`](../src/test/mocks/reanimated.tsx) covers the API the app uses: animations finish instantly. **Extend it when you use more Reanimated APIs** |
| `@react-native-community/netinfo`, `@gorhom/bottom-sheet` | Their official Jest mocks |
| `@/lib/toast` | Spies, instead of rendering `sonner-native` |
| `axios` (module mapping) | The React Native environment would load axios' browser (XHR) build. Tests use its Node build, so MSW intercepts requests |

`transformIgnorePatterns` lists the packages Jest must compile: React Native libraries, plus MSW v3 and its ESM-only dependencies.

## End-to-end (Maestro)

[`.maestro/smoke.yaml`](../.maestro/smoke.yaml) launches the app signed out, logs in with the demo account, and asserts the home screen.

1. Install the [Maestro CLI](https://docs.maestro.dev/getting-started/installing-maestro) and boot an Android emulator or iOS simulator.
2. Run it against either build type:
   - **Preview (release) build:** `pnpm build:preview:android`, install it, then `pnpm e2e`.
   - **Development build:** `pnpm android` (Metro running), then `pnpm e2e:dev`. The flow deep-links the dev client into Metro first. The URL in the script uses `10.0.2.2` (Android emulator → host). For the iOS simulator, change it to `localhost`.
3. Screenshots are saved to `.maestro/screenshots/` (git-ignored).

Elements are found by `testID`: `login-screen`, `login-username`, `login-password`, `login-submit`, `home-screen` and `sign-out`. Keep those stable, and add `testID`s for new flows. [Maestro Studio](https://docs.maestro.dev/getting-started/maestro-studio) (`maestro studio`) records flows interactively.

## CI

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs on pushes to `main` and on pull requests:

1. `pnpm install --frozen-lockfile` (with the pnpm store cached)
2. **Bundle:** `expo export --platform android` proves the app bundles
3. Lint, type-check, then `pnpm test --ci --coverage` (the coverage report is uploaded as an artifact)

Expo Router's strict typed-route declarations are generated only by `expo start`, so CI checks `href`s loosely. Locally, with Metro running, a link to a route that doesn't exist is a type error.

E2E isn't in CI by default, because it needs an emulator and a build. To add it, run Maestro on an EAS build with a [Maestro Cloud](https://docs.maestro.dev/cloud) or EAS Workflows job.
