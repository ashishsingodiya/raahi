import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { nextCookies } from "better-auth/next-js";

import { initAuth } from "@ridemate/auth";

import { env } from "~/env";

export const auth = initAuth({
  baseUrl: env.NEXT_PUBLIC_APP_URL,
  secret: env.BETTER_AUTH_SECRET,
  googleClientId: env.AUTH_GOOGLE_CLIENT_ID,
  googleClientSecret: env.AUTH_GOOGLE_CLIENT_SECRET,
  extraPlugins: [nextCookies()],
  trustedOrigins: [
    "ridemate://",
    "ridemate-dev://",
    "ridemate-preview://",
    "expo://",
    "exp://",
  ],
});

/** Current session (or null), deduplicated per request. */
export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);
