/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  experimental: {
    serverComponentsExternalPackages: ['@google/generative-ai', 'node-fetch', 'uuid']
  },
};

module.exports = nextConfig;
