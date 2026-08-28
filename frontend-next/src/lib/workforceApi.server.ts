// SANTRA Workforce API (Server Components)
import { cookies } from "next/headers";
import { fetchWithTimeout, readJsonSafely } from "@/lib/http";
import { ACCESS_COOKIE, REFRESH_COOKIE, refreshWithExpress } from "@/lib/adminAuth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export class AdminApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export interface PaginatedMeta { page: number; pageSize: number; total: number; totalPages: number; }

// ============================================
// GEOLOCATION API
// ============================================

export interface GeoLocation {
  latitude: number;
  longitude: number;
  displayName: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  county?: string;
  state?: string;
  country?: string;
  postcode?: string;
}

export interface GeoSearchResult {
  latitude: number;
  longitude: number;
  displayName: string;
  type: string;
}

// ============================================
// TYPES
// ============================================

export type WorkerStatus = "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED";
export type WorkerGrade = "A" | "B" | "C" | "D";
export type AssignmentStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type QcResult = "PASS" | "FAIL" | "REWORK";
export type ToolCondition = "GOOD" | "FAIR" | "DAMAGED" | "LOST";
export type LoanStatus = "OPEN" | "RETURNED" | "OVERDUE" | "LOST";
export type ToolOwner = "COMPANY" | "PERSONAL" | "RENTED";

