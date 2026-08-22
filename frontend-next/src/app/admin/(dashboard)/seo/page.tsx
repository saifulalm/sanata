import type { Metadata } from "next";
import Link from "next/link";
import { Search, EyeOff, TrendingUp, AlertTriangle, ExternalLink, ShieldCheck, ShieldAlert, FileText } from "lucide-react";
import { requireAdminRole } from "@/lib/adminApi";
import { getSeoOverview, getSiteSettings, type SeoOverviewRow } from "@/lib/adminResources";
import { StatCard } from "@/components/admin/StatCard";
import { PageHeader, Panel, TableWrap, Th, Td, Badge, EmptyState } from "@/components/admin/ui";
import { SettingsForm } from "../site-content/SettingsForm";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "SEO" };

const GRADE_META: Record<SeoOverviewRow["grade"], { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  baik: { label: "Baik", tone: "success" },
  cukup: { label: "Cukup", tone: "warning" },
  kurang: { label: "Kurang", tone: "danger" },
};

function ScoreRing({ score }: { score: number }) {
  const tone = score >= 80 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400";
  const circumference = 2 * Math.PI * 15;
  return (
    <div className="relative h-11 w-11 shrink-0">
      <svg viewBox="0 0 36 36" className="h-11 w-11 -rotate-90">
        <circle cx="18" cy="18" r="15" fill="none" strokeWidth="3" className="stroke-white/10" />
        <circle
          cx="18"
          cy="18"
          r="15"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
          className={`${tone} stroke-current`}
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-[11px] font-semibold tabular-nums ${tone}`}>
        {score}
      </span>
    </div>
  );
}

export default async function AdminSeoPage() {
  await requireAdminRole("ADMIN", "EDITOR");
  const [{ items, summary }, allSettings] = await Promise.all([getSeoOverview(), getSiteSettings()]);

  const sorted = [...items].sort((a, b) => a.score - b.score);

  const seoSettings = allSettings.filter((setting) => setting.group === "SEO");
  const settingValue = (key: string) => seoSettings.find((setting) => setting.key === key)?.value ?? "";
  const indexingAllowed = !["false", "0", "no", "off"].includes(
    settingValue("seo.allow_indexing").trim().toLowerCase()
  );
  const verified = Boolean(settingValue("seo.google_site_verification").trim());

  return (
    <div className="space-y-6">

      <PageHeader
        eyebrow="Konten"
        title="SEO"
        description="Skor on-page tiap konten, beserta hal yang masih perlu diperbaiki."
        actions={
          <div className="flex items-center gap-3">
            <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-slate-400 transition-all hover:border-white/18 hover:bg-white/[0.07] hover:text-slate-200">
              sitemap.xml <ExternalLink size={12} />
            </a>
            <a href="/robots.txt" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-slate-400 transition-all hover:border-white/18 hover:bg-white/[0.07] hover:text-slate-200">
              robots.txt <ExternalLink size={12} />
            </a>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Rata-rata Skor" value={summary.averageScore} hint="konten terpublikasi" icon={<TrendingUp size={18} />} animated={false} />
        <StatCard label="Terindeks" value={summary.indexable} hint={`dari ${summary.total} konten`} icon={<Search size={18} />} accentColor="emerald" animated={false} />
        <StatCard
          label="Perlu Perbaikan"
          value={summary.needsWork}
          hint="skor di bawah 50"
          icon={<AlertTriangle size={18} />}
          accentColor={summary.needsWork > 0 ? "amber" : "slate"}
          tone={summary.needsWork > 0 ? "attention" : "default"}
          animated={false}
        />
        <StatCard label="Disembunyikan" value={summary.noIndex} hint="ditandai noindex" icon={<EyeOff size={18} />} animated={false} />
      </div>

      {/* Technical status cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-sm ${indexingAllowed ? "border-emerald-400/20 bg-emerald-500/8" : "border-amber-400/20 bg-amber-500/8"}`}>
          {indexingAllowed
            ? <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-400" />
            : <ShieldAlert size={18} className="mt-0.5 shrink-0 text-amber-400" />
          }
          <div>
            <p className="font-medium text-slate-100">
              {indexingAllowed ? "Situs terbuka untuk mesin pencari" : "Indexing dimatikan"}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {indexingAllowed
                ? "robots.txt mengizinkan crawl dan sitemap.xml diterbitkan."
                : "robots.txt memblokir seluruh crawler dan sitemap dikosongkan. Untuk staging saja."}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm">
          {verified
            ? <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-400" />
            : <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-400" />
          }
          <div>
            <p className="font-medium text-slate-100">
              {verified ? "Google Search Console terhubung" : "Belum ada kode verifikasi Google"}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {verified
                ? "Tag verifikasi dipasang otomatis di semua halaman."
                : "Isi kode verifikasi di bawah agar performa pencarian bisa dipantau."}
            </p>
          </div>
        </div>
      </div>

      <SettingsForm
        settings={seoSettings}
        title="Pengaturan SEO Global"
        description="Judul, deskripsi, gambar sosial, dan verifikasi — dipakai seluruh halaman publik"
        showGroupLabels={false}
      />

      <Panel
        title="Skor Konten"
        description="Konten dengan skor terendah ditampilkan lebih dulu"
      >
        {sorted.length === 0 ? (
          <EmptyState
            icon={<FileText size={20} />}
            title="Belum ada konten untuk dianalisis"
            description="Publikasikan beberapa halaman konten terlebih dahulu."
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Skor</Th>
                <Th>Judul</Th>
                <Th>Kata Kunci</Th>
                <Th>Status</Th>
                <Th className="text-center">Isu</Th>
                <Th>Diperbarui</Th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => {
                const gradeMeta = GRADE_META[row.grade] ?? { label: row.grade, tone: "neutral" as const };
                return (
                  <tr key={row.id} className="transition-colors hover:bg-white/[0.02]">
                    <Td>
                      <div className="flex items-center gap-2">
                        <ScoreRing score={row.score} />
                        <Badge tone={gradeMeta.tone}>{gradeMeta.label}</Badge>
                      </div>
                    </Td>
                    <Td>
                      <Link href={`/admin/contents?search=${encodeURIComponent(row.title)}`} className="font-medium text-slate-200 hover:text-cyan-300">
                        {row.title}
                      </Link>
                      <p className="mt-0.5 font-mono text-[11px] text-slate-600">/{row.slug}</p>
                    </Td>
                    <Td>
                      {row.focusKeyword ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-xs text-slate-300">
                          {row.focusKeyword}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">belum diisi</span>
                      )}
                    </Td>
                    <Td>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge tone="neutral">{row.status}</Badge>
                        {row.noIndex && (
                          <Badge tone="warning">
                            <EyeOff size={10} /> noindex
                          </Badge>
                        )}
                      </div>
                    </Td>
                    <Td className="text-center">
                      {row.issues > 0 ? (
                        <span className="font-semibold tabular-nums text-amber-400">{row.issues}</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </Td>
                    <Td>
                      <span className="whitespace-nowrap text-xs text-slate-500">{formatDate(row.updatedAt)}</span>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        )}
      </Panel>
    </div>
  );
}
