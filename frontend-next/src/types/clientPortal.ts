/**
 * Client Portal - Shared Types
 * Centralized TypeScript types for the Client Portal module
 */

// ============================================================================
// Core Types
// ============================================================================

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
  weatherLog?: WeatherLog;
  workforce?: Workforce;
  equipment?: string;
  materials?: string;
  activities?: string;
  workActivities?: WorkActivity[];
  obstacles?: string;
  notes?: string;
  photos: Photo[];
}

export interface WeatherLog {
  temperature?: number;
  humidity?: number;
  condition?: string;
  windSpeed?: number;
}

export interface Workforce {
  total: number;
  byRole?: Record<string, number>;
  byOrigin?: Record<string, number>;
}

export interface WorkActivity {
  id: string;
  description: string;
  location?: string;
  workers?: number;
  hours?: number;
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
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  rabId?: string;
}

export type NotificationType =
  | "progress"
  | "document"
  | "qc"
  | "photo"
  | "billing"
  | "message"
  | "milestone"
  | "system"
  | "info";

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export interface DailyReportsResponse {
  reports: DailyReport[];
  total: number;
}

export interface QCRecordsResponse {
  records: QCRecord[];
  total: number;
  summary: QCRecordSummary | null;
}

export interface QCRecordSummary {
  total: number;
  passed: number;
  failed: number;
  rework: number;
}

// ============================================================================
// UI Component Types
// ============================================================================

export type Theme = "light" | "dark";

export type StatusVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "primary";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  exact?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface ActivityItem {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  projectId?: string;
  projectName?: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
  bgColor?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  phone?: string;
  email?: string;
}

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  category: string;
  size: string;
  uploadDate: string;
  url: string;
}

export type DocumentType = "drawing" | "contract" | "report" | "photo";

export interface Milestone {
  id: string;
  name: string;
  date: string;
  progress: number;
  status: MilestoneStatus;
}

export type MilestoneStatus = "complete" | "in_progress" | "upcoming" | "pending";

export interface ProjectUpdate {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  photos?: Photo[];
  author?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

export interface StatusBadge {
  bg: string;
  text: string;
  label: string;
}

export interface TrendData {
  value: string;
  direction: "up" | "down" | "neutral";
  percentage?: string;
}
