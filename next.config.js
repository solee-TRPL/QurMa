/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ppsyhgkhuuxxppjkewso.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      }
    ],
  },
  async redirects() {
    return [
      {
        source: '/app',
        destination: '/dashboard',
        permanent: false,
      }
    ]
  },
  async rewrites() {
    return [
      {
        source: '/app/:path*',
        destination: '/:path*',
      }
    ]
  }
}

export default nextConfig;
