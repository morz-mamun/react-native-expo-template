# Performance

The template is fast by default. This guide explains what's already done, the rules that keep it fast, and how to measure.

## What's built in

| Area | Default | Why it matters |
| --- | --- | --- |
| Rendering | **React Compiler** on (`experiments.reactCompiler`) | Components and callbacks are memoised automatically. No hand-written `useMemo`/`useCallback`/`memo` needed. Verified: all 49 component modules compile (route re-export files have nothing to compile) |
| Lists | **FlashList v2** via `List` | Cell recycling and no size estimates, so a long list renders like a short one |
| Images | **expo-image**, `memory-disk` cache, `recyclingKey`, prefetch of the next page's images | No flicker in recycled rows; images are already cached when scrolled into view |
| Animations | **Reanimated 4** (UI thread), native-driven Dialog/Toast/Skeleton | Smooth even when the JS thread is busy |
| Navigation | **Native** stacks and tabs (`UINavigationController`/`UITabBarController`, Material) | Platform transitions with no JS-thread animation |
| Keyboard | `react-native-keyboard-controller` | Frame-synced keyboard handling, with no `KeyboardAvoidingView` jank |
| Startup | Fonts embedded natively, splash held until session and cache are ready (in parallel), MMKV (sync) | No font flash, no layout jump, no wrong-screen flash |
| Data | Cache-first React Query (`staleTime` 30s), prefetch on touch-down, list → detail `placeholderData` | Revisits and detail screens render instantly |
| Bundle | Icons via per-icon deep imports (lint-enforced) | See below |

## Bundle size (measured)

Measured with [Expo Atlas](https://docs.expo.dev/guides/analyzing-bundles/) on a production Android export:

| | Modules | JS before Hermes | Hermes bytecode |
| --- | --- | --- | --- |
| Importing icons from the `lucide-react-native` barrel | 4,533 | 13.4 MB | **8.6 MB** |
| Per-icon imports via `@/components/ui/icons` (current) | 2,663 | 9.7 MB | **6.5 MB (−24%)** |

**Metro doesn't tree-shake.** Importing one name from a barrel package bundles the whole package. Watch for this whenever you add a library with many exports. The current top packages (`react-native`, `reanimated`, `expo-router`, `zod`) are core dependencies.

**Analyse your own bundle:**
```bash
EXPO_ATLAS=true APP_ENV=production pnpm exec expo export --platform android
npx expo-atlas .expo/atlas.jsonl      # interactive treemap in the browser
```
If the CLI adds `expo-atlas` to `devDependencies`, remove it afterwards with `pnpm remove expo-atlas`. It pulls in an older `expo-server`, which `expo-doctor` flags as a duplicate native module.

## Rules that keep the app fast

### Rendering
- **Let the React Compiler work.** Don't add `useMemo`/`useCallback` by reflex. Keep components pure: no mutation during render and no reading refs in render. The lint rules from `react-hooks` flag violations.
- If a file breaks under the compiler (rare, usually a library that mutates props), add `'use no memo';` at the top of that component or file, and leave a comment saying why.
- **Subscribe narrowly.** Use Zustand selectors such as `usePreferences(s => s.theme)`, never `usePreferences()`. For React Query, use `select` to derive only what the screen needs.

### Lists
- Always use `List` (FlashList), never `ScrollView` + `map` for unbounded data.
- Keep rows cheap: no data fetching inside rows, no heavy computation, and stable `keyExtractor`.
- Pass **module-level components** to `ItemSeparatorComponent`, `ListHeaderComponent` and similar, not inline arrow functions (see `PostSeparator`).
- Use `getItemType` when rows have very different layouts, so cells recycle within their type.
- Paginate (`useInfiniteQuery` + `onEndReached`), and guard with `!isFetchingNextPage`.

### Images
- Use `expo-image`, with `cachePolicy="memory-disk"` for remote images and `recyclingKey` in lists.
- Request images at the size you display (CDN resize parameters). Never decode a 4000px photo for a 44px avatar.
- Prefetch images you know will be needed: `Image.prefetch(urls, 'memory-disk')`.

### Animations
- Animate `transform` and `opacity` on the UI thread (Reanimated). Avoid animating layout props (`width`, `height`, `top`) on large trees.
- Respect **Reduce motion**: use `.reduceMotion(ReduceMotion.System)` on layout animations and `useReducedMotion()` for custom ones (see `Skeleton`).

### Startup
- Everything in [`useAppReady`](../src/lib/bootstrap/use-app-ready.ts) delays first paint. Add prerequisites there only if the first screen truly can't render without them, and run them in parallel.
- Don't `await` the network before first paint. Show cached data, then refresh.
- Persist only what the first screens need (`meta.persist`). A huge persisted cache slows restore.

### Data
- Keep `staleTime` > 0 for anything that isn't live data. `0` means a request on every mount.
- Validate large lists non-strictly (`parseResponse(…, { strict: false })`). Validate auth and mutations strictly.

## Optional: inline requires (measure first)

Expo leaves Metro's `inlineRequires` **off**, so every imported module initialises at startup. Turning it on defers each module until it's first used, which often shortens time-to-interactive in larger apps:

```js
// metro.config.js (before withUniwindConfig)
config.transformer.getTransformOptions = async () => ({
  transform: { experimentalImportSupport: true, inlineRequires: true },
});
```

It's **not enabled by default** because it changes *when* module-level side effects run. This template relies on a few: the session store registering auth handlers with the HTTP client, the preferences store applying the theme, and the mutation defaults registered before the cache restore. Enable it only together with a before/after measurement (below), and click through sign-in, theme switching and offline likes on a release build.

## Measuring on a device

Always measure **release builds** (`pnpm build:preview:android`, or `pnpm exec expo run:android --variant release`). Development builds are 5–10× slower and not representative.

| What | How |
| --- | --- |
| Cold start / TTI | Android: `adb shell am start -W -n <package>/.MainActivity` (look at `TotalTime`). iOS: Xcode → Instruments → App Launch |
| JS thread FPS while scrolling | Dev menu → **Perf Monitor** (UI and JS FPS should stay near 60/120 while flinging the Posts list) |
| Re-renders | React DevTools Profiler (`j` in the Expo CLI → Profiler, "Highlight updates") |
| JS CPU profile | Dev menu → **Start/Stop profiling** (Hermes) → open in Chrome DevTools |
| Native | Android Studio Profiler / Xcode Instruments (Time Profiler, Allocations) |
| Bundle | Expo Atlas (above) |

**Suggested budgets** (mid-range Android, release build): cold start under 1.5s, 60fps (or the device's refresh rate) while scrolling lists, and a screen reacting to a press within 100ms.

### Checklist before a release
- [ ] Release build cold start measured and within budget
- [ ] Perf Monitor shows no sustained JS FPS drops while scrolling the longest list
- [ ] No new barrel import of a large library (check Atlas if the bundle grew noticeably)
- [ ] Images in lists are sized appropriately and cached
