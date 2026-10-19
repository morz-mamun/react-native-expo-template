// Inputs to the `fingerprint` runtime version (app.config.ts → runtimeVersion: { policy: 'fingerprint' }).
// The hash must come out identical on the EAS build server and on the machine that publishes
// an OTA update — otherwise builds silently never receive updates.
// Check locally: `npx expo-updates fingerprint:generate --platform android`

/** @type {import('expo/fingerprint').Config} */
const config = {
  // android/ and ios/ are git-ignored (Continuous Native Generation): EAS regenerates them,
  // so a stale local copy must not count. .expo/ holds generated local files.
  ignorePaths: ['android/**/*', 'ios/**/*', '.expo/**/*'],
  sourceSkips: [
    'PackageJsonScriptsAll', // scripts never change native code
    'GitIgnore',
    // `extra.env` is runtime JS data shipped inside every update manifest — not native code.
    'ExpoConfigExtraSection',
  ],
};

module.exports = config;
