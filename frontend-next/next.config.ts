import type { NextConfig } from "next";
import path from "path";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api").replace(/\/api\/?$/, "");

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(import.meta.dirname, ".."),
  },
  /**
   * Proxy API calls to backend during development.
   * This prevents CORS issues and makes local development easier.
   */
  async rewrites() {
    return [
      // Proxy uploads to API origin
      { source: "/uploads/:path*", destination: `${API_ORIGIN}/uploads/:path*` },
      // Proxy all /api/* calls to backend
      { source: "/api/:path*", destination: `${API_ORIGIN}/api/:path*` },
    ];
  },
};

export default nextConfig;
