/**
 * Single source of truth for "can the first real frame be shown?".
 *
 * The native splash screen stays up until this returns true, so the user never sees
 * a half-initialised UI or the wrong initial route. Add every startup prerequisite here
 * and run them in parallel:
 *
 * - Phase 1: nothing async yet — fonts are embedded at build time (no runtime loading).
 * - Later: persisted query cache restored, auth session hydrated from secure storage.
 *
 * Keep this list short: every item delays first paint.
 */
// eslint-disable-next-line react/no-unnecessary-use-prefix -- becomes a real hook in later phases
export function useAppReady(): boolean {
  return true;
}
