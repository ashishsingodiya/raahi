import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "EXPO_PUBLIC_",
  client: {
    EXPO_PUBLIC_SERVER_URL: z.url().optional(),
    EXPO_PUBLIC_GOOGLE_MAPS_WEBVIEW: z.enum(["0", "1"]).optional(),
  },
  runtimeEnvStrict: {
    EXPO_PUBLIC_SERVER_URL: process.env.EXPO_PUBLIC_SERVER_URL,
    EXPO_PUBLIC_GOOGLE_MAPS_WEBVIEW:
      process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEBVIEW,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
