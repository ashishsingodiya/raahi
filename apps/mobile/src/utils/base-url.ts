import Constants from "expo-constants";

import { env } from "~/env";

export const getBaseUrl = () => {
  // 1. Return explicit env server URL if configured
  if (env.EXPO_PUBLIC_SERVER_URL) {
    return env.EXPO_PUBLIC_SERVER_URL.replace(/\/+$/, "");
  }

  // 2. Otherwise fall back to host machine IP address in development
  const debuggerHost = Constants.expoConfig?.hostUri;
  const localhost = debuggerHost?.split(":")[0];

  if (!localhost) {
    throw new Error(
      "Failed to get localhost. Please set EXPO_PUBLIC_SERVER_URL in your .env file.",
    );
  }
  return `http://${localhost}:3000`;
};
