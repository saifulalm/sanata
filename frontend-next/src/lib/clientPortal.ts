/**
 * Client Portal API Client
 * Clean API client with error handling
 */

const API_BASE = "/api";

// Types
export interface Client {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  companyName?: string | null;
  avatarUrl?: string | null;
  preferredLanguage?: string | null;
  notifyProgress: boolean;
  notifyDocuments: boolean;
  notifyMessages: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
}

export interface ProjectAccess {
  accessId: string;
  accessLevel: string;
  grantedAt: string;
  expiresAt?: string | null;
  project: {
    id: string;
    number: string;
    title: string;
    clientName?: string;
    location?: string;
    status: string;
    scheduleStart?: string;
    scheduleEnd?: string;
    total: number;
    progress: number;
    totalItems: number;
    completedItems: number;
    billingCount: number;
    thumbnail?: string;
    tags?: string[];
  };
}

export interface Project {
  access: {
    canViewProgress: boolean;
    canViewDailyReports: boolean;
    canViewPhotos: boolean;
    canViewQC: boolean;
    canViewDocuments: boolean;
    canViewFinancials: boolean;
  };
  project: {
    id: string;
    number: string;
    title: string;
    clientName?: string;
    location?: string;
    status: string;
    scheduleStart?: string;
    scheduleEnd?: string;
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    total: number;
    taxPct: number;
  };
  sections: Section[];
  baseline?: { capturedAt: string; name: string } | null;
  billings?: Billing[];
}

export interface Section { id: string; name: string; items: Item[]; }
export interface Item { id: string; description: string; unit: string; volume: number; unitPrice: number; amount: number; startOffsetDays: number; durationDays: number; }
export interface Billing { id: string; number: string; status: string; periodEnd: string; currentValue: number; cumulativeValue: number; taxAmount: number; netAmount: number; }

export interface Progress {
  project: { id: string; number: string; title: string; scheduleStart?: string; status: string; totalAmount: number; };
  plannedCurve: { date: string; planned: number }[];
  actualCurve: { date: string; actual: number }[];
  currentProgress: number;
}

export interface DailyReport {
  id: string; date: string; weatherMorning?: string; weatherAfternoon?: string; weatherLog?: any; workforce?: any;
  equipment?: string; materials?: string; activities?: string; workActivities?: any[]; obstacles?: string; notes?: string; photos: Photo[];
}

export interface Photo { id: string; url: string; caption?: string; location?: string; takenAt?: string; }

export interface QCRecord {
  id: string; qcCode: string; checkDate: string; wbsStage?: string; itemDesc?: string; criteria?: string; measurement?: string;
  result: "PASS" | "FAIL" | "REWORK"; defectDesc?: string; isRework: boolean; holdPoint: boolean; isReleased: boolean;
  weather?: string; temperature?: number; latitude?: number; longitude?: number; notes?: string; photos: Photo[];
  photosCount: number; createdAt: string; worker?: { id: string; name: string };
}

export interface Notification { id: string; type: string; title: string; message: string; link?: string; isRead: boolean; readAt?: string; createdAt: string; rabId?: string; }

export interface ApiError { ok: false; status: number; message: string; errors?: Record<string, string[]>; }

// Token helpers
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("client_access");
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

export function setAccessToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("client_access", token);
  }
}

export function clearAccessToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("client_access");
  }
}

// Core fetch
async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", Accept: "application/json", ...options.headers },
    credentials: "include",
  } as RequestInit);
  const data = await res.json();
  if (!res.ok) throw { ok: false, status: res.status, message: data.message || "Request failed", errors: data.errors };
  return data;
}

async function authFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    credentials: "include",
  } as RequestInit);
  const data = await res.json();
  if (!res.ok) throw { ok: false, status: res.status, message: data.message || "Request failed" };
  return data;
}

