import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  output: "standalone",
  webpack: (config, { isServer }) => {
    config.output.globalObject = "globalThis";
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false, path: false, os: false, crypto: false,
      };
    }
    return config;
  },
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key:   "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key:   "X-Frame-Options",
            value: "DENY",
          },
          {
            key:   "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key:   "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          /**
           * HSTS — tells browsers to only use HTTPS for the next 2 years.
           * ONLY enable after SSL is confirmed on your production domain.
           * Enabling on a domain without HTTPS bricks it for 2 years.
           * Uncomment when you have a domain + SSL certificate:
           */
          // {
          //   key:   "Strict-Transport-Security",
          //   value: "max-age=63072000; includeSubDomains; preload",
          // },
          /**
           * CSP is set per-request in middleware.ts (needs nonce).
           * The static header below is a fallback for routes that bypass middleware.
           * The middleware CSP always wins for canvas routes.
           */
          {
            key:   "Content-Security-Policy",
            value: isDev
              ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' wss: ws: https:; worker-src 'self' blob:; frame-ancestors 'none';"
              : "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' wss: https:; worker-src 'self' blob:; frame-ancestors 'none'; upgrade-insecure-requests;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;