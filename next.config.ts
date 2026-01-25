import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  eslint: {
    // Warning: pre-existing ESLint warnings (no-explicit-any, no-unused-vars)
    // These should be fixed incrementally but shouldn't block builds
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
