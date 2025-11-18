/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['ffmpeg-static', 'fluent-ffmpeg'],
  turbopack: {},
  // Disable caching in development
  ...(process.env.NODE_ENV === 'development' && {
    headers: async () => {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'Cache-Control',
              value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            },
            {
              key: 'Pragma',
              value: 'no-cache',
            },
            {
              key: 'Expires',
              value: '0',
            },
          ],
        },
      ];
    },
  }),
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    config.externals.push({
      'fluent-ffmpeg': 'commonjs fluent-ffmpeg',
      'ffmpeg-static': 'commonjs ffmpeg-static',
    });
    return config;
  },
};

module.exports = nextConfig;
