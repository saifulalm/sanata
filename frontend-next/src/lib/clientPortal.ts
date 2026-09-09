/**
 * Client Portal API Client - Modern Design
 * Complete API client with error handling and caching
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
const CACHE_KEY = "client_cache_";

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

export interface Section {
  id: string;
  name: string;
  items: Item[];
}

export interface Item {
  id: string;
  description: string;
  unit: string;
  volume: number;
  unitPrice: number;
  amount: number;
  startOffsetDays: number;
  durationDays: number;
}

export interface Billing {
  id: string;
  number: string;
  status: string;
  periodEnd: string;
  currentValue: number;
  cumulativeValue: number;
  taxAmount: number;
  netAmount: number;
}

export interface Progress {
  project: {
    id: string;
    number: string;
    title: string;
    scheduleStart?: string;
    status: string;
    totalAmount: number;
  };
  plannedCurve: { date: string; planned: number }[];
  actualCurve: { date: string; actual: number }[];
  currentProgress: number;
}

export interface DailyReport {
  id: string;
  date: string;
  weatherMorning?: string;
  weatherAfternoon?: string;
  weatherLog?: any;
  workforce?: any;
  equipment?: string;
  materials?: string;
  activities?: string;
  workActivities?: any[];
  obstacles?: string;
  notes?: string;
  photos: Photo[];
}

export interface Photo {
  id: string;
  url: string;
  caption?: string;
  location?: string;
  takenAt?: string;
}

export interface QCRecord {
  id: string;
  qcCode: string;
  checkDate: string;
  wbsStage?: string;
  itemDesc?: string;
  criteria?: string;
  measurement?: string;
  result: "PASS" | "FAIL" | "REWORK";
  defectDesc?: string;
  isRework: boolean;
  holdPoint: boolean;
  isReleased: boolean;
  weather?: string;
  temperature?: number;
  latitude?: number;
  longitude?: number;
  notes?: string;
  photos: Photo[];
  photosCount: number;
  createdAt: string;
  worker?: { id: string; name: string };
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  rabId?: string;
}

export interface ApiError {
  ok: false;
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

// Token management
let _accessToken: string | null = null;
let _refreshToken: string | null = null;

export function getTokens() {
  if (typeof window === "undefined") return { access: null, refresh: null };
  return {
    access: localStorage.getItem("client_access"),
    refresh: localStorage.getItem("client_refresh"),
  };
}

function setTokens(access: string | null, refresh: string | null) {
  _accessToken = access;
  _refreshToken = refresh;
  if (typeof window !== "undefined") {
    if (access) localStorage.setItem("client_access", access);
    else localStorage.removeItem("client_access");
    if (refresh) localStorage.setItem("client_refresh", refresh);
    else localStorage.removeItem("client_refresh");
  }
}

function clearTokens() {
  setTokens(null, null);
}

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
    credentials: "include",
  } as RequestInit);

  const data = await res.json();

  if (!res.ok) {
    throw { ok: false, status: res.status, message: data.message || "Request failed", errors: data.errors };
  }

  return data;
}

async function authFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { access } = getTokens();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
      ...options.headers,
    },
    credentials: "include",
  } as RequestInit);

  // Handle 401 with refresh
  if (res.status === 401 && _refreshToken) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      return authFetch(path, options);
    }
  }

  const data = await res.json();

  if (!res.ok) {
    if (res.status === 401) {
      clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/client/login";
      }
    }
    throw { ok: false, status: res.status, message: data.message || "Request failed" };
  }

  return data;
}

// Auth
export async function login(email: string, password: string): Promise<{ success: true; client: Client } | ApiError> {
  try {
    const res = await fetchJson<{ success: boolean; data: { accessToken: string; client: Client } }>(`${API_URL}/client/login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (res.success && res.data) {
      setTokens(res.data.accessToken, null);
      return { success: true, client: res.data.client };
    }

    return { ok: false, status: 500, message: "Invalid response" };
  } catch (e: any) {
    return e;
  }
}

export async function register(data: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  companyName?: string;
}): Promise<{ success: true; client: Client } | ApiError> {
  try {
    const res = await fetchJson<{ success: boolean; data: { accessToken: string; client: Client } }>(`${API_URL}/client/register`, {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (res.success && res.data) {
      setTokens(res.data.accessToken, null);
      return { success: true, client: res.data.client };
    }

    return { ok: false, status: 500, message: "Invalid response" };
  } catch (e: any) {
    return e;
  }
}

export async function refreshTokens(): Promise<boolean> {
  try {
    const refresh = _refreshToken || localStorage.getItem("client_refresh");
    if (!refresh) return false;

    const res = await fetch(`${API_URL}/client/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });

    const data = await res.json();

    if (res.ok && data.success && data.data?.accessToken) {
      setTokens(data.data.accessToken, data.data.accessToken);
      return true;
    }
  } catch {}

  return false;
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${API_URL}/client/logout`, { method: "POST" });
  } catch {}
  clearTokens();
}

// Profile
export async function getMe(): Promise<Client | null> {
  try {
    const res = await authFetch<{ success: boolean; data: Client }>("/client/me");
    return res.success ? res.data : null;
  } catch {
    return null;
  }
}

export async function updateProfile(data: Partial<Client>): Promise<Client | null> {
  try {
    const res = await authFetch<{ success: boolean; data: Client }>("/client/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return res.success ? res.data : null;
  } catch {
    return null;
  }
}

// Projects
export async function getProjects(): Promise<ProjectAccess[]> {
  try {
    const res = await authFetch<{ success: boolean; data: ProjectAccess[] }>("/client/projects");
    return res.success ? res.data : [];
  } catch {
    return [];
  }
}

export async function getProject(id: string): Promise<Project | null> {
  try {
    const res = await authFetch<{ success: boolean; data: Project }>(`/client/projects/${id}`);
    return res.success ? res.data : null;
  } catch {
    return null;
  }
}

export async function getProgress(id: string): Promise<Progress | null> {
  try {
    const res = await authFetch<{ success: boolean; data: Progress }>(`/client/projects/${id}/progress`);
    return res.success ? res.data : null;
  } catch {
    return null;
  }
}

// Reports
export async function getDailyReports(id: string, options?: { limit?: number; offset?: number }): Promise<{ reports: DailyReport[]; total: number }> {
  try {
    const params = new URLSearchParams();
    if (options?.limit) params.set("limit", String(options.limit));
    if (options?.offset) params.set("offset", String(options.offset));

    const res = await authFetch<{ success: boolean; data: { reports: DailyReport[]; total: number } }>(
      `/client/projects/${id}/daily-reports?${params}`
    );

    return res.success ? res.data : { reports: [], total: 0 };
  } catch {
    return { reports: [], total: 0 };
  }
}

// QC
export async function getQCRecords(id: string, options?: { limit?: number }): Promise<{ records: QCRecord[]; total: number; summary: { total: number; passed: number; failed: number; rework: number } | null }> {
  try {
    const params = new URLSearchParams();
    if (options?.limit) params.set("limit", String(options.limit));

    const res = await authFetch<{ success: boolean; data: { records: QCRecord[]; total: number; summary: any } }>(
      `/client/projects/${id}/qc?${params}`
    );

    if (res.success) {
      return {
        records: res.data.records,
        total: res.data.total,
        summary: res.data.summary,
      };
    }
  } catch {}

  return { records: [], total: 0, summary: null };
}

// Documents
export async function getDocuments(id: string): Promise<any> {
  try {
    const res = await authFetch<{ success: boolean; data: any }>(`/client/projects/${id}/documents`);
    return res.success ? res.data : null;
  } catch {
    return null;
  }
}

// Notifications
export async function getNotifications(unreadOnly = false): Promise<{ notifications: Notification[]; unreadCount: number }> {
  try {
    const res = await authFetch<{ success: boolean; data: { notifications: Notification[]; unreadCount: number } }>(
      `/client/notifications${unreadOnly ? "?unreadOnly=true" : ""}`
    );
    return res.success ? res.data : { notifications: [], unreadCount: 0 };
  } catch {
    return { notifications: [], unreadCount: 0 };
  }
}

export async function markRead(id: string): Promise<void> {
  try {
    await authFetch(`/client/notifications/${id}/read`, { method: "PATCH" });
  } catch {}
}

export async function markAllRead(): Promise<void> {
  try {
    await authFetch("/client/notifications/read-all", { method: "POST" });
  } catch {}
}

// Helpers
export function formatCurrency(amount: number, compact = false): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date, style: "long" | "short" = "long"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: style,
    year: "numeric",
  });
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
    case "APPROVED":
    case "PAID":
      return { bg: "bg-emerald-100", text: "text-emerald-700", label: "✓ " + status };
    case "IN_PROGRESS":
      return { bg: "bg-blue-100", text: "text-blue-700", label: "● " + status };
    case "PENDING":
    case "DRAFT":
      return { bg: "bg-amber-100", text: "text-amber-700", label: "○ " + status };
    case "REJECTED":
    case "FAIL":
      return { bg: "bg-red-100", text: "text-red-700", label: "✗ " + status };
    default:
      return { bg: "bg-gray-100", text: "text-gray-700", label: status };
  }
}

export function getResultBadge(result: string): { bg: string; text: string } {
  switch (result) {
    case "PASS":
      return { bg: "bg-emerald-100", text: "text-emerald-700" };
    case "FAIL":
      return { bg: "bg-red-100", text: "text-red-700" };
    case "REWORK":
      return { bg: "bg-amber-100", text: "text-amber-700" };
    default:
      return { bg: "bg-gray-100", text: "text-gray-600" };
  }
}
