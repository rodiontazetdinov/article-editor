/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/pdf/:path*',
        destination: 'https://service-pdf.teach-in.ru/:path*'
      }
    ];
  }
};

module.exports = nextConfig; 