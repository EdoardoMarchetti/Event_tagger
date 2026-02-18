/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
  // Rewrite API calls to backend in production
  // Set NEXT_PUBLIC_API_URL environment variable in Vercel dashboard to your backend URL
  async rewrites() {
    // In production, proxy API calls through Vercel to avoid CORS issues
    // Backend URL should be set via NEXT_PUBLIC_API_URL environment variable
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;
    
    if (backendUrl && process.env.NODE_ENV === 'production') {
      return [
        {
          source: '/api/:path*',
          destination: `${backendUrl}/api/:path*`,
        },
      ];
    }
    return [];
  },
}

module.exports = nextConfig
