/**
 * Semua halaman admin dirender dinamis, jadi tiap perpindahan menu menunggu
 * server. Skeleton ini memberi umpan balik langsung agar UI tidak terasa beku.
 */
export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Memuat">
      <div className="space-y-2">
          <div className="h-7 w-52 rounded-lg bg-white/10" />
          <div className="h-4 w-72 rounded bg-white/6" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl border border-white/10 bg-white/[0.04]" />
        ))}
      </div>

            <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
              <div className="h-11 border-b border-white/10 bg-white/[0.03]" />
        {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 border-b border-white/10 px-4 py-4 last:border-0">
                  <div className="h-4 w-24 rounded bg-white/6" />
                  <div className="h-4 flex-1 rounded bg-white/6" />
                  <div className="h-4 w-20 rounded bg-white/6" />
                  <div className="h-4 w-16 rounded bg-white/6" />
          </div>
        ))}
      </div>
    </div>
  );
}
