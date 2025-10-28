import type { NextConfig } from "next";

// Bundle Analyzer for performance monitoring
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  reactStrictMode: true,

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

    // React Compiler: Automatic memoization and optimization
    reactCompiler: true,

    // Inline CSS: Eliminates render-blocking CSS requests
    inlineCss: true,
  },

  // Enable compression
  compress: true,
};

export default withBundleAnalyzer(nextConfig);
