import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.DOCKER_BUILD ? "standalone" : undefined,
  async redirects() {
    return [
      { source: "/", destination: "/overview", permanent: false },
      { source: "/settings", destination: "/settings/org", permanent: false },
    ];
  },
};

export default nextConfig;
