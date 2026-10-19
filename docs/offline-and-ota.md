# Offline support and over-the-air updates

## Offline

The app stays useful without a connection:

| Situation | Behaviour |
| --- | --- |
| Cold start offline | Data saved to disk (opt-in queries) is restored before the splash screen hides, so lists show what the user last saw |
| Going offline | A **"You're offline — showing saved data"** pill appears. Queries **pause**: no failed requests or error screens for data already on screen |
| Coming back online | The pill disappears and stale queries on screen **refetch automatically** |
| Action while offline (default) | **Fails fast** in milliseconds: a "You're offline. This action needs an internet connection" toast, and nothing is sent |
| Action while offline (opt-in) | **Queued**: applied optimistically, sent when back online, even after an app restart |
| Sign-out | The in-memory cache, paused mutations and the on-disk cache are all wiped |

### How it works

```
NetInfo ──► onlineManager ──► queries pause/resume · OfflineBanner · client fail-fast
AppState ─► focusManager ──► refetch stale queries on foreground
MMKV "query-cache" ◄──► PersistQueryClientProvider (restore on launch, throttled save)
```

| File | Role |
| --- | --- |
| [`src/lib/api/persister.ts`](../src/lib/api/persister.ts) | What's persisted, for how long, and the cache version |
| [`src/providers/query-provider.tsx`](../src/providers/query-provider.tsx) | `PersistQueryClientProvider`, NetInfo/AppState wiring, resume paused mutations |
| [`src/lib/bootstrap/use-app-ready.ts`](../src/lib/bootstrap/use-app-ready.ts) | The splash screen waits for the cache restore |
| [`src/components/shared/offline-banner.tsx`](../src/components/shared/offline-banner.tsx) | Offline indicator |
| [`src/lib/api/client.ts`](../src/lib/api/client.ts) | Rejects requests instantly while offline (`ApiError` kind `network`) |
| [`src/features/posts/mutation-defaults.ts`](../src/features/posts/mutation-defaults.ts) | Example of an offline-queued mutation |

### Choosing what to persist

Persistence is **opt-in per query**. Persist what users need to see offline; leave out the rest:

```ts
infiniteQueryOptions({
  queryKey: postKeys.list(filters),
  queryFn: /* … */,
  meta: { persist: true }, // ← saved to disk, restored on launch
});
```

Rules enforced by `persistOptions`:
- Only **successful** queries are saved.
- Data older than **24h** (`maxAge`) is discarded on restore. Keep it ≤ the QueryClient's `gcTime`.
- **`buster` = app version + `CACHE_VERSION`.** A new app version, or bumping `CACHE_VERSION` after a schema change, discards old caches instead of restoring incompatible data.
- Writes are throttled to once per second, off the hot path.

> Don't persist sensitive data you wouldn't want on disk unencrypted. MMKV isn't encrypted in this template. To encrypt it, pass an `encryptionKey` to `createMMKV` (store the key in SecureStore).

### Offline mutations: fail fast (default) or queue (opt-in)

**Default: fail fast.** Mutations run with `networkMode: 'always'`. While offline, the client rejects immediately and the user gets a clear toast. This is right for most actions: payments, anything that must be confirmed, anything order-dependent.

**Opt-in: queue while offline.** Use this for actions that are safe to apply later (likes, read receipts, drafts):

```ts
// 1. Register defaults at startup (imported by QueryProvider, BEFORE the cache restore),
//    so a mutation restored from disk after a restart still knows what to run:
queryClient.setMutationDefaults(likePostKey, {
  mutationFn: likePost,
  networkMode: 'online', // pause while offline, run when back online
  retry: 2,
});

// 2. Use it by key, with an optimistic update:
useMutation<Post, ApiError, LikePostVariables, Ctx>({
  mutationKey: likePostKey,
  onMutate: /* optimistic update everywhere it's cached */,
  onError: /* roll back */,
});
```

Paused mutations are persisted (`shouldDehydrateMutation: isPaused`) and resumed after the restore (`resumePausedMutations`). **Try it:** open a post, switch to airplane mode, tap 👍 (you'll see "Saved offline"), kill the app, reopen it, and turn airplane mode off. The like is sent.

## Over-the-air (OTA) updates

JavaScript and asset changes ship **without a store release** through [EAS Update](https://docs.expo.dev/eas-update/introduction/).

### Channels: one per build profile

| Build profile | Channel | Receives |
| --- | --- | --- |
| `development` | `development` | `eas update --channel development` |
| `preview` | `preview` | `pnpm update:preview` |
| `production` | `production` | `pnpm update:production` |

A build only ever receives updates from **its own** channel, so a QA update can't reach production users.

### Runtime version: the safety net

`runtimeVersion: { policy: 'fingerprint' }` hashes everything native: dependencies with native code, config plugins, and native config. An update is delivered only to binaries with the **same** hash, so JavaScript that needs a newer native module can never reach an old binary and crash it.

- Add or upgrade a native library → the fingerprint changes → you **must ship a new build**. Updates published afterwards only reach new builds.
- [`fingerprint.config.js`](../fingerprint.config.js) excludes inputs that don't affect native code (package.json scripts, `.gitignore`, and `extra`, which holds our runtime env). Changing `API_URL` therefore doesn't break OTA compatibility.
- Check locally: `pnpm fingerprint:runtime` (compare with the build's runtime version in **Settings → About**).

### When updates apply

1. **On launch**, the native layer checks for an update in the background (`checkAutomatically: 'ON_LOAD'`, `fallbackToCacheTimeout: 0`). **Startup never waits for the network.** A downloaded update applies on the next cold start.
2. **On foreground**, [`useAppUpdates`](../src/features/app-updates/use-app-updates.ts) checks again (throttled to 15 minutes). If an update downloads, a toast offers **Restart** (`PROMPT_TO_RESTART`; set it to `false` to apply silently on the next launch).

Updates are disabled in development and in builds without an EAS project id.

**Settings → About** shows the channel, runtime version and update id. Ask users for them in bug reports.

### Publishing

```bash
pnpm update:preview      # → preview channel (QA builds)
pnpm update:production   # → production channel
```

Both run `eas update --auto` (the message comes from your last git commit) with the right `APP_ENV`, so `extra.env` (API URL and so on) matches the channel. See [release.md](./release.md) for the full release process and rollbacks.
