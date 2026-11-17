import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@raahi/eslint-config/base";

export default defineConfig(
  {
    ignores: ["drizzle/**"],
  },
  {
    languageOptions: {
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
  },
  baseConfig,
  restrictEnvAccess,
);
