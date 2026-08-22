import type { NextConfig } from "next";
import path from "path";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api").replace(/\/api\/?$/, "");

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(import.meta.dirname, ".."),
  },
  /**
   * Berkas unggahan disajikan satu origin dengan aplikasi lewat rewrite, bukan
   * langsung dari host API. Sejak Next 16, pengoptimal gambar menolak URL yang
   * menunjuk ke IP privat/loopback (proteksi SSRF), sehingga memakai origin API
   * secara langsung akan gagal di pengembangan lokal. Cara ini juga yang
   * dipakai di produksi bila aplikasi berada di belakang reverse proxy.
   */
  async rewrites() {
    return [{ source: "/uploads/:path*", destination: `${API_ORIGIN}/uploads/:path*` }];
  },
};

export default nextConfig;
