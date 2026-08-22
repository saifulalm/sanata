import type { Metadata } from "next";
import Link from "next/link";
import {
  FileText,
  Inbox,
  ArrowRight,
  Layers,
  Plus,
  Activity,
  ChevronRight,
  ShoppingBag,
  Calculator,
  Eye,
} from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import {
  EmptyState,
  ListRow,
  PageHeader,
  Panel,
  Badge,
  btn,
} from "@/components/admin/ui";
import {
  ContentStatusChart,
  TopContentChart,
  RabPipelineChart,
  ActivityChart,
} from "@/components/admin/DashboardCharts";
import {
  ActivityTimeline,
  QuickActions,
  LiveIndicator,
} from "@/components/admin/ActivityTimeline";
import { DashboardNotifications } from "@/components/admin/DashboardNotifications";
import { getDashboardSummary } from "@/lib/adminResources";
import { requireAdminRole } from "@/lib/adminApi";
import { formatDate, formatRupiah } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

// Sample data for new features (in production, this would come from the API).
// Timestamps are FIXED ISO strings — using Date.now() causes hydration mismatch
// between server render and client hydration because each renders at a different time.
const sampleActivities = [
  { id: "1", type: "content_created" as const, description: "Artikel baru dipublikasikan: Fitur AHSP v2", user: { name: "Admin" }, timestamp: "2026-08-16T09:05:00Z" },
  { id: "2", type: "inquiry_received" as const, description: "Pesan baru dari Budi Santoso", user: { name: "Sistem" }, timestamp: "2026-08-16T08:45:00Z" },
  { id: "3", type: "rab_created" as const, description: "RAB baru dibuat: Proyek Gedung A", user: { name: "Admin" }, timestamp: "2026-08-16T08:30:00Z" },
  { id: "4", type: "product_updated" as const, description: "Layanan konsultasi diperbarui", user: { name: "Editor" }, timestamp: "2026-08-16T08:00:00Z" },
  { id: "5", type: "user_login" as const, description: "Login berhasil", user: { name: "Admin" }, timestamp: "2026-08-16T07:30:00Z" },
];

const activityChartData = [
  { date: "Sen", activities: 12 },
  { date: "Sel", activities: 19 },
  { date: "Rab", activities: 15 },
  { date: "Kam", activities: 22 },
  { date: "Jum", activities: 18 },
  { date: "Sab", activities: 8 },
  { date: "Min", activities: 5 },
];

const quickActions = [
  { id: "1", label: "RAB Baru", iconName: "Calculator", href: "/admin/rab/new", color: "text-cyan-300 bg-cyan-300/10 border-cyan-300/20" },
  { id: "2", label: "Tulis Konten", iconName: "FileText", href: "/admin/contents", color: "text-emerald-300 bg-emerald-300/10 border-emerald-300/20" },
  { id: "3", label: "Balas Pesan", iconName: "MessageSquare", href: "/admin/inquiries?status=NEW", color: "text-amber-300 bg-amber-300/10 border-amber-300/20" },
  { id: "4", label: "Tambah Layanan", iconName: "ShoppingBag", href: "/admin/products", color: "text-purple-300 bg-purple-300/10 border-purple-300/20" },
  { id: "5", label: "Kirim Broadcast", iconName: "Send", href: "/admin/broadcasts", color: "text-teal-300 bg-teal-300/10 border-teal-300/20" },
  { id: "6", label: "Pengaturan", iconName: "Settings", href: "/admin/security", color: "text-slate-300 bg-slate-300/10 border-slate-300/20" },
];

