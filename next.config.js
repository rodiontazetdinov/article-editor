/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/article-editor',
  images: {
    unoptimized: true,
    domains: ['localhost', 'storage.googleapis.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/deepseek/:path*',
        destination: 'https://api.deepseek.com/v1/:path*',
      },
    ];
  },
}

module.exports = nextConfig 