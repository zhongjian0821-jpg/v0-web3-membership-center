/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    resolveAlias: {
      // 将 thread-stream 替换为空模块，避免构建测试文件
      'thread-stream': './lib/empty-module.js',
      // 将 pino 替换为浏览器版本
      'pino': 'pino/browser',
      // 替换其他 Node.js 专用模块
      'pino-pretty': './lib/empty-module.js',
      'atomic-sleep': './lib/empty-module.js',
      'sonic-boom': './lib/empty-module.js',
    },
  },
}

export default nextConfig
