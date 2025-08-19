/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  generateEtags: false,
  compress: true,

  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },

  images: {
    unoptimized: false,
    domains: [],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  serverExternalPackages: [],

  webpack: (config, { dev, isServer }) => {
    if (!isServer) {
      // Keep only safe fallbacks
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };

      // Disable our custom chunking/concatenation to avoid RSC/App Router issues
      if (!dev) {
        delete config.optimization.splitChunks;
        delete config.optimization.runtimeChunk;
        // Do not force sideEffects/usedExports
      }
    }

    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'utf-8-validate': 'commonjs utf-8-validate',
        'bufferutil': 'commonjs bufferutil',
      });
    }

    // Keep warnings ignore as-is
    config.ignoreWarnings = [
      /Failed to parse source map/,
      /Module not found: Can't resolve 'encoding'/,
      /Critical dependency: the request of a dependency is an expression/,
      /bufferutil/,
      /utf-8-validate/,
    ];

    return config;
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ];
  },

  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  async redirects() {
    return [
      { source: '/admin', destination: '/login', permanent: false },
      { source: '/api/v1/(.*)', destination: '/api/$1', permanent: false },
    ];
  },

  experimental: {
    // Disable optimizePackageImports to avoid client/runtime issues
    optimizePackageImports: undefined,
    scrollRestoration: true,
  },

  compress: true,
  trailingSlash: false,
  basePath: '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
};

module.exports = nextConfig;
