import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  transpilePackages: ["@brisa/ui"],
  experimental: {
    externalDir: true,
    serverActions: {
      allowedOrigins: [
        "localhost",
        "brisa-cubana.vercel.app",
        "brisacubana.com",
      ],
    },
  },
};

export default nextConfig;
