import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@causal/shared"],
  experimental: {
    turbo: {
      root: "../../",
    },
  },
};

export default nextConfig;
