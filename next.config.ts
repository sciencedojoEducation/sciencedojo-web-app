import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["192.168.1.149"],
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
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
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
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://www.googletagmanager.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://unpkg.com https://cdn.tldraw.com https://meet.jit.si https://*.jit.si wss://*.jit.si https://www.google-analytics.com https://analytics.google.com; frame-src 'self' https://meet.jit.si https://*.jit.si; img-src 'self' data: blob: https://*.supabase.co https://i.ytimg.com https://lh3.googleusercontent.com https://unpkg.com https://cdn.tldraw.com https://meet.jit.si https://*.jit.si https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com https://unpkg.com https://cdn.tldraw.com https://meet.jit.si https://*.jit.si; worker-src 'self' blob:; child-src 'self' blob: https://meet.jit.si https://*.jit.si;",
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
