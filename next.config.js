/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['ffmpeg-static'],
  turbopack: {
    resolveAlias: {
      'fluent-ffmpeg': require.resolve('fluent-ffmpeg'),
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'fluent-ffmpeg': require.resolve('fluent-ffmpeg'),
    };
    return config;
  },
}

module.exports = nextConfig
