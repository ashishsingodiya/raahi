import { defineConfig } from "eslint/config";

import { baseConfig } from "@ridemate/eslint-config/base";

export default defineConfig(
  {
    languageOptions: {
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
  },
  baseConfig,
);
