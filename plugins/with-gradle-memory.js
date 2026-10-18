// @ts-check
/**
 * Raises the Gradle JVM heap in the generated android/gradle.properties.
 *
 * The prebuild default (-Xmx2048m) runs out of memory ("Java heap space" in
 * :app:mergeDebugResources) on local builds of an SDK 58 app. android/ is regenerated
 * on every prebuild, so this must be a config plugin, not a manual edit.
 */
const { withGradleProperties } = require('expo/config-plugins');

const JVM_ARGS = '-Xmx4096m -XX:MaxMetaspaceSize=1024m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8';

/** @type {import('expo/config-plugins').ConfigPlugin} */
module.exports = function withGradleMemory(config) {
  return withGradleProperties(config, (cfg) => {
    const items = cfg.modResults.filter(item => !(item.type === 'property' && item.key === 'org.gradle.jvmargs'));
    items.push({ type: 'property', key: 'org.gradle.jvmargs', value: JVM_ARGS });
    cfg.modResults = items;
    return cfg;
  });
};
