const { getDefaultConfig } = require("expo/metro-config");

const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.resolver.extraNodeModules = {
  ...defaultConfig.resolver.extraNodeModules,
  net: require.resolve("react-native-tcp-socket"),
  tls: require.resolve("react-native-tcp-socket"),
  http: require.resolve("stream-http"),
  https: require.resolve("https-browserify"),
  url: require.resolve("url/"),
  fs: require.resolve("react-native-level-fs"),
  path: require.resolve("path-browserify"),
  stream: require.resolve("readable-stream"),
  crypto: require.resolve("react-native-crypto"),
  zlib: require.resolve("browserify-zlib"),
  util: require.resolve("util/"),
  buffer: require.resolve("buffer/"),
  process: require.resolve("process/browser"),
};

module.exports = defaultConfig;
