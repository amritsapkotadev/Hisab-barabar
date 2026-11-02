const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'android/*', 'ios/*'],
  },
  {
    rules: {
      // Apostrophes and quotes render fine inside React Native <Text>.
      'react/no-unescaped-entities': 'off',
    },
  },
]);
