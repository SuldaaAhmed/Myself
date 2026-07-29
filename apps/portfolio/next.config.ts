import type { NextConfig } from 'next';

/**
 * The API base URL is read once here so the origin can be derived for
 * `images.remotePatterns` — project screenshots are served by the same backend
 * that serves the JSON, and Next refuses to optimise an image from a host it
 * has not been told about.
 */
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

function apiHostname(): string {
  try {
    return new URL(apiBaseUrl).hostname;
  } catch {
    return 'localhost';
  }
}

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'http', hostname: apiHostname() },
      { protocol: 'https', hostname: apiHostname() },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default nextConfig;
