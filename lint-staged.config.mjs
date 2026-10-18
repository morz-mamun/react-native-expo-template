/** Runs on `git commit` (pre-commit hook): fix + format only the staged files. */
export default {
  '*.{js,mjs,cjs,ts,tsx,json,jsonc,yml,yaml}': 'eslint --fix',
  // Type errors can come from files you didn't touch — check the whole project once.
  '*.{ts,tsx}': () => 'tsc --noEmit',
};
