/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  // Disable undici and use native fetch
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Force use of native fetch instead of undici
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ensure we use native fetch on server side
      config.resolve.alias = {
        ...config.resolve.alias,
        'undici': false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;