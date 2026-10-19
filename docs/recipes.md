# Recipes (optional add-ons)

The template leaves these out to stay vendor-neutral. Each recipe shows where it plugs in. Install native libraries with `npx expo install <pkg>`, then rebuild the dev client.

## Crash and error reporting (Sentry)

1. `npx expo install @sentry/react-native` and add `'@sentry/react-native/expo'` to `plugins` in `app.config.ts` (with your org and project).
2. Initialise it at the top of `src/app/_layout.tsx`:
   ```ts
   Sentry.init({ dsn: '…', environment: Env.APP_ENV, enabled: !__DEV__ });
   export default Sentry.wrap(RootLayout);
   ```
3. Report from the existing extension point in [`error-fallback.tsx`](../src/components/shared/error-fallback.tsx): `Sentry.captureException(error)`.
4. Optionally report server errors in `MutationCache.onError` / `QueryCache.onError` (`src/lib/api/query-client.ts`), skipping `isNetworkError` and 4xx.
5. Upload source maps for EAS Update with `npx sentry-expo-upload-sourcemaps dist` after `eas update`.

## Push notifications

1. `npx expo install expo-notifications expo-device` and add `'expo-notifications'` to `plugins`.
2. After sign-in (`signIn` in the session store, or a `useEffect` in the `(app)` layout), ask for permission, then send the token to your backend:
   ```ts
   const { status } = await Notifications.requestPermissionsAsync();
   if (status === 'granted') {
     const token = (await Notifications.getExpoPushTokenAsync({ projectId: Constants.expoConfig?.extra?.eas?.projectId })).data;
     await http.post('me/push-tokens', { token });
   }
   ```
3. On sign-out, delete the token on the backend (in `logoutRequest`).
4. Deep-link from a notification tap with `Notifications.addNotificationResponseReceivedListener` → `router.push(data.url)`. `Stack.Protected` still gates it.

## Internationalisation (i18n)

1. `npx expo install expo-localization` and `pnpm add i18next react-i18next`.
2. Create `src/lib/i18n/` with `index.ts` (initialised with `Localization.getLocales()[0].languageCode`) and `locales/en.json`, `locales/<lang>.json`.
3. Import `@/lib/i18n` once in `src/app/_layout.tsx`. Use `const { t } = useTranslation()` in screens.
4. Type the keys: `declare module 'i18next' { interface CustomTypeOptions { resources: { translation: typeof en } } }`.
5. For RTL languages, `I18nManager.forceRTL(true)` requires a reload. Prefer `start`/`end` style props (`ps-4`, `me-2`) over `left`/`right`.
6. Persist the user's choice in `usePreferences` (MMKV), the same way as the theme.

## Different icon set (for example Hugeicons)

Icons go through one wrapper (`src/components/ui/icon.tsx`) and one registry (`src/components/ui/icons.ts`):

1. `pnpm add @hugeicons/react-native @hugeicons/core-free-icons`.
2. Change `IconImpl` in `icon.tsx` to render `<HugeiconsIcon icon={…} size={size} color={color} />`.
3. Re-export the icons you use from `icons.ts`. **Use per-icon imports** if the package offers them; barrel imports bundle every icon (see [performance.md](./performance.md)).

Call sites (`<Icon as={…} className="size-5 text-foreground" />`) don't change.

## Offline-first apps (TanStack DB or a sync engine)

The default (a persisted React Query cache plus opt-in queued mutations) covers "works offline for what you've seen". For apps that must **create and edit lots of data offline**, such as field data collection:

| Option | When |
| --- | --- |
| **TanStack DB** | Builds on TanStack Query: reactive local collections, live queries, optimistic transactions, SQLite persistence on React Native. Still pre-1.0 as of 2026, so pin the version |
| **PowerSync / ElectricSQL** | Postgres-backed sync with conflict handling. Needs the vendor's backend service |
| **WatermelonDB / Legend-State sync** | Local database first, with your own sync endpoints |

Keep the existing layers: `lib/api/client.ts` for HTTP and auth, the session store, and React Query for everything that doesn't need offline writes.

## Biometric unlock

Gate the app (not every request) behind Face ID / fingerprint:
1. `npx expo install expo-local-authentication`, and add `faceIDPermission` to the `expo-secure-store` plugin options.
2. In `useAppReady`, after hydration, call `LocalAuthentication.authenticateAsync()` when a "Require Face ID" preference is on. Keep the splash up until it succeeds.

## Analytics

Use a thin wrapper (`src/lib/analytics.ts`, for example `track(event, props)`), the same idea as `lib/toast`, so the vendor can be swapped. Track screens with `usePathname()` in a root-layout effect. Never send tokens or personal data.
