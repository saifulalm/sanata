import type { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  ClipboardCheck,
  Briefcase,
  Camera,
  ShieldCheck,
  Wrench,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Star,
} from "lucide-react";

// Force dynamic rendering for real-time data
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SANTRA - Workforce Dashboard",
  description: "Digital Workforce Management System",
};

import { getWorkerStats, getAssignments, getExecutions, getQcStats, getToolStats } from "@/lib/workforceApi.server";
import { getAdminSession } from "@/lib/adminApi";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  accent?: "cyan" | "emerald" | "amber" | "rose";
}

function StatCard({ title, value, subtitle, icon, accent = "cyan" }: StatCardProps) {
  const accentColors = {
    cyan: "from-cyan-500/10 to-cyan-500/5 border-cyan-500/20",
    emerald: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
    amber: "from-amber-500/10 to-amber-500/5 border-amber-500/20",
    rose: "from-rose-500/10 to-rose-500/5 border-rose-500/20",
  };

  const iconColors = {
    cyan: "text-cyan-400 bg-cyan-500/10",
    emerald: "text-emerald-400 bg-emerald-500/10",
    amber: "text-amber-400 bg-amber-500/10",
    rose: "text-rose-400 bg-rose-500/10",
  };

  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${accentColors[accent]} p-5 backdrop-blur-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div className={`rounded-xl p-3 ${iconColors[accent]}`}>{icon}</div>
      </div>
    </div>
  );
}

interface MenuCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  accent?: "cyan" | "emerald" | "amber" | "rose";
}

