"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  getMe,
  getProjects,
  getNotifications,
  markRead,
  formatCurrency,
  formatDate,
  formatTime,
  getStatusBadge,
  getProgressBg,
  type Client,
  type ProjectAccess,
  type Notification,
} from "@/lib/clientPortal"
import {
  Building2,
  FolderKanban,
  CheckCircle2,
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  MapPin,
  Bell,
  FileText,
  Image,
  Shield,
  Settings,
  ChevronRight,
  Download,
  Phone,
  Eye,
  Sparkles,
  Activity,
  Target,
  DollarSign,
  Construction,
  AlertCircle,
  Check,
  X,
  Loader2,
  RefreshCw,
  MessageSquare,
  Upload,
  FileCheck,
  Play,
  AlertTriangle,
  File,
  PieChart,
  Zap,
  BarChart3,
  User,
} from "lucide-react"
import clsx from "clsx"

// ============================================================================
// Types
// ============================================================================

interface Activity {
  id: string
  type: "progress" | "document" | "qc" | "photo" | "billing" | "message" | "milestone"
  title: string
  description: string
  timestamp: string
  projectId?: string
  projectName?: string
  icon: any
  color: string
  bgColor: string
}

// ============================================================================
// Utility Functions
// ============================================================================

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Selamat Pagi"
  if (hour < 15) return "Selamat Siang"
  if (hour < 18) return "Selamat Sore"
  return "Selamat Malam"
}

