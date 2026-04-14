import type { NextConfig } from "next";

/**
 * `npm run dev` sets `NEXT_DEV_DIST_DIR` so development uses a separate folder from
 * `next build` / `next start` (`.next`). That avoids ENOENT manifest errors when
 * production output is partial or two modes fight over the same cache.
 */
const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DEV_DIST_DIR ?? ".next",
  serverExternalPackages: ["mongoose", "mongodb", "bcryptjs"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "greenwellindia.in",
        pathname: "/assets/**",
      },
      {
        protocol: "https",
        hostname: "login.greenwellindia.in",
        pathname: "/assets/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: "/api/file/:path*",
      },
    ];
  },
};

export default nextConfig;
