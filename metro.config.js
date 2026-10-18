// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

// withUniwindConfig must be the OUTERMOST wrapper.
module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  // Generated class-name types (on Metro start). Lives in src/ so TypeScript picks it up.
  dtsFile: './src/uniwind-types.d.ts',
});
