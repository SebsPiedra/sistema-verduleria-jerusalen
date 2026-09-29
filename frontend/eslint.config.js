// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
    rules: {
      // El proyecto conserva cargas imperativas compatibles con React Native.
      // React Compiler puede omitir estos componentes sin afectar su ejecución.
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  }
]);