// Auth
export async function login(email: string, password: string): Promise<{ success: true; client: Client } | ApiError> {
  try {
    const res = await fetchJson<{ success: boolean; data: { accessToken: string; client: Client } }>(`${API_BASE}/client/login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (res.success && res.data) {
      setAccessToken(res.data.accessToken);
      return { success: true, client: res.data.client };
    }
    return { ok: false, status: 500, message: "Invalid response" };
  } catch (e: any) { return e; }
}

export async function register(data: { email: string; password: string; name: string; phone?: string; companyName?: string; }): Promise<{ success: true; client: Client } | ApiError> {
  try {
    const res = await fetchJson<{ success: boolean; data: { accessToken: string; client: Client } }>(`${API_BASE}/client/register`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (res.success && res.data) {
      setAccessToken(res.data.accessToken);
      return { success: true, client: res.data.client };
    }
    return { ok: false, status: 500, message: "Invalid response" };
  } catch (e: any) { return e; }
}

export async function logout(): Promise<void> {
  try { await fetch(`${API_BASE}/client/logout`, { method: "POST" }); } catch {}
  clearAccessToken();
}

// Profile
export async function getMe(): Promise<Client | null> {
  try { const res = await authFetch<{ success: boolean; data: Client }>("/client/me"); return res.success ? res.data : null; } catch { return null; }
}

export async function updateProfile(data: Partial<Client>): Promise<Client | null> {
  try { const res = await authFetch<{ success: boolean; data: Client }>("/client/me", { method: "PATCH", body: JSON.stringify(data) }); return res.success ? res.data : null; } catch { return null; }
}

// Projects
export async function getProjects(): Promise<ProjectAccess[]> {
  try { const res = await authFetch<{ success: boolean; data: ProjectAccess[] }>("/client/projects"); return res.success ? res.data : []; } catch { return []; }
}

export async function getProject(id: string): Promise<Project | null> {
  try { const res = await authFetch<{ success: boolean; data: Project }>(`/client/projects/${id}`); return res.success ? res.data : null; } catch { return null; }
}

export async function getProgress(id: string): Promise<Progress | null> {
  try { const res = await authFetch<{ success: boolean; data: Progress }>(`/client/projects/${id}/progress`); return res.success ? res.data : null; } catch { return null; }
}

// Reports
export async function getDailyReports(id: string, options?: { limit?: number; offset?: number }): Promise<{ reports: DailyReport[]; total: number }> {
  try {
    const params = new URLSearchParams();
    if (options?.limit) params.set("limit", String(options.limit));
    if (options?.offset) params.set("offset", String(options.offset));
    const res = await authFetch<{ success: boolean; data: { reports: DailyReport[]; total: number } }>(`/client/projects/${id}/daily-reports?${params}`);
    return res.success ? res.data : { reports: [], total: 0 };
  } catch { return { reports: [], total: 0 }; }
}

// QC
export async function getQCRecords(id: string, options?: { limit?: number }): Promise<{ records: QCRecord[]; total: number; summary: { total: number; passed: number; failed: number; rework: number } | null }> {
  try {
    const params = new URLSearchParams();
    if (options?.limit) params.set("limit", String(options.limit));
    const res = await authFetch<{ success: boolean; data: { records: QCRecord[]; total: number; summary: any } }>(`/client/projects/${id}/qc?${params}`);
    if (res.success) return { records: res.data.records, total: res.data.total, summary: res.data.summary };
  } catch {}
  return { records: [], total: 0, summary: null };
}

// Documents
export async function getDocuments(id: string): Promise<any> {
  try { const res = await authFetch<{ success: boolean; data: any }>(`/client/projects/${id}/documents`); return res.success ? res.data : null; } catch { return null; }
}

// Notifications
export async function getNotifications(unreadOnly = false): Promise<{ notifications: Notification[]; unreadCount: number }> {
  try { const res = await authFetch<{ success: boolean; data: { notifications: Notification[]; unreadCount: number } }>(`/client/notifications${unreadOnly ? "?unreadOnly=true" : ""}`); return res.success ? res.data : { notifications: [], unreadCount: 0 }; } catch { return { notifications: [], unreadCount: 0 }; }
}

export async function markRead(id: string): Promise<void> { try { await authFetch(`/client/notifications/${id}/read`, { method: "PATCH" }); } catch {} }
export async function markAllRead(): Promise<void> { try { await authFetch("/client/notifications/read-all", { method: "POST" }); } catch {} }

// Helpers
export function formatCurrency(amount: number, compact = false): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", notation: compact ? "compact" : "standard", maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(date: string | Date, style: "long" | "short" = "long"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: style, year: "numeric" });
}

export function formatTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export function getProgressColor(percent: number): string {
  if (percent >= 90) return "text-emerald-600";
  if (percent >= 70) return "text-blue-600";
  if (percent >= 50) return "text-yellow-600";
  return "text-gray-500";
}

export function getProgressBg(percent: number): string {
  if (percent >= 90) return "bg-emerald-500";
  if (percent >= 70) return "bg-blue-500";
  if (percent >= 50) return "bg-yellow-500";
  return "bg-gray-400";
}

export function getStatusBadge(status: string): { bg: string; text: string; label: string } {
  switch (status) {
    case "APPROVED": case "PAID": return { bg: "bg-emerald-100", text: "text-emerald-700", label: "✓ " + status };
    case "IN_PROGRESS": return { bg: "bg-blue-100", text: "text-blue-700", label: "● " + status };
    case "PENDING": case "DRAFT": return { bg: "bg-amber-100", text: "text-amber-700", label: "○ " + status };
    case "REJECTED": case "FAIL": return { bg: "bg-red-100", text: "text-red-700", label: "✗ " + status };
    default: return { bg: "bg-gray-100", text: "text-gray-700", label: status };
  }
}

export function getResultBadge(result: string): { bg: string; text: string } {
  switch (result) {
    case "PASS": return { bg: "bg-emerald-100", text: "text-emerald-700" };
    case "FAIL": return { bg: "bg-red-100", text: "text-red-700" };
    case "REWORK": return { bg: "bg-amber-100", text: "text-amber-700" };
    default: return { bg: "bg-gray-100", text: "text-gray-600" };
  }
}

// ============================================================================
// Additional Types for Enhanced Features
// ============================================================================

export interface Document {
  id: string;
  name: string;
  type: "drawing" | "contract" | "report" | "photo" | "invoice" | "other";
  category: string;
  size: string;
  uploadDate: string;
  url: string;
  thumbnailUrl?: string;
  description?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  phone?: string;
  email?: string;
  department?: string;
  isProjectManager?: boolean;
}

export interface Milestone {
  id: string;
  name: string;
  date: string;
  progress: number;
  status: "complete" | "in_progress" | "upcoming" | "pending";
  description?: string;
  deliverable?: string;
}

export interface SCurveDataPoint {
  date: string;
  planned: number;
  actual: number;
  cumulativePlanned: number;
  cumulativeActual: number;
}

export interface Photo {
  id: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  location?: string;
  takenAt?: string;
}

export interface NotificationPreference {
  type: string;
  label: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
}

export interface RecentDocument {
  id: string;
  name: string;
  type: string;
  projectName: string;
  projectId: string;
  uploadDate: string;
  url: string;
}

export interface SecuritySettings {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ============================================================================
// Enhanced API Functions
// ============================================================================

// Get recent documents across all projects
export async function getRecentDocuments(limit = 5): Promise<RecentDocument[]> {
  try {
    const res = await authFetch<{ success: boolean; data: RecentDocument[] }>(`/client/documents/recent?limit=${limit}`);
    return res.success ? res.data : getMockRecentDocuments();
  } catch {
    return getMockRecentDocuments();
  }
}

// Get project search results
export async function searchProjects(query: string): Promise<ProjectAccess[]> {
  try {
    const res = await authFetch<{ success: boolean; data: ProjectAccess[] }>(`/client/projects/search?q=${encodeURIComponent(query)}`);
    return res.success ? res.data : [];
  } catch {
    return [];
  }
}

// Download document with proper headers
export async function downloadDocument(documentId: string, filename: string): Promise<boolean> {
  try {
    const token = getAccessToken();
    const response = await fetch(`/api/client/documents/${documentId}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) return false;

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    return true;
  } catch {
    return false;
  }
}

