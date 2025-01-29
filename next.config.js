/** @type {import('next').NextConfig} */

const isGithubPages = process.env.DEPLOY_TARGET === 'gh-pages';

const nextConfig = {
  ...(isGithubPages ? {
    output: 'export',
    basePath: '/article-editor',
  } : {}),
  images: {
    unoptimized: true,
    domains: ['localhost', 'storage.googleapis.com'],
  },
  async rewrites() {
    if (isGithubPages) return [];
    return [
      {
        source: '/api/deepseek/:path*',
        destination: 'https://api.deepseek.com/v1/:path*'
      }
    ];
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
      encoding: false
    };
    
    // Копируем PDF.js worker в публичную директорию
    config.module.rules.push({
      test: /pdf\.worker\.(min\.)?js/,
      type: 'asset/resource',
      generator: {
        filename: 'static/worker/[hash][ext][query]'
      }
    });

    return config;
  }
};

module.exports = nextConfig; 