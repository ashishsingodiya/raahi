import type { NextConfig } from "next";

// Validate environment variables at build/dev start.
import "./src/env";

const nextConfig: NextConfig = {
  output: "standalone",
  /** Enables hot reloading for local packages without a build step */
  transpilePackages: [
    "@ridemate/api",
    "@ridemate/auth",
    "@ridemate/db",
    "@ridemate/ui",
  ],
};

export default nextConfig;
