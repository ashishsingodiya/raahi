/**
 * Only used by the Better Auth CLI to generate the database schema.
 * The real auth instance is created in apps/web/src/auth/server.ts.
 */
import { initAuth } from "../src";

export const auth = initAuth({
  baseUrl: "http://localhost:3000",
  secret: "cli-only-secret-not-used-at-runtime-000000",
  googleClientId: "cli",
  googleClientSecret: "cli",
});
