import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

import { env as authEnv } from "@raahi/auth/env";
import { env as dbEnv } from "@raahi/db/env";

export const env = createEnv({
  extends: [dbEnv, authEnv],
  shared: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },
  /**
   * Server-only variables. Never sent to the browser.
   */
  server: {},
  /**
   * Browser-visible variables. Must start with NEXT_PUBLIC_.
   */
  client: {
    NEXT_PUBLIC_APP_URL: z.url(),
  },
  /**
   * Only client + shared variables need to be listed here.
   * Server variables are read from process.env automatically.
   */
  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
