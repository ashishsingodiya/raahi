import type { NextConfig } from "next";

// Validate environment variables at build/dev start.
import "./src/env";

const nextConfig: NextConfig = {
  output: "standalone",

  /** Enables hot reloading for local packages without a build step */
  transpilePackages: ["@raahi/api", "@raahi/auth", "@raahi/db", "@raahi/ui"],
};

export default nextConfig;