// Get team members for a project
export async function getProjectTeam(projectId: string): Promise<{ projectManager: TeamMember | null; members: TeamMember[] }> {
  try {
    const res = await authFetch<{ success: boolean; data: { projectManager: TeamMember | null; members: TeamMember[] } }>(`/client/projects/${projectId}/team`);
    return res.success ? res.data : getMockTeamData();
  } catch {
    return getMockTeamData();
  }
}

// Get milestones for a project
export async function getProjectMilestones(projectId: string): Promise<Milestone[]> {
  try {
    const res = await authFetch<{ success: boolean; data: Milestone[] }>(`/client/projects/${projectId}/milestones`);
    return res.success ? res.data : getMockMilestones();
  } catch {
    return getMockMilestones();
  }
}

// Get S-curve data for a project
export async function getSCurveData(projectId: string): Promise<SCurveDataPoint[]> {
  try {
    const res = await authFetch<{ success: boolean; data: SCurveDataPoint[] }>(`/client/projects/${projectId}/s-curve`);
    return res.success ? res.data : getMockSCurveData();
  } catch {
    return getMockSCurveData();
  }
}

// Get photos for a project
export async function getProjectPhotos(projectId: string, limit = 20): Promise<Photo[]> {
  try {
    const res = await authFetch<{ success: boolean; data: Photo[] }>(`/client/projects/${projectId}/photos?limit=${limit}`);
    return res.success ? res.data : getMockPhotos();
  } catch {
    return getMockPhotos();
  }
}

