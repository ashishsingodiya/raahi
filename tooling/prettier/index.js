import { fileURLToPath } from "node:url";

/** @typedef {import("prettier").Config} PrettierConfig */
/** @typedef {import("@ianvs/prettier-plugin-sort-imports").PluginConfig} SortImportsConfig */
/** @typedef {import("prettier-plugin-tailwindcss").PluginOptions} TailwindConfig */
/** @type {PrettierConfig & SortImportsConfig & TailwindConfig} */
const config = {
  plugins: [
    fileURLToPath(import.meta.resolve("@ianvs/prettier-plugin-sort-imports")),
    // Must come last: it wraps other plugins' parsers.
    fileURLToPath(import.meta.resolve("prettier-plugin-tailwindcss")),
  ],
  tailwindStylesheet: fileURLToPath(
    new URL("../../packages/ui/src/styles/globals.css", import.meta.url),
  ),
  tailwindFunctions: ["cn", "cva"],
  importOrder: [
    // ...unchanged
    "<TYPES>",
    "^(react/(.*)$)|^(react$)|^(react-native(.*)$)",
    "^(next/(.*)$)|^(next$)",
    "^(expo(.*)$)|^(expo$)",
    "<THIRD_PARTY_MODULES>",
    "",
    "<TYPES>^@ridemate",
    "^@ridemate/(.*)$",
    "",
    "<TYPES>^[.|..|~]",
    "^~/",
    "^[../]",
    "^[./]",
  ],
  importOrderParserPlugins: ["typescript", "jsx", "decorators-legacy"],
  importOrderTypeScriptVersion: "5.0.0",
};

export default config;
