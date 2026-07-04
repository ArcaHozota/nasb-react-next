import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // vite.config.ts の server.proxy 設定に合わせたもの。
  // rewrite: (path) => path.replace(/^\/api/, "") 相当で、
  // /api を剥がしてバックエンド(localhost:8277)へ転送する。
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8277/:path*",
      },
    ];
  },
};

export default nextConfig;
