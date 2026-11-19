import { defineConfig } from "eslint/config";

import { baseConfig } from "@ridemate/eslint-config/base";
import { reactConfig } from "@ridemate/eslint-config/react";

export default defineConfig(
  {
    languageOptions: {
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
  },
  baseConfig,
  reactConfig,
);
