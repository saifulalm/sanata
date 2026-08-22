import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 pt-24 text-center">
      <p className="font-accent text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">404</p>
      <h1 className="mt-3 font-display text-3xl font-semibold text-white md:text-4xl">
        Halaman ini belum tersedia
      </h1>
      <p className="mt-3 max-w-md text-slate-400">
        Halaman yang Anda cari sedang dalam pengembangan atau tidak ditemukan.
      </p>
      <Button href="/" className="mt-8">
        Kembali ke Beranda
      </Button>
    </div>
  );
}
