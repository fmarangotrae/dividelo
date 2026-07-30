/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@dividelo/shared', '@dividelo/db'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
