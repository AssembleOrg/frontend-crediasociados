import type { NextConfig } from "next";

// Bundle Analyzer for performance monitoring
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Turbopack root directory - Fix for file watch limit
  // This prevents Next.js from watching the entire parent directory
  turbopack: {
    root: process.cwd(),
  },

  // React Compiler: Automatic memoization and optimization (moved from experimental)
  reactCompiler: true,

  // Compiler optimizations
  compiler: {
    // Remove console.log in production (keep error/warn)
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false
  },

  // Experimental optimizations
  experimental: {
    // Optimize package imports to reduce bundle size
    optimizePackageImports: ['@mui/material', '@mui/icons-material', 'recharts', 'lucide-react'],

    // Inline CSS: Eliminates render-blocking CSS requests
    inlineCss: true,

    // Pre-compile critical pages on build
    optimizeCss: true,
  },

  // Enable compression
  compress: true,

  typescript: {
    ignoreBuildErrors: true,
  },

  // Proxy to backend API for security
  // This proxies /api/* to the backend URL
  async rewrites() {
    // Backend URL should include full path (e.g., .../api/v1)
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
