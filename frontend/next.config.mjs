/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const backend = process.env.BACKEND_URL || 'http://127.0.0.1:4000';
    return [{ source: '/uploads/:path*', destination: `${backend.replace(/\/$/, '')}/uploads/:path*` }];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**'
      }
    ]
  }
};

export default nextConfig;
