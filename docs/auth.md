# Authentication

The template uses JWT access and refresh tokens:
- tokens live in the device keychain
- sessions are restored on launch without a login flash
- tokens refresh automatically and single-flight
- routes are protected, including deep links
- signing out removes all of the user's data

The demo runs against [dummyjson](https://dummyjson.com/docs/auth). Every backend-specific detail lives in **one file**, [`src/features/auth/api.ts`](../src/features/auth/api.ts).

> Demo account: **`emilys` / `emilyspass`** (the login screen offers to fill it in development and preview builds).

## Moving parts

| File | Responsibility |
| --- | --- |
| [`features/auth/api.ts`](../src/features/auth/api.ts) | Backend contract: `login`, `refreshTokens`, `fetchCurrentUser`, `logoutRequest` |
| [`features/auth/session-store.ts`](../src/features/auth/session-store.ts) | `useSession`: `status`, `user`, `hydrate`, `signIn`, `signOut`, `refreshUser`. Wires the HTTP client |
| [`lib/auth/token-storage.ts`](../src/lib/auth/token-storage.ts) | Tokens in the keychain/keystore, plus an in-memory copy for synchronous reads |
| [`lib/auth/refresh.ts`](../src/lib/auth/refresh.ts) | Single-flight refresher plus a bare `refreshClient` (no interceptors) |
| [`lib/api/client.ts`](../src/lib/api/client.ts) | Adds `Authorization: Bearer …`, and on 401 refreshes, retries once, or expires the session |
| [`lib/session/clear-user-data.ts`](../src/lib/session/clear-user-data.ts) | Wipes per-user caches on sign-out |
| [`app/_layout.tsx`](../src/app/_layout.tsx) | `Stack.Protected` gating of `(app)` and `(auth)` |
| [`features/auth/screens/login-screen.tsx`](../src/features/auth/screens/login-screen.tsx) | The login form |

## Flows

### Cold start (session restore)

```
splash visible ─► useAppReady() ─► session.hydrate()
                                     ├─ no tokens in keychain ─► status = signedOut ─► splash hides on Login
                                     └─ tokens found ─► status = signedIn (optimistic) ─► splash hides on Home
                                                         └─ background: GET auth/me ─► refresh cached profile
```

The splash screen stays up until the status is known, so a signed-in user never sees the login screen flash. The user profile is cached in MMKV (it's not a secret), so names and avatars render immediately. If the stored tokens turn out to be dead, the first request runs the refresh flow below, and signs the user out if that fails.

### Sign in

`signIn({ username, password })` → `POST auth/login` → tokens saved to the keychain → `status = signedIn`. **Nothing navigates manually.** `Stack.Protected` sees the guard flip and shows the app. Wrong credentials (400/401) appear inline on the form, and the inputs are kept.

### Token refresh (single-flight)

```
GET /auth/posts ──► 401 ─┐
GET /auth/me    ──► 401 ─┼─► refreshAccessToken()  ═══ ONE POST auth/refresh ═══►  new tokens saved
GET /auth/posts ──► 401 ─┘         (all three await the same promise)                    │
       ▲                                                                                 │
       └────────────── each request retried ONCE with the new access token ◄─────────────┘
```

- **Exactly one refresh** happens, however many requests fail at once (a shared in-flight promise).
- **Each request retries at most once** (`_retried` flag), so there are no loops.
- **A request that was sent with an old token** after another request already refreshed it is retried with the new token, without a second refresh.
- **`auth/login` and `auth/refresh` never trigger a refresh.** The refresh call itself uses a bare client with no interceptors.
- **Outcomes:**
  - New token → requests retried transparently. The user notices nothing.
  - **Refresh rejected** (400/401/403) → `onSessionExpired` → signed out with a "Session expired" toast.
  - **Offline, timeout or 5xx during refresh** → the session is **kept**. The request fails with a network error, and a flaky connection never logs anyone out.

### Sign out

`signOut()`:
1. Fires `logoutRequest` (best effort) to revoke the refresh token on the server.
2. Sets `status = signedOut`. `Stack.Protected` moves to login immediately.
3. Calls `clearUserData()`: cancels and clears the React Query cache (Phase 5 also wipes the persisted cache).
4. Deletes the tokens from the keychain.

It runs only once, even when several failing requests report expiry together. **No data from user A is ever shown to user B.**

### Protected routes and deep links

```tsx
<Stack.Protected guard={isSignedIn}>   <Stack.Screen name="(app)" />  </Stack.Protected>
<Stack.Protected guard={!isSignedIn}>  <Stack.Screen name="(auth)" /> </Stack.Protected>
```

A signed-out user who opens `expotemplate://posts/7` lands on login, and a signed-in user can't reach `/login`. To return the user to the original deep link after login, store the target before redirecting and `router.replace()` it in `signIn`'s caller.

## Token storage: why the keychain?

| Data | Where | Why |
| --- | --- | --- |
| Access + refresh tokens | `expo-secure-store` (iOS Keychain `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`; Android Keystore-encrypted) | Credentials. Hardware-backed encryption, never synced to other devices, excluded from Android backups |
| In-memory token copy | JS module variable | The request interceptor needs it synchronously. Keychain I/O on every request would be slow |
| User profile | MMKV (`session` key) | Non-secret, needed instantly on cold start |

Tokens are never written to MMKV, AsyncStorage or logs. `android.allowBackup=false` and the secure-store plugin's `configureAndroidBackup` keep app data out of cloud backups.

## Testing the edge cases on a device

In development and preview builds, **Settings → Developer** has two buttons:

- **Expire access token:** corrupts the in-memory access token and fires 3 requests in parallel. You should see the "Token refreshed: 3 parallel 401s → 1 refresh → all retried" toast.
- **Expire whole session:** breaks the refresh token too. You should be signed out with a "Session expired" toast.

## Adapting to your backend

Change **only** [`features/auth/api.ts`](../src/features/auth/api.ts) and [`features/auth/types.ts`](../src/features/auth/types.ts):

1. **Endpoints and payloads:** adjust `login`, `refreshTokens`, `fetchCurrentUser`, and uncomment `logoutRequest`.
2. **Response shapes:** update `userSchema` / `loginResponseSchema`. Validation is strict here: this is the app's trust boundary.
3. **Email instead of username:** rename the field in `loginSchema` to `email` with `z.email()`, and update the login screen's field (`autoComplete="email"`, `keyboardType="email-address"`).
4. **Auth paths excluded from retry:** if yours differ, edit `AUTH_ENDPOINTS` in `lib/api/client.ts`.

**Example: CareLink.** Its server exposes `POST /api/auth/login` (`{ email, password }` → `{ accessToken, refreshToken, user }`), `POST /api/auth/refresh`, `GET /api/auth/me` and `POST /api/auth/logout`. With `API_URL=…/api`, the paths are already `auth/login`, `auth/refresh` and `auth/me`. Map the nested `user` object in `login()`, switch the form to email, and enable `logoutRequest`.

### Adding social login (Apple, Google)

1. Get a provider token on the device (`expo-apple-authentication`, or `@react-native-google-signin/google-signin`).
2. Exchange it with your backend (for example `POST auth/oauth/apple`) for **your** access and refresh tokens.
3. Add a `signInWithProvider()` action to the session store that saves the tokens and sets the user, exactly like `signIn`.

Everything else (refresh, gating, sign-out) works unchanged.

### Adding sign-up or forgot-password

Add screens under `src/app/(auth)/` (for example `register.tsx`). They're reachable only while signed out, and link to them from the login screen.

## Not included (by design)

- **Biometric unlock:** add `requireAuthentication` to the secure-store options plus a `faceIDPermission`, or gate app launch with `expo-local-authentication`.
- **2FA/OTP and multiple accounts:** both depend on your backend.
