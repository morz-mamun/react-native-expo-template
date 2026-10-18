// @ts-check
import antfu from '@antfu/eslint-config';
import betterTailwind from 'eslint-plugin-better-tailwindcss';
import reactHooks from 'eslint-plugin-react-hooks';

/**
 * ESLint (flat config) via @antfu/eslint-config — lint + formatting in one tool (no Prettier).
 * `pnpm lint:fix` formats the codebase. Editor: enable "eslint.format" / fix on save.
 */
export default antfu(
  {
    react: true,
    typescript: true,
    stylistic: { semi: true, quotes: 'single', indent: 2 },
    ignores: [
      'android/**',
      'ios/**',
      '.expo/**',
      'dist/**',
      'coverage/**',
      'expo-env.d.ts',
      '**/*.md',
      '.claude/**',
    ],
  },
  {
    // React Compiler correctness rules (purity, refs, set-state-in-effect, …).
    name: 'app/react-compiler',
    plugins: { 'react-hooks': reactHooks },
    rules: Object.fromEntries(
      Object.entries(reactHooks.configs.flat['recommended-latest'].rules ?? {})
        .filter(([rule]) => rule.startsWith('react-hooks/')),
    ),
  },
  {
    // Tailwind class correctness: unknown classes (typos, missing tokens), conflicts, deprecations.
    // Checked against src/global.css, so a removed design token is a lint error everywhere it's used.
    name: 'app/tailwind',
    files: ['src/**/*.tsx'],
    plugins: { 'better-tailwindcss': betterTailwind },
    rules: betterTailwind.configs['correctness-error'].rules,
    settings: { 'better-tailwindcss': { entryPoint: 'src/global.css' } },
  },
  {
    name: 'app/conventions',
    rules: {
      // Always use the `@/` alias for cross-folder imports.
      'no-restricted-imports': ['error', { patterns: [{ group: ['../*'], message: 'Use the @/ alias instead of parent-relative imports.' }] }],
      // RN convention: `const styles = StyleSheet.create(...)` lives at the bottom of the file.
      'ts/no-use-before-define': ['error', { functions: false, classes: false, variables: false }],
      'node/prefer-global/process': 'off',
      'antfu/no-top-level-await': 'off',
      'style/brace-style': ['error', 'stroustrup', { allowSingleLine: true }],
    },
  },
  {
    // Design-system files intentionally export variants (cva) and contexts next to components.
    name: 'app/ui',
    files: ['src/components/ui/**/*.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    // Route files may export ErrorBoundary / unstable_settings alongside the screen.
    name: 'app/routes',
    files: ['src/app/**/*.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
);
