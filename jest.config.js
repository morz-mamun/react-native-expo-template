/** @type {import('jest').Config} */

// ESM-only or untranspiled packages that Jest must run through Babel.
const TRANSPILE = [
  '(jest-)?react-native',
  '@react-native(-community)?',
  'expo(nent)?',
  '@expo(nent)?/.*',
  '@expo-google-fonts/.*',
  'expo-router',
  '@react-navigation/.*',
  'react-native-svg',
  'uniwind',
  '@rn-primitives/.*',
  'lucide-react-native',
  'sonner-native',
  '@gorhom/.*',
  '@shopify/flash-list',
  '@tanstack/.*',
  '@dev-plugins/.*',
  // MSW v3 and its ESM dependencies
  'msw',
  '@msw/.*',
  '@mswjs/.*',
  'until-async',
  'headers-polyfill',
  'rettime',
  'is-node-process',
  'outvariant',
  'strict-event-emitter',
  '@open-draft/.*',
  'cookie',
  'tough-cookie',
  'type-fest',
];

module.exports = {
  preset: 'jest-expo',
  // Runs before any module is imported (globals, axios adapter).
  setupFiles: ['<rootDir>/src/test/setup-env.ts'],
  // Runs after the test framework is installed (mocks, MSW lifecycle, matchers).
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // The React Native env resolves axios' browser build (XHR only). Tests use the Node build so
    // requests are real Node HTTP requests that MSW intercepts (see src/test/setup-env.ts).
    '^axios$': '<rootDir>/node_modules/axios/dist/node/axios.cjs',
  },
  // jest-expo transforms .js/.ts; some ESM deps (MSW's) ship .mjs — compile those too.
  transform: { '^.+\\.mjs$': ['babel-jest', { presets: ['babel-preset-expo'] }] },
  transformIgnorePatterns: [`node_modules/(?!(${TRANSPILE.join('|')}))`],
  testPathIgnorePatterns: ['/node_modules/', '/.maestro/', '/android/', '/ios/'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/app/**', '!src/test/**'],
  clearMocks: true,
};
