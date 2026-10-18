import { useCSSVariable } from 'uniwind';

/**
 * Read a color design token (from global.css) in JS, for props that can't take a className:
 * navigation theme, native Switch colors, charts, maps. Updates when the theme changes.
 *
 * The variable must be used in at least one className in the app (Uniwind only ships used tokens).
 */
export function useColorToken(name: `--color-${string}`, fallback = '#000000'): string {
  const value = useCSSVariable(name);
  return typeof value === 'string' ? value : fallback;
}
