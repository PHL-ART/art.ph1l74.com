/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  images: {
    // Images are served directly from S3 — Next.js optimization is bypassed.
    // This avoids /_next/image 500s caused by missing sharp or S3 CORS restrictions.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.S3_ENDPOINT ?? 's3.firstvds.ru',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig
