/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove 'output: export' for security middleware support
  eslint: {
    // Re-enable ESLint checks for security
    ignoreDuringBuilds: false,
  },
  images: { 
    unoptimized: true,
    domains: [], // Add allowed domains for external images
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
        ],
      },
    ];
  },
  
  // Environment variables validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Redirects for security
  async redirects() {
    return [
      // Redirect old admin paths
      {
        source: '/admin',
        destination: '/login',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
