import type { BetterAuthPlugin } from "better-auth";
import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";

import { db } from "@ridemate/db/client";

import { ac, roles } from "./permissions";

export interface AuthOptions {
  baseUrl: string;
  secret: string;
  googleClientId: string;
  googleClientSecret: string;
  trustedOrigins?: string[];
  extraPlugins?: BetterAuthPlugin[];
}

export function initAuth(options: AuthOptions) {
  return betterAuth({
    baseURL: options.baseUrl,
    secret: options.secret,
    trustedOrigins: options.trustedOrigins,
    database: drizzleAdapter(db, { provider: "pg" }),
    socialProviders: {
      google: {
        clientId: options.googleClientId,
        clientSecret: options.googleClientSecret,
      },
    },
    plugins: [
      admin({
        ac,
        roles,
        defaultRole: "user",
      }),
      expo(),
      ...(options.extraPlugins ?? []),
    ],
  });
}

export type Auth = ReturnType<typeof initAuth>;
export type Session = Auth["$Infer"]["Session"];
