import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@raahi/eslint-config/base";
import { reactConfig } from "@raahi/eslint-config/react";

export default defineConfig(
  {
    ignores: [
      ".expo/**",
      "expo-env.d.ts",
      "metro.config.js",
      "src/uniwind-types.d.ts",
    ],
  },
  {
    languageOptions: {
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
  },
  baseConfig,
  reactConfig,
  restrictEnvAccess,
  {
    files: ["app.config.ts"],
    rules: {
      "no-restricted-properties": "off",
    },
  },
);
