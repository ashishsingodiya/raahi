import eslintReact from "@eslint-react/eslint-plugin";
import { defineConfig } from "eslint/config";

export const reactConfig = defineConfig({
  files: ["**/*.ts", "**/*.tsx"],
  extends: [eslintReact.configs["recommended-type-checked"]],
});
