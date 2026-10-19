# Release guide

Builds are made in the cloud with **EAS Build**, sent to the stores with **EAS Submit**, and patched over the air with **EAS Update**. You don't need a local Xcode or Android Studio for releases.

## One-time setup (per new project)

1. Install the CLI and sign in: `npm i -g eas-cli && eas login`.
2. Link the project: `eas init`. Copy the project id into `EAS_PROJECT_ID` in `env/preview.env` and `env/production.env` (set `EXPO_OWNER` too if you use an organisation).
3. Credentials: run `eas credentials`, or let the first `eas build` create and manage the signing keys.
4. Stores:
   - **iOS:** an app record in App Store Connect with the production bundle id (`com.example.expotemplate` → yours).
   - **Android:** an app in Play Console with the same package. Upload the first AAB manually, because Play requires it before API submissions work.
5. Optional: `eas env:create` for secrets the build needs (never put secrets in `env/*.env`, which ships in the app).

## Environments and profiles

| Profile | Command | Output | Distribution | Channel |
| --- | --- | --- | --- | --- |
| development | `pnpm build:development:android` / `:ios` | Dev client | Internal (install link) | `development` |
| preview | `pnpm build:preview:android` / `:ios` | APK / ad-hoc IPA | Internal (QA) | `preview` |
| production | `pnpm build:production:android` / `:ios` | AAB / IPA | Store | `production` |

Build numbers auto-increment on EAS (`appVersionSource: remote`). You only bump the **marketing version** (`version` in `package.json`) for user-visible releases. After bumping it, run `pnpm icons:badge` so the dev and preview icons show the new version.

## Release checklist (store release)

Before building:
- [ ] `pnpm check-all` passes and the app has been smoke-tested on a preview build (iOS and Android)
- [ ] `version` bumped in `package.json` (semver), then `pnpm icons:badge`
- [ ] Changelog or release notes written
- [ ] New permissions have usage strings (`app.config.ts` plugins) and store declarations (Play Console data safety, App Privacy)
- [ ] `CACHE_VERSION` bumped in `src/lib/api/persister.ts` if cached data shapes changed

Build and submit:
```bash
pnpm build:production:ios && eas submit --platform ios --profile production --latest
pnpm build:production:android && eas submit --platform android --profile production --latest
```
Android submissions go to the **internal** track as a **draft** (`eas.json → submit`). Promote them in Play Console after checking.

After release:
- [ ] Check crash and error reporting for the new version
- [ ] Tag the commit: `git tag v1.2.0 && git push --tags`

## Hotfix over the air

Use OTA for **JavaScript or asset-only** fixes:

```bash
git commit -m "fix: crash on empty post list"
pnpm update:production
```

- It reaches every production binary with the **same runtime version** (fingerprint). Users get it on the next launch, or immediately via the "Restart" prompt.
- If you touched anything native (a new library, a config plugin, permissions), **OTA won't reach existing binaries**. Ship a store build instead. `pnpm fingerprint:runtime` shows whether the runtime changed.
- Test first: publish to `preview`, install a preview build, and confirm the fix.

### Rollback

A bad update can be reverted without a new build:

```bash
eas update:rollback                       # interactive: roll the channel back to the previous update
# or republish a known-good commit:
git checkout <good-sha> && pnpm update:production && git checkout -
```

The embedded bundle in the binary is always the final fallback. If an update crashes on launch, `expo-updates` automatically falls back to the last working version.

## Gotchas

- **The runtime version differs between your machine and EAS** (updates never arrive): the cause is a stale `node_modules` or an ignored-file mismatch. Run `rm -rf node_modules && pnpm install` and compare `pnpm fingerprint:runtime` with the build's runtime version (**Settings → About**).
- **`EAS_PROJECT_ID is required`**: strict env validation runs for preview and production builds and for prebuild. Set it in `env/<env>.env`.
- **Preview and production builds side by side** work by design, thanks to the different bundle ids, names and badged icons.
