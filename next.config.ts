import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  compress: true,
  productionBrowserSourceMaps: false,
  output: 'standalone',
  // Transpile external ESM packages to avoid HMR/module factory issues
  transpilePackages: [
    '@dynamic-labs/sdk-react-core',
    '@dynamic-labs/utils',
    '@dynamic-labs/ethereum',
    '@dynamic-labs/ethers-v6',
    '@dynamic-labs/wagmi-connector',
    'eventemitter3'
  ],
  modularizeImports: {
    'date-fns': {
      transform: 'date-fns/{{member}}'
    }
  },
  images: {
    formats: ['image/avif', 'image/webp']
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
        ]
      },
      {
        source: '/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
        ]
      },
      {
        source: '/robots.txt',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' }
        ]
      }
    ]
  }
};

export default nextConfig;