export default async function AdminDashboardPage() {
  await requireAdminRole("ADMIN", "EDITOR");
  const data = await getDashboardSummary();
  const { cards } = data;
  const now = new Date();

  return (
    <div className="space-y-6">
      {/* Enhanced Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <PageHeader
              eyebrow="Sanata Ops"
              title="Dashboard"
              description="Ringkasan pekerjaan, estimasi biaya, dan konten Sanata"
            />
            <LiveIndicator lastUpdate={now.toISOString()} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/rab/new" className={btn("primary")}>
            <Plus size={15} />
            RAB Baru
          </Link>
          <Link href="/admin/contents" className={btn("secondary")}>
            <FileText size={15} />
            Tulis Konten
          </Link>
        </div>
      </div>

      {/* Primary Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pesan Baru"
          value={cards.newInquiries}
          hint={`dari ${cards.totalInquiries} total pesan`}
          icon={<Inbox size={20} />}
          href="/admin/inquiries?status=NEW"
          tone={cards.newInquiries > 0 ? "attention" : "default"}
          trend={cards.newInquiries > 0 ? { value: 12, direction: "up", label: "vs kemarin" } : undefined}
        />
        <StatCard
          label="Nilai RAB Disetujui"
          value={`Rp ${formatRupiah(cards.rabApprovedValue)}`}
          hint={`${cards.rabCount} RAB · total Rp ${formatRupiah(cards.rabTotalValue)}`}
          icon={<Calculator size={20} />}
          href="/admin/rab"
          trend={{ value: 8, direction: "up", label: "vs bulan lalu" }}
        />
        <StatCard
          label="Database Estimasi"
          value={`${cards.ahsp} AHSP`}
          hint={`${cards.priceItems} harga satuan dasar`}
          icon={<Layers size={20} />}
          href="/admin/ahsp"
        />
        <StatCard
          label="Layanan Aktif"
          value={`${cards.activeProducts}/${cards.products}`}
          icon={<ShoppingBag size={20} />}
          href="/admin/products"
          tone={cards.activeProducts < cards.products ? "attention" : "default"}
        />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Konten"
          value={cards.content}
          hint={`${cards.publishedContent} terpublikasi`}
          icon={<FileText size={20} />}
          href="/admin/contents"
          trend={{ value: 5, direction: "up" }}
        />
        <StatCard
          label="Total Views"
          value={formatRupiah(cards.totalViews)}
          icon={<Eye size={20} />}
          trend={{ value: 23, direction: "up", label: "vs kemarin" }}
        />
        <StatCard
          label="Pengguna"
          value={cards.users}
          icon={<Activity size={20} />}
          href="/admin/users"
        />
      </div>

      {/* Quick Actions & Activity Overview */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <QuickActions actions={quickActions} />
        </div>
        <Panel title="Aktivitas 7 Hari Terakhir">
          <ActivityChart data={activityChartData} />
        </Panel>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Priority Actions Panel */}
        <Panel
          title="Perlu Ditindaklanjuti"
          actions={
            <Link href="/admin/inquiries?status=NEW" className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-200">
              Semua <ArrowRight size={12} />
            </Link>
          }
          bodyClassName="space-y-0.5"
        >
          {data.recentInquiries.length > 0 ? (
            data.recentInquiries.map((inq) => (
              <ListRow
                key={inq.id}
                href="/admin/inquiries?status=NEW"
                primary={inq.name}
                secondary={inq.service ?? undefined}
                trailing={
                  <div className="flex items-center gap-2">
                    <Badge tone="warning">Baru</Badge>
                    <span className="text-xs text-slate-500">{formatDate(inq.createdAt)}</span>
                  </div>
                }
              />
            ))
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">Tidak ada pesan yang menunggu tindakan.</p>
          )}
        </Panel>

        {/* RAB Pipeline */}
        <Panel
          title="Pipeline RAB"
          actions={
            <Link href="/admin/rab" className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-200">
              Semua <ArrowRight size={12} />
            </Link>
          }
        >
          {data.rabByStatus.length > 0 ? (
            <div className="mb-4">
              <RabPipelineChart data={data.rabByStatus} />
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-slate-500">Belum ada RAB dibuat.</p>
          )}

          {data.recentRabs.length > 0 && (
            <div className="mt-4 border-t border-white/[0.07] pt-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Terbaru</p>
              <div className="space-y-1">
                {data.recentRabs.slice(0, 3).map((rab) => (
                  <ListRow
                    key={rab.id}
                    href={`/admin/rab/${rab.id}`}
                    primary={rab.title}
                    secondary={rab.number}
                    trailing={
                      <Badge
                        tone={
                          rab.status === "APPROVED"
                            ? "success"
                            : rab.status === "REJECTED"
                            ? "danger"
                            : rab.status === "PENDING"
                            ? "warning"
                            : "neutral"
                        }
                      >
                        {rab.status}
                      </Badge>
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </Panel>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Status Konten" className="lg:col-span-1">
          <ContentStatusChart data={data.contentByStatus} />
        </Panel>

        <Panel title="Konten Terpopuler" className="lg:col-span-2">
          <TopContentChart data={data.topContent} />
        </Panel>
      </div>

      {/* Recent Content & Services */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Konten Terbaru" bodyClassName="space-y-0.5">
          {data.recentContents.length > 0 ? (
            data.recentContents.map((c) => (
              <ListRow
                key={c.id}
                primary={c.title}
                trailing={
                  <div className="flex items-center gap-2">
                    <Badge tone={c.status === "PUBLISHED" ? "success" : "neutral"}>
                      {c.status === "PUBLISHED" ? "Publis" : "Draf"}
                    </Badge>
                    <ChevronRight size={14} className="text-slate-600" />
                  </div>
                }
              />
            ))
          ) : (
            <EmptyState
              icon={<FileText size={20} />}
              title="Belum ada konten"
              description="Mulai menulis artikel atau halaman baru"
            />
          )}
        </Panel>

        <Panel title="Layanan Terbaru" bodyClassName="space-y-0.5">
          {data.recentProducts.length > 0 ? (
            data.recentProducts.map((p) => (
              <ListRow
                key={p.id}
                primary={p.name}
                trailing={
                  <span className="font-medium text-cyan-200">
                    Rp {formatRupiah(p.price)}
                  </span>
                }
              />
            ))
          ) : (
            <EmptyState
              icon={<ShoppingBag size={20} />}
              title="Belum ada layanan"
              description="Tambahkan layanan baru untuk ditampilkan di situs"
            />
          )}
        </Panel>
      </div>

      {/* Activity & Notifications Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Aktivitas Terkini">
          <ActivityTimeline activities={sampleActivities} maxItems={5} />
        </Panel>

        <DashboardNotifications />
      </div>
    </div>
  );
}
