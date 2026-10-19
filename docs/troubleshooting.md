# Troubleshooting

Most of these were hit while building the template itself.

## Install and dependencies

**`ERR_PNPM_TRUST_DOWNGRADE … possible package takeover`**
pnpm's `trustPolicy: no-downgrade` blocked a version published with less provenance than earlier ones. Don't disable the policy. Check the package (who published it, when, and why it has no provenance) and only then add a **narrow** exception to `trustPolicyExclude` in `pnpm-workspace.yaml` with a comment. `semver@6.3.1` is excluded because it's an official npm-team security backport. `ua-parser-js@1.0.41` was **not** excluded: the package has a hijack history and wasn't needed.

**`ERR_PNPM_IGNORED_BUILDS`**
A new dependency wants to run an install script. Decide explicitly in `pnpm-workspace.yaml → allowBuilds`: `true` if it really needs to build native code, `false` if it ships prebuilt binaries.

**`expo-doctor`: "scripts conflict with node_modules/.bin"**
A `package.json` script has the same name as an installed binary. Rename the script (this is why it's `fingerprint:runtime`).

**`expo-doctor`: "duplicate native module dependencies" or "patch version mismatches"**
Duplicates usually come from a dev tool pinning an older SDK package (for example `expo-atlas` → `expo-server`). Remove the tool, or run `pnpm why <pkg>` to find the culprit. Patch mismatches mean a newer SDK patch is out: run `npx expo install --fix`, then `pnpm check-all`.

**Lint reports `Unknown class detected: bg-muted` (or any token) on a fresh clone**
Uniwind writes the theme tokens into `node_modules/uniwind/uniwind.css`. The `postinstall` script (`uniwind generate-artifacts`) does this after every install. If you skipped scripts (`--ignore-scripts`), run `pnpm postinstall` or start Metro once.

**Wrong or duplicate React Query instance (cache not shared, `meta` loses its types)**
`@tanstack/*` packages must be on the **same version**. Upgrade them together, then run `find node_modules -path "*@tanstack/query-core/package.json" | xargs grep version` to confirm there's one copy.

## Metro and bundling

**Changes not showing, or strange module errors after switching branches**
```bash
pnpm start --clear              # reset the Metro cache
rm -rf node_modules .expo && pnpm install   # stale node_modules
```

**`Invalid environment configuration for APP_ENV=…`**
The env validation failed. The message names the variable. Fix `env/<env>.env` (or `env/local.env`), then restart with `--clear`. `EAS_PROJECT_ID` is only required for preview and production *builds* (strict mode).

**Uniwind classes don't apply / `uniwind-types.d.ts` missing**
Metro must run once to generate the class types. Check that `metro.config.js` wraps the config with `withUniwindConfig` as the **outermost** wrapper, and that `src/global.css` is imported in `src/app/_layout.tsx`.

**A class isn't styling anything**
Run `pnpm lint`. The `better-tailwindcss` rules flag unknown classes (typos, or tokens that don't exist).

## Native builds

**`Java heap space` in `:app:mergeDebugResources`**
The Gradle heap is too small. `plugins/with-gradle-memory.js` sets 4 GB on every prebuild, so lower it on machines with little RAM. Run `pnpm prebuild` after changing it.

**A native module is "not found", or the app crashes on launch after adding a library**
Libraries with native code need a **new development build**: `pnpm android` / `pnpm ios` (or `pnpm build:development:<platform>`). Expo Go can't run this template.

**`android/` or `ios/` edits disappeared**
Those folders are generated (Continuous Native Generation) and git-ignored. Make native changes through `app.config.ts` and config plugins (`plugins/`).

**SecureStore fails on an Android emulator** (`Could not encrypt/decrypt`)
The emulator image has no lock-screen keystore, or its keystore got wiped. Wipe the emulator's data, or use an image with Google APIs. On iOS simulators, the keychain persists across reinstalls. Use **Settings → Sign out**, or reset the simulator.

## OTA updates

**Updates never arrive on a build**
1. **Channel:** the build's profile channel (`eas.json`) must match the one you published to (`pnpm update:preview` → `preview`).
2. **Runtime version:** compare `pnpm fingerprint:runtime` with **Settings → About → Runtime version** on the device. If they differ:
   - you changed something native: ship a new build
   - or `node_modules` is stale locally: `rm -rf node_modules && pnpm install`, then republish
3. **Not enabled:** without `EAS_PROJECT_ID`, updates are disabled (`Updates.isEnabled` is false).
4. Updates download in the background and apply on the **next cold start**, or immediately via the "Restart" toast.

## Auth

**Signed out unexpectedly**
The refresh token was rejected (expired or revoked). Network failures never sign out. To test the flows, use **Settings → Developer → Expire access token / Expire whole session**.

**Login fails with the demo account**
dummyjson uses a **username** (`emilys`), not an email. For your backend, see [auth.md → Adapting to your backend](./auth.md#adapting-to-your-backend).

## Tests

**`Must use import to load ES Module`**
An ESM-only package needs compiling. Add its name to `TRANSPILE` in `jest.config.js`.

**`… Turbo/Native-Module could not be found` (in Jest)**
A native module is imported in tests. Mock it in `src/test/setup.ts` (see the MMKV mock there).

**Reanimated API `X` is undefined in tests**
Add it to the explicit mock in `src/test/mocks/reanimated.tsx`.

**`A worker process has failed to exit gracefully`**
A timer outlives the test. Usually React Query garbage-collection timers; use `createTestQueryClient()` (with `gcTime: Infinity`). Find the suite by running files one at a time.

**A request "without a matching request handler" fails a test**
That's intentional (`onUnhandledFrame: 'error'`). Add an MSW handler with `server.use(...)`.
