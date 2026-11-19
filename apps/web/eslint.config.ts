import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@ridemate/eslint-config/base";
import { nextjsConfig } from "@ridemate/eslint-config/nextjs";
import { reactConfig } from "@ridemate/eslint-config/react";

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
