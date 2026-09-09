/**
 * Client Portal API Client
 * API client for customer project monitoring
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

interface ClientUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  companyName: string | null;
  avatarUrl: string | null;
  preferredLanguage: string | null;
  notifyProgress: boolean;
  notifyDocuments: boolean;
  notifyMessages: boolean;
}

interface Project {
  accessId: string;
  accessLevel: string;
  grantedAt: string;
  project: {
    id: string;
    number: string;
    title: string;
    clientName: string | null;
    location: string | null;
    status: string;
    scheduleStart: string | null;
    total: number;
    progress: number;
    totalItems: number;
    completedItems: number;
    billingCount: number;
  };
}

interface DailyReport {
  id: string;
  date: string;
  weatherAfternoon: string | null;
  workforce: any;
  activities: string | null;
  equipment: string | null;
  materials: string | null;
  notes: string | null;
  photos: Array<{
    id: string;
    url: string;
    caption: string | null;
    location: string | null;
  }>;
}

interface QCRecord {
  id: string;
  qcCode: string;
  checkDate: string;
  wbsStage: string | null;
  itemDesc: string | null;
  criteria: string | null;
  measurement: string | null;
  result: string;
  defectDesc: string | null;
  isRework: boolean;
  holdPoint: boolean;
  isReleased: boolean;
  weather: string | null;
  notes: string | null;
  photos: Array<{ id: string; url: string; caption: string | null }>;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

// Token management
let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setTokens(access: string, refresh: string | null) {
  accessToken = access;
  refreshToken = refresh;
  if (typeof window !== "undefined") {
    if (access) localStorage.setItem("client_access", access);
    if (refresh) localStorage.setItem("client_refresh", refresh);
    else localStorage.removeItem("client_refresh");
  }
}

export function getAccessToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("client_access");
  }
  return accessToken;
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("client_access");
    localStorage.removeItem("client_refresh");
  }
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getAccessToken();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
    credentials: "include",
  });

  // Auto-refresh on 401
  if (res.status === 401 && refreshToken) {
    const refreshed = await refresh();
    if (refreshed) {
      headers.Authorization = `Bearer ${getAccessToken()}`;
      return fetch(`${API_URL}${url}`, { ...options, headers, credentials: "include" });
    }
  }

  return res;
}

async function refresh(): Promise<boolean> {
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_URL}/client/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      credentials: "include",
    });

    if (!res.ok) return false;

    const json = await res.json();
    if (json.success && json.data) {
      setTokens(json.data.accessToken, json.data.accessToken);
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

// ============================================================
// AUTH
// ============================================================

export async function register(data: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  companyName?: string;
}): Promise<{ success: boolean; client?: ClientUser; error?: string }> {
  try {
    const res = await fetch(`${API_URL}/client/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });

    const json = await res.json();

    if (!res.ok) {
      return { success: false, error: json.message || "Registrasi gagal" };
    }

    if (json.success && json.data) {
      setTokens(json.data.accessToken, null);
      return { success: true, client: json.data.client };
    }

    return { success: false, error: "Respons tidak valid" };
  } catch (e) {
    return { success: false, error: "Gagal terhubung ke server" };
  }
}

export async function login(email: string, password: string): Promise<{ success: boolean; client?: ClientUser; error?: string }> {
  try {
    const res = await fetch(`${API_URL}/client/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });

    const json = await res.json();

    if (!res.ok) {
      return { success: false, error: json.message || "Login gagal" };
    }

    if (json.success && json.data) {
      setTokens(json.data.accessToken, null);
      return { success: true, client: json.data.client };
    }

    return { success: false, error: "Respons tidak valid" };
  } catch {
    return { success: false, error: "Gagal terhubung ke server" };
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${API_URL}/client/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // ignore
  }
  clearTokens();
}

export async function getMe(): Promise<ClientUser | null> {
  try {
    const res = await fetchWithAuth("/client/me");
    const json = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
  } catch {
    // ignore
  }
  return null;
}

// ============================================================
// PROJECTS
// ============================================================

export async function getProjects(): Promise<Project[]> {
  try {
    const res = await fetchWithAuth("/client/projects");
    const json = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
  } catch {
    // ignore
  }
  return [];
}

export async function getProjectDetails(rabId: string): Promise<any> {
  const res = await fetchWithAuth(`/client/projects/${rabId}`);
  const json = await res.json();
  return json.success ? json.data : null;
}

export async function getProjectProgress(rabId: string): Promise<any> {
  const res = await fetchWithAuth(`/client/projects/${rabId}/progress`);
  const json = await res.json();
  return json.success ? json.data : null;
}

// ============================================================
// DAILY REPORTS
// ============================================================

export async function getDailyReports(rabId: string, options?: {
  limit?: number;
  offset?: number;
}): Promise<{ reports: DailyReport[]; total: number }> {
  const params = new URLSearchParams();
  if (options?.limit) params.set("limit", options.limit.toString());
  if (options?.offset) params.set("offset", options.offset.toString());

  const res = await fetchWithAuth(`/client/projects/${rabId}/daily-reports?${params}`);
  const json = await res.json();
  return json.success ? json.data : { reports: [], total: 0 };
}

// ============================================================
// QC RECORDS
// ============================================================

export async function getQCRecords(rabId: string, options?: {
  limit?: number;
  result?: string;
}): Promise<{ records: QCRecord[]; total: number; summary: any }> {
  const params = new URLSearchParams();
  if (options?.limit) params.set("limit", options.limit.toString());
  if (options?.result) params.set("result", options.result);

  const res = await fetchWithAuth(`/client/projects/${rabId}/qc?${params}`);
  const json = await res.json();
  return json.success ? json.data : { records: [], total: 0, summary: null };
}

// ============================================================
// DOCUMENTS
// ============================================================

export async function getDocuments(rabId: string): Promise<any> {
  const res = await fetchWithAuth(`/client/projects/${rabId}/documents`);
  const json = await res.json();
  return json.success ? json.data : null;
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export async function getNotifications(): Promise<{ notifications: Notification[]; unreadCount: number }> {
  const res = await fetchWithAuth("/client/notifications");
  const json = await res.json();
  return json.success ? json.data : { notifications: [], unreadCount: 0 };
}

export async function markNotificationRead(id: string): Promise<void> {
  await fetchWithAuth(`/client/notifications/${id}/read`, { method: "PATCH" });
}

export async function markAllNotificationsRead(): Promise<void> {
  await fetchWithAuth("/client/notifications/read-all", { method: "POST" });
}
