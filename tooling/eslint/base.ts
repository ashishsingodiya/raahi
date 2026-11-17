import eslint from "@eslint/js";
import turboPlugin from "eslint-plugin-turbo";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export const baseConfig = defineConfig(
  {
    ignores: ["**/.cache/**", "**/.turbo/**", "**/dist/**"],
  },
  {
    files: ["**/*.js", "**/*.ts", "**/*.tsx"],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    plugins: {
      turbo: turboPlugin,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      "@typescript-eslint/no-unnecessary-condition": [
        "error",
        { allowConstantLoopConditions: true },
      ],
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-deprecated": "warn",
    },
  },
);

/**
 * Forces all env access to go through the validated `env` object.
 * Add this to apps/packages that have an `env.ts` file.
 */
export const restrictEnvAccess = defineConfig({
  files: ["**/*.js", "**/*.ts", "**/*.tsx"],
  ignores: ["**/env.ts"],
  rules: {
    "no-restricted-properties": [
      "error",
      {
        object: "process",
        property: "env",
        message: "Use `import { env } from '~/env'` instead.",
      },
    ],
    "no-restricted-imports": [
      "error",
      {
        name: "process",
        importNames: ["env"],
        message: "Use `import { env } from '~/env'` instead.",
      },
    ],
  },
});
