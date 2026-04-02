import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/vi/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.daily.co blob:; connect-src 'self' https://*.daily.co wss://*.daily.co https://*.supabase.co wss://*.supabase.co https://unpkg.com https://cdn.tldraw.com; frame-src 'self' https://*.daily.co; img-src 'self' data: blob: https://*.supabase.co https://i.ytimg.com https://unpkg.com https://cdn.tldraw.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com https://unpkg.com https://cdn.tldraw.com; worker-src 'self' blob: https://*.daily.co; child-src 'self' blob: https://*.daily.co;",
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