function getDaysRemaining(endDate?: string): number | null {
  if (!endDate) return null
  const end = new Date(endDate)
  const now = new Date()
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return "Baru saja"
  if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} hari lalu`
  return formatDate(dateStr, "short")
}

function getActivityConfig(type: Activity["type"]) {
  switch (type) {
    case "progress":
      return { icon: TrendingUp, color: "text-emerald-600", bgColor: "bg-emerald-100" }
    case "document":
      return { icon: FileText, color: "text-blue-600", bgColor: "bg-blue-100" }
    case "qc":
      return { icon: Shield, color: "text-purple-600", bgColor: "bg-purple-100" }
    case "photo":
      return { icon: Image, color: "text-pink-600", bgColor: "bg-pink-100" }
    case "billing":
      return { icon: DollarSign, color: "text-amber-600", bgColor: "bg-amber-100" }
    case "message":
      return { icon: MessageSquare, color: "text-cyan-600", bgColor: "bg-cyan-100" }
    case "milestone":
      return { icon: Target, color: "text-indigo-600", bgColor: "bg-indigo-100" }
    default:
      return { icon: Activity, color: "text-slate-600", bgColor: "bg-slate-100" }
  }
}

// ============================================================================
// Components
// ============================================================================

// Loading Skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="h-32 bg-white rounded-2xl shadow-sm" />
      
      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-white rounded-2xl shadow-sm" />
        ))}
      </div>
      
      {/* Progress Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="h-48 bg-white rounded-2xl shadow-sm" />
        ))}
      </div>
      
      {/* Bottom Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-64 bg-white rounded-2xl shadow-sm" />
        <div className="h-64 bg-white rounded-2xl shadow-sm" />
      </div>
    </div>
  )
}

// Error State
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
        <AlertCircle className="w-10 h-10 text-red-500" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">Terjadi Kesalahan</h3>
      <p className="text-slate-500 text-center mb-6 max-w-md">
        Gagal memuat data dashboard. Silakan coba lagi nanti.
      </p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Coba Lagi
      </button>
    </div>
  )
}

// Empty State
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-6">
        <FolderKanban className="w-12 h-12 text-slate-400" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">Belum Ada Proyek</h3>
      <p className="text-slate-500 text-center mb-6 max-w-md">
        Anda belum memiliki akses ke proyek manapun. Hubungi tim kami untuk informasi lebih lanjut.
      </p>
      <Link
        href="/client/contact"
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
      >
        <Phone className="w-4 h-4" />
        Hubungi Kami
      </Link>
    </div>
  )
}

// Welcome Header
function WelcomeHeader({ user, currentTime }: { user: Client | null; currentTime: Date }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-6 md:p-8 text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
      </div>
      
      {/* Content */}
      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-blue-200 text-sm mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">
            {getGreeting()}, {user?.name?.split(" ")[0] || "Guest"}! 👋
          </h1>
          <p className="text-blue-100 text-sm md:text-base">
            {currentTime.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            {" • "}
            {currentTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        
        {/* Quick Stats */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold">{currentTime.getHours()}</div>
            <div className="text-xs text-blue-200 uppercase tracking-wider">Jam</div>
          </div>
          <div className="w-px h-10 bg-blue-400/30" />
          <div className="text-center">
            <div className="text-3xl font-bold">{currentTime.getMinutes().toString().padStart(2, "0")}</div>
            <div className="text-xs text-blue-200 uppercase tracking-wider">Menit</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Stat Card
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  trendUp,
  bg,
  color,
  delay,
}: {
  icon: any
  label: string
  value: string | number
  sub?: string
  trend?: string
  trendUp?: boolean
  bg: string
  color: string
  delay: number
}) {
  return (
    <div
      className="relative group bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
          
          {trend && (
            <div className={clsx(
              "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
              trendUp ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
            )}>
              {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend}
            </div>
          )}
        </div>
        
        <div>
          <p className="text-sm text-slate-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
      </div>
    </div>
  )
}

// Project Progress Card
function ProjectProgressCard({ project, delay }: { project: ProjectAccess; delay: number }) {
  const daysLeft = getDaysRemaining(project.project.scheduleEnd)
  const progressColor = getProgressBg(project.project.progress)
  const badge = getStatusBadge(project.project.status)
  
  return (
    <div
      className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 group"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {project.project.number}
            </span>
            <span className={clsx("text-xs font-medium px-2 py-0.5 rounded-full", badge.bg, badge.text)}>
              {badge.label}
            </span>
          </div>
          <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
            {project.project.title}
          </h3>
          {project.project.location && (
            <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
              <MapPin className="w-3 h-3" />
              {project.project.location}
            </div>
          )}
        </div>
        <Link
          href={`/client/project/${project.project.id}`}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-500">Progress</span>
          <span className="font-semibold text-slate-900">{project.project.progress}%</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={clsx("h-full rounded-full transition-all duration-500", progressColor)}
            style={{ width: `${project.project.progress}%` }}
          />
        </div>
      </div>
      
      {/* Meta Info */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          {daysLeft !== null && (
            <div className={clsx(
              "flex items-center gap-1",
              daysLeft <= 7 ? "text-amber-600" : "text-slate-500"
            )}>
              <Clock className="w-4 h-4" />
              <span>{daysLeft === 0 ? "Hari ini" : `${daysLeft} hari lagi`}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-slate-500">
            <CheckCircle2 className="w-4 h-4" />
            <span>{project.project.completedItems}/{project.project.totalItems}</span>
          </div>
        </div>
        <span className="font-medium text-slate-900">
          {formatCurrency(project.project.total, true)}
        </span>
      </div>
    </div>
  )
}

// Activity Timeline Item
function ActivityItem({ activity, isLast }: { activity: Activity; isLast: boolean }) {
  const Icon = activity.icon
  
  return (
    <div className="relative flex gap-4">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-5 top-10 bottom-0 w-px bg-slate-200" />
      )}
      
      {/* Icon */}
      <div className={clsx("relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0", activity.bgColor)}>
        <Icon className={clsx("w-5 h-5", activity.color)} />
      </div>
      
      {/* Content */}
      <div className="flex-1 pb-6 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="font-medium text-slate-900 text-sm">{activity.title}</h4>
            <p className="text-xs text-slate-500 mt-0.5">{activity.description}</p>
            {activity.projectName && (
              <Link
                href={`/client/project/${activity.projectId}`}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-1"
              >
                <span>{activity.projectName}</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>
          <span className="text-xs text-slate-400 shrink-0">{timeAgo(activity.timestamp)}</span>
        </div>
      </div>
    </div>
  )
}

// Quick Action Button
function QuickActionButton({
  icon: Icon,
  label,
  description,
  href,
  variant = "primary",
}: {
  icon: any
  label: string
  description: string
  href: string
  variant?: "primary" | "secondary"
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group",
        variant === "primary"
          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/25"
          : "bg-white border border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50/50"
      )}
    >
      <div className={clsx(
        "w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
        variant === "primary" ? "bg-white/20" : "bg-slate-100 group-hover:bg-blue-100"
      )}>
        <Icon className={clsx("w-6 h-6", variant === "primary" ? "text-white" : "text-slate-600 group-hover:text-blue-600")} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={clsx("font-semibold", variant === "primary" ? "text-white" : "text-slate-900")}>{label}</p>
        <p className={clsx("text-sm", variant === "primary" ? "text-blue-100" : "text-slate-500")}>{description}</p>
      </div>
      <ChevronRight className={clsx(
        "w-5 h-5 transition-transform group-hover:translate-x-1",
        variant === "primary" ? "text-white/70" : "text-slate-400"
      )} />
    </Link>
  )
}

// Notification Item
function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: Notification
  onMarkRead: (id: string) => void
}) {
  const iconMap: Record<string, any> = {
    progress: Activity,
    document: FileText,
    qc: Shield,
    billing: DollarSign,
    message: MessageSquare,
    milestone: Target,
    default: Bell,
  }
  const Icon = iconMap[notification.type] || Bell
  
  return (
    <div
      className={clsx(
        "flex items-start gap-3 p-3 rounded-xl transition-colors group",
        notification.isRead ? "bg-white" : "bg-blue-50/70 hover:bg-blue-50"
      )}
    >
      <div className={clsx(
        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
        notification.isRead ? "bg-slate-100" : "bg-blue-100"
      )}>
        <Icon className={clsx("w-5 h-5", notification.isRead ? "text-slate-400" : "text-blue-600")} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={clsx(
              "text-sm font-medium",
              notification.isRead ? "text-slate-600" : "text-slate-900"
            )}>
              {notification.title}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notification.message}</p>
          </div>
          {!notification.isRead && (
            <button
              onClick={() => onMarkRead(notification.id)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium shrink-0"
            >
              Tandai
            </button>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-1">{timeAgo(notification.createdAt)}</p>
      </div>
    </div>
  )
}

// ============================================================================
// Main Dashboard Component
// ============================================================================

export default function ClientDashboard() {
  const [user, setUser] = useState<Client | null>(null)
  const [projects, setProjects] = useState<ProjectAccess[]>([])
  const [notifications, setNotifications] = useState<{ notifications: Notification[]; unreadCount: number }>({
    notifications: [],
    unreadCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [userRes, projectsRes, notifRes] = await Promise.all([
        getMe(),
        getProjects(),
        getNotifications(),
      ])
      setUser(userRes)
      setProjects(projectsRes)
      setNotifications(notifRes)
    } catch {
      setError("Gagal memuat data. Silakan coba lagi.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Handle mark notification as read
  const handleMarkRead = async (id: string) => {
    try {
      await markRead(id)
      setNotifications(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }))
    } catch {
      // Silent fail
    }
  }

  // Calculate stats
  const totalProjects = projects.length
  const activeProjects = projects.filter(p => p.project.status === "IN_PROGRESS").length
  const completedProjects = projects.filter(p => p.project.progress >= 100 || p.project.status === "COMPLETED").length
  const totalBudget = projects.reduce((sum, p) => sum + p.project.total, 0)
  const activeProjectsData = projects.filter(p => p.project.status !== "COMPLETED" && p.project.status !== "ARCHIVED")

  // Generate mock activities from projects and notifications
  const activities: Activity[] = [
    ...notifications.notifications.slice(0, 5).map((n, i) => {
      const config = getActivityConfig(n.type as Activity["type"])
      return {
        id: n.id,
        type: n.type as Activity["type"],
        title: n.title,
        description: n.message,
        timestamp: n.createdAt,
        icon: config.icon,
        color: config.color,
        bgColor: config.bgColor,
      }
    }),
    ...projects.slice(0, 3).map((p, i) => ({
      id: `project-${p.project.id}`,
      type: "progress" as const,
      title: "Update Progress",
      description: `${p.project.title} sekarang ${p.project.progress}% selesai`,
      timestamp: p.project.scheduleStart || new Date().toISOString(),
      projectId: p.project.id,
      projectName: p.project.title,
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8)

  if (loading) return <DashboardSkeleton />
  if (error) return <ErrorState onRetry={loadData} />
  if (projects.length === 0) return <EmptyState />

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <WelcomeHeader user={user} currentTime={currentTime} />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FolderKanban}
          label="Total Proyek"
          value={totalProjects}
          sub="Proyek yang Anda miliki"
          trend={activeProjects > 0 ? `${activeProjects} aktif` : undefined}
          trendUp={true}
          bg="bg-blue-100"
          color="text-blue-600"
          delay={100}
        />
        <StatCard
          icon={Construction}
          label="Sedang Berjalan"
          value={activeProjects}
          sub="Proyek dalam progress"
          bg="bg-amber-100"
          color="text-amber-600"
          delay={200}
        />
        <StatCard
          icon={CheckCircle2}
          label="Selesai"
          value={completedProjects}
          sub="Proyek telah selesai"
          bg="bg-emerald-100"
          color="text-emerald-600"
          delay={300}
        />
        <StatCard
          icon={Wallet}
          label="Total Budget"
          value={formatCurrency(totalBudget, true)}
          sub="Nilai kontrak keseluruhan"
          bg="bg-purple-100"
          color="text-purple-600"
          delay={400}
        />
      </div>

      {/* Project Progress Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Progress Proyek</h2>
            <p className="text-sm text-slate-500">Pantau perkembangan proyek Anda</p>
          </div>
          <Link
            href="/client/projects"
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Lihat Semua
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeProjectsData.slice(0, 4).map((project, index) => (
            <ProjectProgressCard key={project.accessId} project={project} delay={500 + index * 100} />
          ))}
        </div>
      </div>

      {/* Activity Timeline & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Aktivitas Terakhir</h2>
              <p className="text-sm text-slate-500">Aktivitas terbaru di akun Anda</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <Activity className="w-5 h-5 text-slate-600" />
            </div>
          </div>
          
          {activities.length > 0 ? (
            <div className="space-y-1">
              {activities.slice(0, 6).map((activity, index) => (
                <ActivityItem key={activity.id} activity={activity} isLast={index === activities.slice(0, 6).length - 1} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500">Belum ada aktivitas</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Aksi Cepat</h2>
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Zap className="w-5 h-5 text-slate-600" />
              </div>
            </div>
            <div className="space-y-3">
              <QuickActionButton
                icon={FolderKanban}
                label="Lihat Semua Proyek"
                description="Akses semua proyek Anda"
                href="/client/projects"
              />
              <QuickActionButton
                icon={FileCheck}
                label="Unduh Laporan"
                description="Export laporan progress"
                href="/client/reports"
                variant="secondary"
              />
              <QuickActionButton
                icon={Phone}
                label="Hubungi Support"
                description="Butuh bantuan?"
                href="/client/support"
                variant="secondary"
              />
            </div>
          </div>

          {/* Notifications Preview */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">Notifikasi</h2>
                {notifications.unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
                    {notifications.unreadCount}
                  </span>
                )}
              </div>
              <Link
                href="/client/notifications"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Lihat Semua
              </Link>
            </div>
            
            <div className="space-y-2">
              {notifications.notifications.slice(0, 3).map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={handleMarkRead}
                />
              ))}
              {notifications.notifications.length === 0 && (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500">Tidak ada notifikasi</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 text-center">
          <BarChart3 className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-900">
            {projects.reduce((sum, p) => sum + p.project.totalItems, 0)}
          </p>
          <p className="text-xs text-slate-500">Total Item</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 text-center">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-900">
            {projects.reduce((sum, p) => sum + p.project.completedItems, 0)}
          </p>
          <p className="text-xs text-slate-500">Item Selesai</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 text-center">
          <FileText className="w-6 h-6 text-amber-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-900">
            {projects.reduce((sum, p) => sum + p.project.billingCount, 0)}
          </p>
          <p className="text-xs text-slate-500">Tagihan</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 text-center">
          <Target className="w-6 h-6 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-900">
            {Math.round(projects.reduce((sum, p) => sum + p.project.progress, 0) / (projects.length || 1))}%
          </p>
          <p className="text-xs text-slate-500">Rata-rata Progress</p>
        </div>
      </div>
    </div>
  )
}