// Update notification preferences
export async function updateNotificationPreferences(preferences: NotificationPreference[]): Promise<boolean> {
  try {
    const res = await authFetch<{ success: boolean }>("/client/notifications/preferences", {
      method: "PUT",
      body: JSON.stringify({ preferences }),
    });
    return res.success;
  } catch {
    return false;
  }
}

// Get notification preferences
export async function getNotificationPreferences(): Promise<NotificationPreference[]> {
  try {
    const res = await authFetch<{ success: boolean; data: NotificationPreference[] }>("/client/notifications/preferences");
    return res.success ? res.data : getDefaultNotificationPreferences();
  } catch {
    return getDefaultNotificationPreferences();
  }
}

// Change password
export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await authFetch<{ success: boolean; message: string }>("/client/password/change", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return res;
  } catch {
    return { success: false, message: "Gagal mengubah password" };
  }
}

// ============================================================================
// Mock Data Functions for Demo/Testing
// ============================================================================

function getMockRecentDocuments(): RecentDocument[] {
  return [
    { id: "d1", name: "Gambar Arsitektur Revisi 3", type: "drawing", projectName: "Rukan会所", projectId: "p1", uploadDate: new Date(Date.now() - 86400000).toISOString(), url: "#" },
    { id: "d2", name: "Laporan Progress Bulanan", type: "report", projectName: "Villa Mewah", projectId: "p2", uploadDate: new Date(Date.now() - 172800000).toISOString(), url: "#" },
    { id: "d3", name: "Kontrak Amandemen #2", type: "contract", projectName: "Apartemen Hills", projectId: "p3", uploadDate: new Date(Date.now() - 259200000).toISOString(), url: "#" },
    { id: "d4", name: "RAB Final 2024", type: "invoice", projectName: "Rukan会所", projectId: "p1", uploadDate: new Date(Date.now() - 345600000).toISOString(), url: "#" },
    { id: "d5", name: "Foto Site Progress", type: "photo", projectName: "Villa Mewah", projectId: "p2", uploadDate: new Date(Date.now() - 432000000).toISOString(), url: "#" },
  ];
}

function getMockTeamData(): { projectManager: TeamMember | null; members: TeamMember[] } {
  return {
    projectManager: {
      id: "pm1",
      name: "Ahmad Wijaya",
      role: "Project Manager",
      phone: "+62 812 3456 7890",
      email: "ahmad.wijaya@santra.co.id",
      department: "Construction",
      isProjectManager: true,
    },
    members: [
      { id: "t1", name: "Budi Santoso", role: "Site Engineer", phone: "+62 812 3456 7891", email: "budi@santra.co.id", department: "Engineering" },
      { id: "t2", name: "Dewi Lestari", role: "QA Supervisor", phone: "+62 812 3456 7892", email: "dewi@santra.co.id", department: "Quality" },
      { id: "t3", name: "Eko Prasetyo", role: "Foreman", phone: "+62 812 3456 7893", department: "Construction" },
      { id: "t4", name: "Fitri Handayani", role: "Quantity Surveyor", email: "fitri@santra.co.id", department: "Finance" },
      { id: "t5", name: "Gunawan Hidayat", role: "Safety Officer", phone: "+62 812 3456 7895", department: "HSE" },
    ],
  };
}

function getMockMilestones(): Milestone[] {
  const today = new Date();
  return [
    { id: "m1", name: "Persiapan Lokasi", date: new Date(today.getTime() - 60 * 86400000).toISOString(), progress: 100, status: "complete", description: "Pembersihan dan perataan lokasi", deliverable: "Site cleared" },
    { id: "m2", name: "Pondasi", date: new Date(today.getTime() - 30 * 86400000).toISOString(), progress: 100, status: "complete", description: "Pekerjaan pondasi lengkap", deliverable: "Foundation certificate" },
    { id: "m3", name: "Struktur Bawah", date: new Date(today.getTime() - 10 * 86400000).toISOString(), progress: 85, status: "in_progress", description: "Kolom dan balok lantai 1-2", deliverable: "Structural drawings" },
    { id: "m4", name: "Struktur Atas", date: new Date(today.getTime() + 20 * 86400000).toISOString(), progress: 45, status: "in_progress", description: "Lantai 3-5", deliverable: "MEP rough-in" },
    { id: "m5", name: "Atap & Langit-langit", date: new Date(today.getTime() + 45 * 86400000).toISOString(), progress: 0, status: "upcoming", description: "Penempatan atap dan ceiling", deliverable: "Roofing completion" },
    { id: "m6", name: "Finishing", date: new Date(today.getTime() + 75 * 86400000).toISOString(), progress: 0, status: "upcoming", description: "Pengecatan dan finishing interior", deliverable: "Handover package" },
    { id: "m7", name: "Serah Terima", date: new Date(today.getTime() + 90 * 86400000).toISOString(), progress: 0, status: "pending", description: "Project completion & handover", deliverable: "BAST document" },
  ];
}

