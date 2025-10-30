/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['ffmpeg-static', 'fluent-ffmpeg'],
  experimental: {
    turbo: {
      resolveAlias: {
        'fluent-ffmpeg': 'fluent-ffmpeg',
      },
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    config.externals.push({
      'fluent-ffmpeg': 'commonjs fluent-ffmpeg',
      'ffmpeg-static': 'commonjs ffmpeg-static'
    });
    return config;
  },
}

module.exports = nextConfig
