import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    typedRoutes: true,
    instrumentationHook: true,
    serverActions: {
      allowedOrigins: ['localhost']
    }
  }
};

export default nextConfig;
