const { getDefaultConfig } = require("expo/metro-config");

const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.resolver.extraNodeModules = {
  stream: require.resolve("readable-stream"),
  // Add other Node core modules polyfills here if needed
};

module.exports = defaultConfig;
