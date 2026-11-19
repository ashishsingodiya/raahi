import type { ConfigContext, ExpoConfig } from "expo/config";

import { version } from "./package.json";

type AppVariant = "development" | "preview" | "production";

const APP_VARIANT =
  (process.env.APP_VARIANT as AppVariant | undefined) ?? "development";

const IS_DEV = APP_VARIANT === "development";
const IS_PREVIEW = APP_VARIANT === "preview";

const getAppName = () => {
  if (IS_DEV) return "RideMate (Dev)";
  if (IS_PREVIEW) return "RideMate (Preview)";
  return "RideMate";
};

const getIdentifier = () => {
  if (IS_DEV) return "com.ridemate.app.dev";
  if (IS_PREVIEW) return "com.ridemate.app.preview";
  return "com.ridemate.app";
};

const getScheme = () => {
  if (IS_DEV) return "ridemate-dev";
  if (IS_PREVIEW) return "ridemate-preview";
  return "ridemate";
};

const getIcon = () => {
  if (IS_DEV) return "./assets/images/icon.png";
  if (IS_PREVIEW) return "./assets/images/icon.png";
  return "./assets/images/icon.png";
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: getAppName(),
  slug: "ridemate",
  version,
  orientation: "default",
  icon: getIcon(),
  scheme: getScheme(),
  userInterfaceStyle: "automatic",
  runtimeVersion: version,
  ios: {
    supportsTablet: true,
    bundleIdentifier: getIdentifier(),
  },
  android: {
    predictiveBackGestureEnabled: false,
    package: getIdentifier(),
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "RideMate uses your location to find nearby rides.",
      },
    ],
    [
      "react-native-maps",
      { androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_KEY },
    ],
    [
      "expo-splash-screen",
      {
        backgroundColor: "#fafafa",
        image: "./assets/images/splash-icon.png",
        imageWidth: 120,
        dark: {
          backgroundColor: "#0b0f17",
          image: "./assets/images/splash-icon.png",
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    appVariant: APP_VARIANT,
    androidMapsConfigured: Boolean(process.env.GOOGLE_MAPS_ANDROID_KEY),
  },
});
