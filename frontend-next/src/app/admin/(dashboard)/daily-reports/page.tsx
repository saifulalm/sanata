import type { Metadata } from "next";
import Link from "next/link";
import {
  ScrollText,
  CalendarDays,
  MapPin,
  CloudRain,
  Sun,
  CloudSun,
  CloudDrizzle,
  CloudLightning,
  ArrowRight,
  BarChart2,
} from "lucide-react";
import { requireAdminRole } from "@/lib/adminApi";
import { getDailyReportSummary } from "@/lib/adminResources";
import { formatDate } from "@/lib/format";
import { StatCard } from "@/components/admin/StatCard";
import {
  PageHeader,
  Panel,
  btn,
  EmptyState,
} from "@/components/admin/ui";

// ── Weather meta ───────────────────────────────────────────────────────────────

const WM = {
  CERAH: { label: "Cerah", icon: <Sun size={10} />, tone: "bg-amber-500/15 border border-amber-400/20 text-amber-300" },
  BERAWAN: { label: "Berawan", icon: <CloudSun size={10} />, tone: "bg-slate-500/15 border border-slate-400/20 text-slate-300" },
  GERIMIS: { label: "Gerimis", icon: <CloudDrizzle size={10} />, tone: "bg-sky-500/15 border border-sky-400/20 text-sky-300" },
  HUJAN: { label: "Hujan", icon: <CloudRain size={10} />, tone: "bg-blue-500/15 border border-blue-400/20 text-blue-300" },
  HUJAN_LEBAT: { label: "Hujan Lebat", icon: <CloudLightning size={10} />, tone: "bg-indigo-500/15 border border-indigo-400/20 text-indigo-300" },
} as const;

type WeatherKey = keyof typeof WM;

// ── Page ─────────────────────────────────────────────────────────────────────

export const metadata: Metadata = { title: "Laporan Harian" };

export default async function DailyReportsPage() {
  await requireAdminRole("ADMIN", "EDITOR");
  const projects = await getDailyReportSummary();

  const totalReports = projects.reduce((s, p) => s + p.reportCount, 0);
  const activeProjects = projects.filter((p) => p.reportCount > 0);
  const noReports = projects.filter((p) => p.reportCount === 0);

  return (
    <div className="space-y-6">

      {/* ── Page Header ───────────────────────────────────── */}
      <PageHeader
        eyebrow="Pelaporan"
        title="Laporan Harian"
        description="Pantau pencatatan harian dari seluruh tim lapangan."
        actions={
          <Link href="/admin/roles" className={btn("secondary")}>
            <BarChart2 size={14} />
            Kelola Jabatan
          </Link>
        }
      />

      {/* ── Summary Cards ──────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Proyek"
          value={projects.length}
          hint={`${activeProjects.length} dengan laporan`}
          icon={<ScrollText size={18} />}
          accentColor="cyan"
          animated={false}
        />
        <StatCard
          label="Laporan Tercatat"
          value={totalReports}
          hint={`dari ${projects.length} proyek`}
          icon={<CalendarDays size={18} />}
          accentColor="emerald"
          animated={false}
        />
        <StatCard
          label="Tanpa Laporan"
          value={noReports.length}
          hint={noReports.length === 0 ? "Semua proyek sudah mencatat" : "butuh perhatian"}
          icon={<ScrollText size={18} />}
          accentColor={noReports.length > 0 ? "amber" : "cyan"}
          tone={noReports.length > 0 ? "attention" : "default"}
          animated={false}
        />
      </div>

      {/* ── Project List ──────────────────────────────────── */}
      {projects.length === 0 ? (
        <EmptyState
          icon={<ScrollText size={20} />}
          title="Belum ada proyek"
          description="Proyek dengan RAB aktif akan muncul di halaman ini."
        />
      ) : (
        <Panel
          title={`Proyek (${projects.length})`}
          padded={false}
        >
          {projects.map((project, idx) => {
            const latest = project.latestReport;
            const wmM = latest?.weatherMorning ? WM[latest.weatherMorning as WeatherKey] : null;
            const wmA = latest?.weatherAfternoon ? WM[latest.weatherAfternoon as WeatherKey] : null;
            const first = idx === 0;
            const last = idx === projects.length - 1;

            return (
              <div
                key={project.id}
                className={[
                  "flex flex-col gap-3 border-b border-white/[0.06] px-5 py-4 transition-colors hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between",
                  first ? "rounded-t-2xl" : "",
                  last ? "rounded-b-2xl border-b-0" : "",
                ].join(" ")}
              >
                {/* Project identity */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-cyan-400/20 bg-cyan-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-cyan-300">
                      {project.number}
                    </span>
                    <span className="font-medium text-white">{project.title}</span>
                  </div>
                  {project.location && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin size={11} />
                      {project.location}
                    </div>
                  )}
                </div>

                {/* Report count */}
                <div className="flex items-center gap-2">
                  {project.reportCount > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-500/10 text-xs font-bold text-cyan-300">
                        {project.reportCount}
                      </div>
                      <span className="text-xs text-slate-500">laporan</span>
                    </div>
                  ) : (
                    <span className="rounded-full border border-dashed border-white/10 bg-white/[0.02] px-2.5 py-0.5 text-[11px] text-slate-600">
                      belum ada
                    </span>
                  )}

                  {latest && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span className="hidden text-slate-600 sm:inline">terakhir:</span>
                      <span className="font-medium text-slate-300">{formatDate(latest.date)}</span>
                    </div>
                  )}
                </div>

                {/* Weather + CTA */}
                <div className="flex items-center gap-2">
                  {wmM && (
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ${wmM.tone}`}>
                      {wmM.icon}
                      <span className="hidden sm:inline">{wmM.label}</span>
                    </span>
                  )}
                  {wmA && (
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ${wmA.tone}`}>
                      {wmA.icon}
                      <span className="hidden sm:inline">{wmA.label}</span>
                    </span>
                  )}

                  <Link
                    href={`/admin/rab/${project.id}/daily-reports`}
                    className={btn("secondary", "sm")}
                  >
                    {project.reportCount > 0 ? (
                      <>Buka <ArrowRight size={13} /></>
                    ) : (
                      <>Mulai <ArrowRight size={13} /></>
                    )}
                  </Link>
                </div>
              </div>
            );
          })}
        </Panel>
      )}

      {/* ── Info Strip ──────────────────────────────────── */}
      <div className="rounded-xl border border-cyan-400/10 bg-cyan-500/5 px-4 py-3">
        <p className="text-xs text-slate-400">
          Laporan harian dibuat per proyek di tab{" "}
          <Link href="/admin/rab" className="font-medium text-cyan-300 hover:text-cyan-200">
            Proyek &amp; RAB
          </Link>
          . Kelola peran tenaga kerja di{" "}
          <Link href="/admin/roles" className="font-medium text-cyan-300 hover:text-cyan-200">
            Jabatan &amp; Peran
          </Link>
          .
        </p>
      </div>

    </div>
  );
}