function MenuCard({ title, description, href, icon, accent = "cyan" }: MenuCardProps) {
  const accentBorder = {
    cyan: "hover:border-cyan-500/40",
    emerald: "hover:border-emerald-500/40",
    amber: "hover:border-amber-500/40",
    rose: "hover:border-rose-500/40",
  };

  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all duration-300 ${accentBorder[accent]} hover:bg-white/[0.06]`}
    >
      <div className="p-6">
        <div className={`mb-4 inline-flex rounded-xl p-3 ${
          accent === "cyan" ? "bg-cyan-500/10 text-cyan-400" :
          accent === "emerald" ? "bg-emerald-500/10 text-emerald-400" :
          accent === "amber" ? "bg-amber-500/10 text-amber-400" :
          "bg-rose-500/10 text-rose-400"
        }`}>
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-white group-hover:text-cyan-300">{title}</h3>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      </div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
        <ArrowRight size={20} className="text-cyan-400" />
      </div>
    </Link>
  );
}

export default async function WorkforceDashboard() {
  // Ensure user is authenticated
  await getAdminSession().catch(() => {
    // If not authenticated, stats will show 0
  });

  // Fetch stats in parallel
  const [workerStats, assignmentsResult, executionsResult, qcStats, toolStats] = await Promise.allSettled([
    getWorkerStats(),
    getAssignments({ status: "IN_PROGRESS", pageSize: 1 }),
    getExecutions({ pageSize: 1 }),
    getQcStats(),
    getToolStats(),
  ]);

  const workerStatsData = workerStats.status === "fulfilled" ? workerStats.value : null;
  const assignmentsData = assignmentsResult.status === "fulfilled" ? assignmentsResult.value : null;
  const executionsData = executionsResult.status === "fulfilled" ? executionsResult.value : null;
  const qcStatsData = qcStats.status === "fulfilled" ? qcStats.value : null;
  const toolStatsData = toolStats.status === "fulfilled" ? toolStats.value : null;

  // Calculate pass rate
  const passRate = qcStatsData && qcStatsData.total > 0
    ? Math.round((qcStatsData.pass / qcStatsData.total) * 100)
    : 0;

  // Count today's executions (simplified - count all executions if date matches)
  const todayExecutions = executionsData?.data.length || 0;

  const menuItems = [
    {
      title: "Database Tenaga Kerja",
      description: "Kelola profil, skill, grade, dan verifikasi KTP tenaga kerja",
      href: "/admin/workforce/workers",
      icon: <Users size={24} />,
      accent: "cyan" as const,
    },
    {
      title: "Assessment & Kompetensi",
      description: "Catat penilaian skill, interview, dan rekomendasi grade",
      href: "/admin/workforce/assessments",
      icon: <ClipboardCheck size={24} />,
      accent: "emerald" as const,
    },
    {
      title: "Penugasan Pekerjaan",
      description: "WBS-based job assignment dengan responsible person",
      href: "/admin/workforce/assignments",
      icon: <Briefcase size={24} />,
      accent: "cyan" as const,
    },
    {
      title: "Execution & Dokumentasi",
      description: "Daily log dengan foto, GPS location, dan progress tracking",
      href: "/admin/workforce/executions",
      icon: <Camera size={24} />,
      accent: "emerald" as const,
    },
    {
      title: "Quality Control",
      description: "QC checklist dengan evidence photo dan rework tracking",
      href: "/admin/workforce/qc",
      icon: <ShieldCheck size={24} />,
      accent: "amber" as const,
    },
    {
      title: "KPI Performance",
      description: "Tracking quality, productivity, attendance per worker",
      href: "/admin/workforce/kpi",
      icon: <Star size={24} />,
      accent: "rose" as const,
    },
    {
      title: "Tools & Inventory",
      description: "Master alat, personal tools, dan loan management",
      href: "/admin/workforce/tools",
      icon: <Wrench size={24} />,
      accent: "cyan" as const,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-transparent to-transparent p-8">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
            SANTRA - Digital Workforce
          </div>
          <h1 className="mt-4 text-3xl font-bold text-white">Manajemen Tenaga Kerja</h1>
          <p className="mt-2 max-w-xl text-slate-400">
            Sistem terintegrasi untuk mengelola database tenaga kerja, assessment kompetensi,
            penugasan pekerjaan, quality control, dan performance tracking.
          </p>
        </div>
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-cyan-500/5 blur-2xl" />
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Worker"
          value={workerStatsData?.total ?? 0}
          subtitle={`Aktif: ${workerStatsData?.active ?? 0}`}
          icon={<Users size={24} />}
          accent="cyan"
        />
        <StatCard
          title="Assignment Aktif"
          value={assignmentsData?.meta.total ?? 0}
          subtitle="Sedang dikerjakan"
          icon={<Briefcase size={24} />}
          accent="emerald"
        />
        <StatCard
          title="QC Pass Rate"
          value={`${passRate}%`}
          subtitle={`Total: ${qcStatsData?.total ?? 0} records`}
          icon={<ShieldCheck size={24} />}
          accent="amber"
        />
        <StatCard
          title="Tools Tersedia"
          value={`${toolStatsData?.available ?? 0}/${toolStatsData?.total ?? 0}`}
          subtitle={`Dipinjam: ${toolStatsData?.open ?? 0}`}
          icon={<Wrench size={24} />}
          accent="cyan"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 sm:grid-cols-4">
        <Link
          href="/admin/workforce/workers/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-300 transition-all hover:bg-cyan-500/20"
        >
          <Users size={16} />
          Tambah Worker
        </Link>
        <Link
          href="/admin/workforce/assignments/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-300 transition-all hover:bg-emerald-500/20"
        >
          <Briefcase size={16} />
          Buat Assignment
        </Link>
        <Link
          href="/admin/workforce/executions/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-300 transition-all hover:bg-amber-500/20"
        >
          <Camera size={16} />
          Log Pekerjaan
        </Link>
        <Link
          href="/admin/workforce/qc/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-300 transition-all hover:bg-rose-500/20"
        >
          <ShieldCheck size={16} />
          QC Checklist
        </Link>
      </div>

      {/* Menu Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {menuItems.map((item) => (
          <MenuCard key={item.href} {...item} />
        ))}
      </div>

      {/* Info Banner */}
      <div className="rounded-2xl border border-cyan-500/10 bg-gradient-to-r from-cyan-500/5 to-transparent p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-cyan-500/10 p-3">
            <AlertCircle size={20} className="text-cyan-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Integrasi Data SANTRA</h3>
            <p className="mt-1 text-sm text-slate-400">
              Sistem SANTRA dirancang untuk traceability lengkap: setiap pekerjaan
              terhubung ke orang yang mengerjakannya, setiap QC terhubung ke execution log,
              dan setiap KPI dihitung otomatis dari data QC dan execution.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2 py-1 text-xs text-cyan-400">
                <CheckCircle size={10} /> Worker → Assignment
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400">
                <CheckCircle size={10} /> Assignment → Execution
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-xs text-amber-400">
                <CheckCircle size={10} /> Execution → QC
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-1 text-xs text-rose-400">
                <CheckCircle size={10} /> QC → KPI
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