export interface Worker {
  id: string;
  workerCode: string;
  name: string;
  role: string;
  ktpNumber: string | null;
  ktpPhotoUrl: string | null;
  facePhotoUrl: string | null;
  phone: string | null;
  address: string | null;
  status: WorkerStatus;
  joinDate: string | null;
  grade: WorkerGrade | null;
  rate: string | null;
  skills: string[];
  experienceYears: number | null;
  certificates: string[];
  skillNotes: string | null;
  ktpVerified: boolean;
  profileComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkerStats {
  total: number;
  active: number;
  byRole: Record<string, number>;
  byGrade: Record<string, number>;
}

export interface WorkerAssessment {
  id: string;
  assessmentCode: string;
  workerId: string;
  worker: Pick<Worker, "id" | "workerCode" | "name" | "role">;
  assessmentDate: string;
  interviewer: string | null;
  technicalScore: number | null;
  interviewScore: number | null;
  teamworkScore: number | null;
  safetyScore: number | null;
  overallScore: number | null;
  grade: WorkerGrade | null;
  recommendation: string | null;
  notes: string | null;
  evidenceUrl: string | null;
  createdAt: string;
}

export interface JobAssignment {
  id: string;
  assignmentCode: string;
  rabId: string | null;
  rab: { id: string; number: string; title: string } | null;
  wbsCode: string | null;
  workItem: string;
  methodRef: string | null;
  responsiblePersonId: string | null;
  responsiblePerson: Pick<Worker, "id" | "workerCode" | "name" | "role"> | null;
  responsibleMandorId: string | null;
  responsibleMandor: Pick<Worker, "id" | "workerCode" | "name" | "role"> | null;
  status: AssignmentStatus;
  priority: number;
  plannedStart: string | null;
  plannedEnd: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  scopeDescription: string | null;
  progressPct: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionPhoto {
  id: string;
  url: string;
  caption: string | null;
  location: string | null;
  takenAt: string | null;
  order: number;
}

export interface ExecutionLog {
  id: string;
  logCode: string;
  assignmentId: string;
  assignment: Pick<JobAssignment, "id" | "assignmentCode" | "workItem">;
  workerId: string;
  worker: Pick<Worker, "id" | "workerCode" | "name" | "role">;
  logDate: string;
  description: string | null;
  latitude: string | null;
  longitude: string | null;
  locationName: string | null;
  progressPct: number | null;
  dailyReportId: string | null;
  photos: ExecutionPhoto[];
  createdAt: string;
  updatedAt: string;
}

export interface QcPhoto {
  id: string;
  url: string;
  caption: string | null;
  order: number;
}

export interface QcRecord {
  id: string;
  qcCode: string;
  assignmentId: string;
  assignment: Pick<JobAssignment, "id" | "assignmentCode" | "workItem">;
  workerId: string;
  worker: Pick<Worker, "id" | "workerCode" | "name" | "role">;
  checkDate: string;
  itemDesc: string | null;
  criteria: string | null;
  measurement: string | null;
  result: QcResult;
  defectDesc: string | null;
  defectPhotoUrl: string | null;
  isRework: boolean;
  reworkOfId: string | null;
  approvedById: string | null;
  approvedAt: string | null;
  photos: QcPhoto[];
  createdAt: string;
  updatedAt: string;
}

export interface QcStats {
  total: number;
  pass: number;
  fail: number;
  rework: number;
}

export interface KpiRecord {
  id: string;
  kpiCode: string;
  workerId: string;
  worker: Pick<Worker, "id" | "workerCode" | "name" | "role" | "grade">;
  period: string;
  periodStart: string;
  periodEnd: string;
  qualityScore: number | null;
  productivityScore: number | null;
  attendanceScore: number | null;
  safetyScore: number | null;
  reworkCount: number;
  defectCount: number;
  completedTasks: number;
  lateDays: number;
  overallScore: number | null;
  rank: number | null;
  approvedById: string | null;
  approvedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MasterTool {
  id: string;
  toolCode: string;
  name: string;
  category: string;
  trade: string | null;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  purchaseDate: string | null;
  warrantyExpiry: string | null;
  purchasePrice: number | null;
  minQuantity: number;
  unit: string;
  currentCondition: ToolCondition;
  owner: ToolOwner;
  needsMaintenance: boolean;
  maintenanceIntervalDays: number | null;
  lastMaintenanceDate: string | null;
  nextMaintenanceDate: string | null;
  currentLocation: string | null;
  personalOwnerId: string | null;
  personalOwner: Pick<Worker, "id" | "workerCode" | "name"> | null;
  isActive: boolean;
  notes: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  photos?: ToolPhoto[];
  loans?: ToolLoan[];
  maintenanceLogs?: ToolMaintenanceLog[];
}

export interface ToolPhoto {
  id: string;
  toolId: string;
  url: string;
  caption: string | null;
  isPrimary: boolean;
  order: number;
  createdAt: string;
}

export interface ToolMaintenanceLog {
  id: string;
  maintenanceCode: string;
  type: string;
  description: string;
  scheduledDate: string | null;
  performedDate: string | null;
  cost: number | null;
  vendor: string | null;
  createdAt: string;
}

export interface ToolLoan {
  id: string;
  loanCode: string;
  toolId: string;
  tool: Pick<MasterTool, "id" | "toolCode" | "name" | "category" | "currentCondition">;
  workerId: string;
  worker: Pick<Worker, "id" | "workerCode" | "name" | "role">;
  issuedById: string;
  issuedAt: string;
  returnedAt: string | null;
  returnedCondition: ToolCondition | null;
  status: LoanStatus;
  issuedPhotoUrl: string | null;
  returnedPhotoUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ToolStats {
  total: number;
  available: number;
  open: number;
  overdue: number;
  lost: number;
}

// ============================================
// TOOL PHOTOS
// ============================================

export interface ToolPhoto {
  id: string;
  toolId: string;
  url: string;
  caption: string | null;
  isPrimary: boolean;
  order: number;
  createdAt: string;
}

// ============================================
// TOOL QR CODE
// ============================================

export interface ToolQrCode {
  toolId: string;
  toolCode: string;
  name: string;
  url: string;
}

// ============================================
// TOOL UTILIZATION
// ============================================

export interface ToolUtilization {
  toolId: string;
  totalLoans: number;
  activeLoans: number;
  returnedLoans: number;
  overdueLoans: number;
  averageLoanDuration: number;
  utilizationRate: number;
  totalDaysBorrowed: number;
  lastBorrowedAt: string | null;
  mostBorrowedBy: { workerId: string; workerName: string; count: number } | null;
}

// ============================================
// MAINTENANCE SCHEDULE
// ============================================

export interface MaintenanceScheduleItem {
  toolId: string;
  toolCode: string;
  toolName: string;
  category: string;
  scheduledDate: string | null;
  type: string;
  description: string;
  isOverdue: boolean;
  daysUntilDue: number | null;
}

// ============================================
// Internal fetch helper
// ============================================

async function authFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const fullUrl = `${API_URL}${path}`;

