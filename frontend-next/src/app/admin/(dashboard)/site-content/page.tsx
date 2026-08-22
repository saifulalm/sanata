import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, LayoutList } from "lucide-react";
import { requireAdminRole } from "@/lib/adminApi";
import { getSiteCollections, getSiteSettings } from "@/lib/adminResources";
import { SettingsForm } from "./SettingsForm";
import { PageHeader, Panel } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Konten Situs" };

export default async function SiteContentPage() {
  await requireAdminRole("ADMIN", "EDITOR");
  const [collections, settings] = await Promise.all([getSiteCollections(), getSiteSettings()]);

  const byPage = new Map<string, { key: string; label: string; description: string }[]>();
  for (const [key, def] of Object.entries(collections)) {
    const list = byPage.get(def.page) ?? [];
    list.push({ key, label: def.label, description: def.description });
    byPage.set(def.page, list);
  }

  return (
    <div className="space-y-8">

      <PageHeader
        eyebrow="Situs & Konten"
        title="Konten Situs"
        description="Ubah teks dan daftar yang tampil di beranda serta halaman publik lainnya."
      />

      <SettingsForm settings={settings} />

      <div className="space-y-6">
        {[...byPage.entries()].map(([page, items]) => (
          <section key={page}>
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {page}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((item) => (
                <Link
                  key={item.key}
                  href={`/admin/site-content/${item.key}`}
                  className="group flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all hover:border-cyan-400/30 hover:bg-white/[0.05]"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-slate-400">
                    <LayoutList size={16} />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-slate-200">{item.label}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                      {item.description}
                    </span>
                  </span>
                  <ChevronRight
                    size={16}
                    className="mt-1 shrink-0 text-slate-600 transition-colors group-hover:text-cyan-400"
                  />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
