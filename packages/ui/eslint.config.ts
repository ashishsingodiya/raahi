import { defineConfig } from "eslint/config";

import { baseConfig } from "@raahi/eslint-config/base";
import { reactConfig } from "@raahi/eslint-config/react";

export default defineConfig(
  {
    languageOptions: {
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
  },
  baseConfig,
  reactConfig,
);
