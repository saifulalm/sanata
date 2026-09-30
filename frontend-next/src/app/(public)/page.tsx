import { redirect } from "next/navigation";

/**
 * Route utama (/ ) redirect ke halaman Under Construction.
 *
 * TODO: Kembalikan ke FuturisticHomePage setelah semua fitur selesai.
 * Semua route public lain (/about, /services, dll.) tetap accessible.
 */
export default function HomePage() {
  redirect("/under-construction");
}
