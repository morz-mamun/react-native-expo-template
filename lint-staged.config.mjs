/** Runs on `git commit` (pre-commit hook) against staged files only. */
export default {
  '*.{js,mjs,cjs,ts,tsx,json,jsonc,yml,yaml}': 'eslint --fix',
  '*.{ts,tsx}': [
    // Type errors can come from files you didn't touch — check the whole project once.
    () => 'tsc --noEmit',
    // Only the tests affected by the staged files (fast).
    'jest --bail --findRelatedTests --passWithNoTests',
  ],
};
