// Learn more: https://docs.uniwind.dev/api/metro-config
import { getDefaultConfig } from "expo/metro-config";
import { withUniwindConfig } from "uniwind/metro";

const config = getDefaultConfig(import.meta.dirname);

// withUniwindConfig must be the outermost wrapper.
export default withUniwindConfig(config, {
  cssEntryFile: "./src/global.css",
  dtsFile: "./src/uniwind-types.d.ts",
});
