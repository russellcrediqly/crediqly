/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/account',
        destination: '/profile',
        permanent: false,
      },
      {
        source: '/account/profile',
        destination: '/profile',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