function getMockSCurveData(): SCurveDataPoint[] {
  const data: SCurveDataPoint[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90);

  for (let i = 0; i <= 26; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i * 7);

    // S-curve calculations using logistic function
    const t = (i / 26) * 10;
    const planned = 100 / (1 + Math.exp(-(t - 5)));
    const actual = Math.min(planned + (Math.random() - 0.3) * 15, 100);

    data.push({
      date: date.toISOString().split("T")[0],
      planned: Math.round(planned * 10) / 10,
      actual: Math.max(0, Math.round(actual * 10) / 10),
      cumulativePlanned: Math.round(planned * 10) / 10,
      cumulativeActual: Math.max(0, Math.round(actual * 10) / 10),
    });
  }

  return data;
}

function getMockPhotos(): Photo[] {
  return [
    { id: "ph1", url: "https://picsum.photos/seed/site1/800/600", thumbnailUrl: "https://picsum.photos/seed/site1/200/150", caption: "Progress struktur lantai 2", location: "Tower A", takenAt: new Date(Date.now() - 86400000).toISOString() },
    { id: "ph2", url: "https://picsum.photos/seed/site2/800/600", thumbnailUrl: "https://picsum.photos/seed/site2/200/150", caption: "Pekerjaan pondasi", location: "Tower B", takenAt: new Date(Date.now() - 172800000).toISOString() },
    { id: "ph3", url: "https://picsum.photos/seed/site3/800/600", thumbnailUrl: "https://picsum.photos/seed/site3/200/150", caption: "Pengecoran kolom", location: "Tower A", takenAt: new Date(Date.now() - 259200000).toISOString() },
    { id: "ph4", url: "https://picsum.photos/seed/site4/800/600", thumbnailUrl: "https://picsum.photos/seed/site4/200/150", caption: "Pembesian sloof", location: "Tower C", takenAt: new Date(Date.now() - 345600000).toISOString() },
    { id: "ph5", url: "https://picsum.photos/seed/site5/800/600", thumbnailUrl: "https://picsum.photos/seed/site5/200/150", caption: "View site dari atas", location: "Site Office", takenAt: new Date(Date.now() - 432000000).toISOString() },
    { id: "ph6", url: "https://picsum.photos/seed/site6/800/600", thumbnailUrl: "https://picsum.photos/seed/site6/200/150", caption: "Pemasangan bekisting", location: "Tower A", takenAt: new Date(Date.now() - 518400000).toISOString() },
  ];
}

function getDefaultNotificationPreferences(): NotificationPreference[] {
  return [
    { type: "progress", label: "Update Progress Proyek", emailEnabled: true, pushEnabled: true, inAppEnabled: true },
    { type: "document", label: "Dokumen Baru", emailEnabled: true, pushEnabled: true, inAppEnabled: true },
    { type: "qc", label: "Hasil QC", emailEnabled: false, pushEnabled: true, inAppEnabled: true },
    { type: "billing", label: "Tagihan & Pembayaran", emailEnabled: true, pushEnabled: false, inAppEnabled: true },
    { type: "message", label: "Pesan dari Tim Proyek", emailEnabled: true, pushEnabled: true, inAppEnabled: true },
    { type: "milestone", label: "Milestone Pencapaian", emailEnabled: false, pushEnabled: true, inAppEnabled: true },
    { type: "photo", label: "Foto Site Baru", emailEnabled: false, pushEnabled: false, inAppEnabled: true },
  ];
}

// Export default preferences
export { getDefaultNotificationPreferences, getMockRecentDocuments, getMockTeamData, getMockMilestones, getMockSCurveData, getMockPhotos };
