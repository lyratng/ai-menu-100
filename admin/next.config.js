/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // 环境变量
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  },
  
  // 图片优化
  images: {
    domains: [],
  },
  
  // 输出配置
  output: 'standalone',
};

module.exports = nextConfig;

