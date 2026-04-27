import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer, dev }) => {
    // Web Worker support — must be explicit for consistent behavior
    // across dev and production builds
    config.output.globalObject = "globalThis";

    if (!isServer) {
      // Prevent Node-only modules from being bundled into the client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
      };
    }
    return config;
  },

  // Security headers — applied to every route.
  // These cost nothing now and are a significant security baseline.
  // You will harden these per-route in the security phase.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevents browsers from MIME-sniffing — stops a class of XSS
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Disables framing (clickjacking protection)
          { key: "X-Frame-Options", value: "DENY" },
          // Forces HTTPS — enable only after you have a domain + SSL
          // { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          // Referrer policy — don't leak URLs to third parties
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Permissions policy — opt out of browser features you don't use
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  experimental: {
    // Enable when you add Turbopack via `next dev --turbo`
    // turbo: {},
  },
};

export default nextConfig;