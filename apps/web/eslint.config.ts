import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@raahi/eslint-config/base";
import { nextjsConfig } from "@raahi/eslint-config/nextjs";
import { reactConfig } from "@raahi/eslint-config/react";

export default defineConfig(
  {
    ignores: [".next/**", "next-env.d.ts"],
  },
  {
    languageOptions: {
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
  },
  baseConfig,
  reactConfig,
  nextjsConfig,
  restrictEnvAccess,
);
