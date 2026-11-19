import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { expoClient } from "@better-auth/expo/client";
import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { getBaseUrl } from "./base-url";

const scheme = Array.isArray(Constants.expoConfig?.scheme)
  ? Constants.expoConfig.scheme[0]
  : (Constants.expoConfig?.scheme ?? "ridemate");

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
  plugins: [
    expoClient({
      scheme: scheme,
      storagePrefix: "ridemate",
      storage: SecureStore,
    }),
    adminClient(),
  ],
});