  const store = await cookies();
  const access = store.get(ACCESS_COOKIE)?.value;
  const refresh = store.get(REFRESH_COOKIE)?.value;

  if (!access) throw new AdminApiError(401, "Login diperlukan");

  const headers: Record<string, string> = {
    Authorization: `Bearer ${access}`,
    "Cache-Control": "no-store",
    ...(init?.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
  };

  const first = await fetchWithTimeout(fullUrl, {
    ...init,
    headers: { ...headers, ...(init?.headers as Record<string, string> | undefined) },
  });

  if (first.status === 401 && refresh) {
    const fresh = await refreshWithExpress(refresh);
    if (fresh.ok) {
      const secondUrl = `${API_URL}${path}`;
      const second = await fetchWithTimeout(secondUrl, {
        ...init,
        headers: { ...headers, Authorization: `Bearer ${fresh.accessToken}`, ...(init?.headers as Record<string, string> | undefined) },
      });
      const ok = await readJsonSafely<{ message?: string } & T>(second);
      if (!ok) throw new AdminApiError(second.status, "Gagal");
      if (!second.ok) throw new AdminApiError(second.status, ok?.message ?? "Request gagal");
      return ok;
    }
  }

  const json = await readJsonSafely<{ message?: string } & T>(first);
  if (!first.ok) throw new AdminApiError(first.status, json?.message ?? "Request gagal");
  if (!json) throw new AdminApiError(502, "Respons backend tidak valid");
  return json;
}

// ============================================
// WORKER API
// ============================================

export async function getWorkers(params?: {
  page?: number;
  pageSize?: number;
  role?: string;
  status?: WorkerStatus;
  grade?: WorkerGrade;
  search?: string;
}): Promise<{ data: Worker[]; meta: PaginatedMeta }> {
  const qs = new URLSearchParams({
    page: String(params?.page ?? 1),
    pageSize: String(params?.pageSize ?? 20),
    ...(params?.role && { role: params.role }),
    ...(params?.status && { status: params.status }),
    ...(params?.grade && { grade: params.grade }),
    ...(params?.search && { search: params.search }),
  });
  return authFetch<{ data: Worker[]; meta: PaginatedMeta }>(`/workforce/workers?${qs.toString()}`);
}

export async function getWorker(id: string): Promise<Worker> {
  const res = await authFetch<{ data: Worker }>(`/workforce/workers/${id}`);
  return res.data;
}

export async function getWorkerStats(): Promise<WorkerStats> {
  const res = await authFetch<{ data: WorkerStats }>("/workforce/workers/stats");
  return res.data;
}

export async function getAvailableWorkers(role?: string): Promise<Pick<Worker, "id" | "workerCode" | "name" | "role" | "grade" | "ktpVerified">[]> {
  const qs = role ? `?role=${role}` : "";
  const res = await authFetch<{ data: Pick<Worker, "id" | "workerCode" | "name" | "role" | "grade" | "ktpVerified">[] }>(`/workforce/workers/available${qs}`);
  return res.data;
}

export async function createWorker(data: Partial<Worker>): Promise<Worker> {
  const res = await authFetch<{ data: Worker }>("/workforce/workers", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateWorker(id: string, data: Partial<Worker>): Promise<Worker> {
  const res = await authFetch<{ data: Worker }>(`/workforce/workers/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteWorker(id: string): Promise<void> {
  await authFetch(`/workforce/workers/${id}`, { method: "DELETE" });
}

export async function verifyWorker(id: string, verified: boolean): Promise<Worker> {
  const res = await authFetch<{ data: Worker }>(`/workforce/workers/${id}/verify`, {
    method: "POST",
    body: JSON.stringify({ verified }),
  });
  return res.data;
}

// ============================================
// ASSESSMENT API
// ============================================

export async function getAssessments(params?: {
  page?: number;
  pageSize?: number;
  workerId?: string;
}): Promise<{ data: WorkerAssessment[]; meta: PaginatedMeta }> {
  const qs = new URLSearchParams({
    page: String(params?.page ?? 1),
    pageSize: String(params?.pageSize ?? 20),
    ...(params?.workerId && { workerId: params.workerId }),
  });
  return authFetch<{ data: WorkerAssessment[]; meta: PaginatedMeta }>(`/workforce/assessments?${qs.toString()}`);
}

export async function getAssessment(id: string): Promise<WorkerAssessment> {
  const res = await authFetch<{ data: WorkerAssessment }>(`/workforce/assessments/${id}`);
  return res.data;
}

export async function getWorkerAssessments(workerId: string): Promise<WorkerAssessment[]> {
  const res = await authFetch<{ data: WorkerAssessment[] }>(`/workforce/assessments/worker/${workerId}`);
  return res.data;
}

export async function createAssessment(data: Partial<WorkerAssessment>): Promise<WorkerAssessment> {
  const res = await authFetch<{ data: WorkerAssessment }>("/workforce/assessments", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

// ============================================
// ASSIGNMENT API
// ============================================

export async function getAssignments(params?: {
  page?: number;
  pageSize?: number;
  rabId?: string;
  status?: AssignmentStatus;
  personId?: string;
}): Promise<{ data: JobAssignment[]; meta: PaginatedMeta }> {
  const qs = new URLSearchParams({
    page: String(params?.page ?? 1),
    pageSize: String(params?.pageSize ?? 20),
    ...(params?.rabId && { rabId: params.rabId }),
    ...(params?.status && { status: params.status }),
    ...(params?.personId && { personId: params.personId }),
  });
  return authFetch<{ data: JobAssignment[]; meta: PaginatedMeta }>(`/workforce/assignments?${qs.toString()}`);
}

export async function getAssignment(id: string): Promise<JobAssignment> {
  const res = await authFetch<{ data: JobAssignment }>(`/workforce/assignments/${id}`);
  return res.data;
}

export async function createAssignment(data: Partial<JobAssignment>): Promise<JobAssignment> {
  const res = await authFetch<{ data: JobAssignment }>("/workforce/assignments", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateAssignment(id: string, data: Partial<JobAssignment>): Promise<JobAssignment> {
  const res = await authFetch<{ data: JobAssignment }>(`/workforce/assignments/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function getAssignmentsByRab(rabId: string): Promise<JobAssignment[]> {
  const res = await authFetch<{ data: JobAssignment[] }>(`/workforce/assignments/rab/${rabId}`);
  return res.data;
}

export async function updateAssignmentStatus(id: string, status: AssignmentStatus): Promise<JobAssignment> {
  const res = await authFetch<{ data: JobAssignment }>(`/workforce/assignments/${id}/status`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
  return res.data;
}

export async function assignPerson(id: string, personId: string, mandorId?: string): Promise<JobAssignment> {
  const res = await authFetch<{ data: JobAssignment }>(`/workforce/assignments/${id}/assign`, {
    method: "POST",
    body: JSON.stringify({ personId, mandorId }),
  });
  return res.data;
}

// ============================================
// EXECUTION API
// ============================================

export async function getExecutions(params?: {
  page?: number;
  pageSize?: number;
  assignmentId?: string;
  workerId?: string;
  rabId?: string;
}): Promise<{ data: ExecutionLog[]; meta: PaginatedMeta }> {
  const qs = new URLSearchParams({
    page: String(params?.page ?? 1),
    pageSize: String(params?.pageSize ?? 20),
    ...(params?.assignmentId && { assignmentId: params.assignmentId }),
    ...(params?.workerId && { workerId: params.workerId }),
    ...(params?.rabId && { rabId: params.rabId }),
  });
  return authFetch<{ data: ExecutionLog[]; meta: PaginatedMeta }>(`/workforce/executions?${qs.toString()}`);
}

export async function getExecution(id: string): Promise<ExecutionLog> {
  const res = await authFetch<{ data: ExecutionLog }>(`/workforce/executions/${id}`);
  return res.data;
}

export async function getWorkerExecutions(workerId: string): Promise<ExecutionLog[]> {
  const res = await authFetch<{ data: ExecutionLog[] }>(`/workforce/executions/worker/${workerId}`);
  return res.data;
}

export async function getExecutionsByAssignment(assignmentId: string): Promise<ExecutionLog[]> {
  const res = await authFetch<{ data: ExecutionLog[] }>(`/workforce/executions/assignment/${assignmentId}`);
  return res.data;
}

export async function getExecutionStats(rabId?: string): Promise<{
  total: number;
  withPhotos: number;
  withGps: number;
  avgProgress: number;
  photoCoverage: number;
  gpsCoverage: number;
}> {
  const qs = rabId ? `?rabId=${rabId}` : "";
  const res = await authFetch<{ data: { total: number; withPhotos: number; withGps: number; avgProgress: number; photoCoverage: number; gpsCoverage: number } }>(`/workforce/executions/stats${qs}`);
  return res.data;
}

export async function getDailyExecutionSummary(rabId: string, date: string): Promise<{
  date: string;
  totalExecutions: number;
  workersCount: number;
  assignmentsCount: number;
  averageProgress: number;
  executions: Array<{
    id: string;
    logCode: string;
    worker: Pick<Worker, "id" | "workerCode" | "name" | "role">;
    assignment: Pick<JobAssignment, "id" | "assignmentCode" | "workItem">;
    progressPct: number;
    description?: string;
    locationName?: string;
  }>;
}> {
  const res = await authFetch<{ data: {
    date: string;
    totalExecutions: number;
    workersCount: number;
    assignmentsCount: number;
    averageProgress: number;
    executions: Array<{
      id: string;
      logCode: string;
      worker: Pick<Worker, "id" | "workerCode" | "name" | "role">;
      assignment: Pick<JobAssignment, "id" | "assignmentCode" | "workItem">;
      progressPct: number;
      description?: string;
      locationName?: string;
    }>;
  } }>(`/workforce/executions/daily-summary?rabId=${rabId}&date=${date}`);
  return res.data;
}

export async function createExecution(data: {
  assignmentId: string;
  workerId: string;
  logDate?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  progressPct?: number;
}): Promise<ExecutionLog> {
  const res = await authFetch<{ data: ExecutionLog }>("/workforce/executions", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateExecution(
  id: string,
  data: {
    description?: string;
    latitude?: number;
    longitude?: number;
    locationName?: string;
    progressPct?: number;
  }
): Promise<ExecutionLog> {
  const res = await authFetch<{ data: ExecutionLog }>(`/workforce/executions/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteExecution(id: string): Promise<void> {
  await authFetch(`/workforce/executions/${id}`, { method: "DELETE" });
}

export async function addExecutionPhoto(
  executionId: string,
  data: { url: string; caption?: string; location?: string }
): Promise<ExecutionPhoto> {
  const res = await authFetch<{ data: ExecutionPhoto }>(`/workforce/executions/${executionId}/photos`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteExecutionPhoto(photoId: string): Promise<void> {
  await authFetch(`/workforce/executions/photos/${photoId}`, { method: "DELETE" });
}

// ============================================
// QC API
// ============================================

export async function getQcRecords(params?: {
  page?: number;
  pageSize?: number;
  assignmentId?: string;
  workerId?: string;
  rabId?: string;
  result?: QcResult;
}): Promise<{ data: QcRecord[]; meta: PaginatedMeta }> {
  const qs = new URLSearchParams({
    page: String(params?.page ?? 1),
    pageSize: String(params?.pageSize ?? 20),
    ...(params?.assignmentId && { assignmentId: params.assignmentId }),
    ...(params?.workerId && { workerId: params.workerId }),
    ...(params?.rabId && { rabId: params.rabId }),
    ...(params?.result && { result: params.result }),
  });
  return authFetch<{ data: QcRecord[]; meta: PaginatedMeta }>(`/workforce/qc?${qs.toString()}`);
}

export async function getQcRecord(id: string): Promise<QcRecord> {
  const res = await authFetch<{ data: QcRecord }>(`/workforce/qc/${id}`);
  return res.data;
}

export async function getQcStats(): Promise<QcStats> {
  const res = await authFetch<{ data: QcStats }>("/workforce/qc/stats");
  return res.data;
}

export async function createQcRecord(data: {
  assignmentId: string;
  workerId: string;
  itemDesc?: string;
  criteria?: string;
  measurement?: string;
  result: QcResult;
  defectDesc?: string;
}): Promise<QcRecord> {
  const res = await authFetch<{ data: QcRecord }>("/workforce/qc", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function approveQcRecord(id: string): Promise<QcRecord> {
  const res = await authFetch<{ data: QcRecord }>(`/workforce/qc/${id}/approve`, {
    method: "POST",
  });
  return res.data;
}

export async function createRework(
  id: string,
  data: { defectDesc: string; workerId: string }
): Promise<QcRecord> {
  const res = await authFetch<{ data: QcRecord }>(`/workforce/qc/${id}/rework`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

// ============================================
// KPI API
// ============================================

export async function getKpis(params?: {
  page?: number;
  pageSize?: number;
  workerId?: string;
  period?: string;
}): Promise<{ data: KpiRecord[]; meta: PaginatedMeta }> {
  const qs = new URLSearchParams({
    page: String(params?.page ?? 1),
    pageSize: String(params?.pageSize ?? 20),
    ...(params?.workerId && { workerId: params.workerId }),
    ...(params?.period && { period: params.period }),
  });
  return authFetch<{ data: KpiRecord[]; meta: PaginatedMeta }>(`/workforce/kpis?${qs.toString()}`);
}

export async function getKpi(id: string): Promise<KpiRecord> {
  const res = await authFetch<{ data: KpiRecord }>(`/workforce/kpis/${id}`);
  return res.data;
}

export async function getWorkerKpis(workerId: string): Promise<KpiRecord[]> {
  const res = await authFetch<{ data: KpiRecord[] }>(`/workforce/kpis/worker/${workerId}`);
  return res.data;
}

export async function getKpiLeaderboard(period?: string): Promise<KpiRecord[]> {
  const qs = period ? `?period=${period}` : "";
  const res = await authFetch<{ data: KpiRecord[] }>(`/workforce/kpis/leaderboard${qs}`);
  return res.data;
}

export async function getKpiPeriods(): Promise<Array<{ value: string; label: string; start: string; end: string }>> {
  const res = await authFetch<{ data: Array<{ value: string; label: string; start: string; end: string }> }>("/workforce/kpis/periods");
  return res.data;
}

export async function upsertKpi(data: {
  workerId: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  qualityScore?: number;
  productivityScore?: number;
  attendanceScore?: number;
  safetyScore?: number;
  reworkCount?: number;
  defectCount?: number;
  completedTasks?: number;
  lateDays?: number;
  notes?: string;
}): Promise<KpiRecord> {
  const res = await authFetch<{ data: KpiRecord }>("/workforce/kpis", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteKpi(id: string): Promise<void> {
  await authFetch(`/workforce/kpis/${id}`, { method: "DELETE" });
}

// ============================================
// TOOLS API
// ============================================

export async function getTools(params?: {
  category?: string;
  owner?: ToolOwner;
  status?: "available" | "borrowed" | "maintenance";
  search?: string;
}): Promise<MasterTool[]> {
  const qs = new URLSearchParams({
    ...(params?.category && { category: params.category }),
    ...(params?.owner && { owner: params.owner }),
    ...(params?.status && { status: params.status }),
    ...(params?.search && { search: params.search }),
  });
  const qsStr = qs.toString();
  const res = await authFetch<{ data: MasterTool[] }>(`/workforce/tools${qsStr ? `?${qsStr}` : ""}`);
  return res.data;
}

export async function getTool(id: string): Promise<MasterTool> {
  const res = await authFetch<{ data: MasterTool }>(`/workforce/tools/${id}`);
  return res.data;
}

export async function getToolStats(): Promise<ToolStats> {
  const res = await authFetch<{ data: ToolStats }>("/workforce/tools/stats");
  return res.data;
}

export async function getToolCategories(): Promise<Array<{ value: string; label: string; count: number }>> {
  const res = await authFetch<{ data: Array<{ value: string; label: string; count: number }> }>("/workforce/tools/categories");
  return res.data;
}

export async function createTool(data: {
  name: string;
  category: string;
  trade?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  purchasePrice?: number;
  minQuantity?: number;
  unit?: string;
  condition?: ToolCondition;
  owner?: ToolOwner;
  needsMaintenance?: boolean;
  maintenanceIntervalDays?: number;
  currentLocation?: string;
  personalOwnerId?: string;
  notes?: string;
  imageUrl?: string;
}): Promise<MasterTool> {
  const res = await authFetch<{ data: MasterTool }>("/workforce/tools", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateTool(id: string, data: Partial<MasterTool>): Promise<MasterTool> {
  const res = await authFetch<{ data: MasterTool }>(`/workforce/tools/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateToolCondition(id: string, condition: ToolCondition): Promise<MasterTool> {
  const res = await authFetch<{ data: MasterTool }>(`/workforce/tools/${id}/condition`, {
    method: "PUT",
    body: JSON.stringify({ condition }),
  });
  return res.data;
}

export async function getToolsEnhanced(params?: {
  page?: number;
  pageSize?: number;
  category?: string;
  owner?: ToolOwner;
  status?: "available" | "borrowed" | "maintenance" | "needs_maintenance" | "overdue";
  search?: string;
}): Promise<{ data: MasterTool[]; meta: PaginatedMeta }> {
  const qs = new URLSearchParams({
    ...(params?.page && { page: String(params.page) }),
    ...(params?.pageSize && { pageSize: String(params.pageSize) }),
    ...(params?.category && { category: params.category }),
    ...(params?.owner && { owner: params.owner }),
    ...(params?.status && { status: params.status }),
    ...(params?.search && { search: params.search }),
  });
  const qsStr = qs.toString();
  return authFetch<{ success: boolean; data: MasterTool[]; meta: PaginatedMeta }>(
    `/workforce/tools/enhanced${qsStr ? `?${qsStr}` : ""}`
  );
}

// ============================================
// TOOL PHOTOS API
// ============================================

export async function getToolPhotos(toolId: string): Promise<ToolPhoto[]> {
  const res = await authFetch<{ success: boolean; data: ToolPhoto[] }>(`/workforce/tools/${toolId}/photos`);
  return res.data;
}

export async function addToolPhoto(toolId: string, data: {
  url: string;
  caption?: string;
  isPrimary?: boolean;
}): Promise<ToolPhoto> {
  const res = await authFetch<{ success: boolean; data: ToolPhoto }>(`/workforce/tools/${toolId}/photos`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteToolPhoto(photoId: string): Promise<void> {
  await authFetch(`/workforce/photos/${photoId}`, { method: "DELETE" });
}

export async function setPrimaryPhoto(photoId: string): Promise<void> {
  await authFetch(`/workforce/photos/${photoId}/primary`, { method: "PUT" });
}

// ============================================
// TOOL QR CODE
// ============================================

export async function getToolQrCode(toolId: string): Promise<ToolQrCode> {
  const res = await authFetch<{ success: boolean; data: ToolQrCode }>(`/workforce/tools/${toolId}/qrcode`);
  return res.data;
}

// ============================================
// TOOL UTILIZATION
// ============================================

export async function getToolUtilization(toolId: string): Promise<ToolUtilization> {
  const res = await authFetch<{ success: boolean; data: ToolUtilization }>(`/workforce/tools/${toolId}/utilization`);
  return res.data;
}

// ============================================
// MAINTENANCE SCHEDULE
// ============================================

export async function getUpcomingMaintenance(days: number = 30): Promise<MaintenanceScheduleItem[]> {
  const res = await authFetch<{ success: boolean; data: MaintenanceScheduleItem[] }>(
    `/workforce/maintenance/upcoming?days=${days}`
  );
  return res.data;
}

export interface MaintenanceCalendar {
  completed: Array<{
    id: string;
    maintenanceCode: string;
    type: string;
    description: string;
    performedDate: string;
    cost: number | null;
    vendor: string | null;
  }>;
  scheduled: Array<{
    id: string;
    maintenanceCode: string;
    type: string;
    description: string;
    scheduledDate: string;
  }>;
  upcoming: Array<{
    id: string;
    toolCode: string;
    toolName: string;
    scheduledDate: string;
    type: string;
  }>;
}

export async function getMaintenanceCalendar(month: number, year: number): Promise<MaintenanceCalendar> {
  const res = await authFetch<{ success: boolean; data: MaintenanceCalendar }>(
    `/workforce/maintenance/calendar?month=${month}&year=${year}`
  );
  return res.data;
}

// ============================================
// TOOL LOANS API
// ============================================

export async function getLoans(params?: {
  page?: number;
  pageSize?: number;
  toolId?: string;
  workerId?: string;
  status?: LoanStatus;
}): Promise<{ data: ToolLoan[]; meta: PaginatedMeta }> {
  const qs = new URLSearchParams({
    page: String(params?.page ?? 1),
    pageSize: String(params?.pageSize ?? 20),
    ...(params?.toolId && { toolId: params.toolId }),
    ...(params?.workerId && { workerId: params.workerId }),
    ...(params?.status && { status: params.status }),
  });
  return authFetch<{ data: ToolLoan[]; meta: PaginatedMeta }>(`/workforce/loans?${qs.toString()}`);
}

export async function issueTool(data: {
  toolId: string;
  workerId: string;
  notes?: string;
}): Promise<ToolLoan> {
  const res = await authFetch<{ data: ToolLoan }>("/workforce/loans", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function returnTool(
  loanId: string,
  data: { condition: ToolCondition }
): Promise<ToolLoan> {
  const res = await authFetch<{ data: ToolLoan }>(`/workforce/loans/${loanId}/return`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function getLoan(id: string): Promise<ToolLoan> {
  const res = await authFetch<{ data: ToolLoan }>(`/workforce/loans/${id}`);
  return res.data;
}

export async function getLoansByTool(toolId: string): Promise<ToolLoan[]> {
  const res = await authFetch<{ data: ToolLoan[] }>(`/workforce/loans/tool/${toolId}`);
  return res.data;
}

export async function getLoansByWorker(workerId: string): Promise<ToolLoan[]> {
  const res = await authFetch<{ data: ToolLoan[] }>(`/workforce/loans/worker/${workerId}`);
  return res.data;
}

export async function markOverdueLoans(): Promise<{ updated: number }> {
  const res = await authFetch<{ data: { updated: number } }>("/workforce/loans/mark-overdue", {
    method: "POST",
  });
  return res.data;
}

// ============================================
// DASHBOARD API
// ============================================

export async function getWorkforceDashboard() {
  const [workers, assignments, executions, qc, tools] = await Promise.all([
    getWorkerStats(),
    getAssignments({ pageSize: 1 }),
    getExecutions({ pageSize: 1 }),
    getQcStats(),
    getToolStats(),
  ]);

  return {
    workers,
    assignments: {
      total: assignments.meta.total,
      pending: 0,
      inProgress: 0,
      completed: 0,
    },
    executions: {
      today: 0,
      thisWeek: executions.meta.total,
    },
    qc,
    tools,
  };
}
