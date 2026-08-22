import "server-only";
import { adminFetch } from "@/lib/adminApi";
import type { Category, ContentItem, ProductItem, PaginatedMeta } from "@/lib/api";
import type {
  Ahsp,
  PriceItem,
  Quotation,
  QuotationDefaults,
  QuotationListRow,
  DailyReport,
  ProgressBilling,
  ProgressEntry,
  Rab,
  RabListRow,
  RabSchedule,
  RabTakeoff,
  ScheduleBaseline,
} from "@/lib/estimation";
import type { SiteContentItem } from "@/lib/siteContent";
import type {
  LetterBoardData,
  LetterDefaultsResponse,
  LetterType,
  LogbookBoardData,
  MemoBoardData,
  PeriodicReportData,
  ProjectLetter,
  SiteMemo,
  Submission,
} from "@/lib/projectDocs";

export interface DashboardSummary {
  cards: {
    users: number;
    content: number;
    publishedContent: number;
    products: number;
    activeProducts: number;
    categories: number;
    totalViews: number;
    newInquiries: number;
    totalInquiries: number;
    ahsp: number;
    priceItems: number;
    rabTotalValue: string;
    rabApprovedValue: string;
    rabCount: number;
  };
  contentByStatus: { status: string; count: number }[];
  inquiryByStatus: { status: string; count: number }[];
  rabByStatus: { status: string; count: number; total: string }[];
  topContent: { id: string; title: string; views: number }[];
  recentContents: { id: string; title: string; status: string; createdAt: string }[];
  recentProducts: { id: string; name: string; price: string; stock: number; createdAt: string }[];
  recentInquiries: { id: string; name: string; service: string | null; createdAt: string }[];
  recentRabs: { id: string; number: string; title: string; status: string; total: string; createdAt: string }[];
}

export async function getDashboardSummary() {
  const res = await adminFetch<{ data: DashboardSummary }>("/dashboard/summary");
  return res.data;
}

export async function getAdminContents(params: { page?: number; search?: string; status?: string }) {
  const qs = new URLSearchParams({
    page: String(params.page ?? 1),
    pageSize: "10",
    ...(params.search ? { search: params.search } : {}),
    ...(params.status ? { status: params.status } : {}),
  });
  const res = await adminFetch<{ data: ContentItem[]; meta: PaginatedMeta }>(`/contents?${qs.toString()}`);
  return res;
}

export async function getAdminContentById(id: string) {
  const res = await adminFetch<{ data: ContentItem }>(`/contents/${id}`);
  return res.data;
}

export async function getAdminProducts(params: { page?: number; search?: string }) {
  const qs = new URLSearchParams({
    page: String(params.page ?? 1),
    pageSize: "10",
    ...(params.search ? { search: params.search } : {}),
  });
  const res = await adminFetch<{ data: ProductItem[]; meta: PaginatedMeta }>(`/products?${qs.toString()}`);
  return res;
}

export async function getAdminProductById(id: string) {
  const res = await adminFetch<{ data: ProductItem }>(`/products/${id}`);
  return res.data;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "EDITOR" | "USER";
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export async function getAdminUsers(params: { page?: number; search?: string; role?: string }) {
  const qs = new URLSearchParams({
    page: String(params.page ?? 1),
    pageSize: "10",
    ...(params.search ? { search: params.search } : {}),
    ...(params.role ? { role: params.role } : {}),
  });
  return adminFetch<{ data: AdminUser[]; meta: PaginatedMeta }>(`/users?${qs.toString()}`);
}

export interface AdminMedia {
  id: string;
  url: string;
  storageKey: string | null;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
  product: { id: string; name: string; slug: string } | null;
}

export interface AdminMediaMeta extends PaginatedMeta {
  totalFiles: number;
  totalSize: number;
}

export async function getAdminMedia(params: { page?: number; search?: string; type?: string }) {
  const qs = new URLSearchParams({
    page: String(params.page ?? 1),
    pageSize: "24",
    ...(params.search ? { search: params.search } : {}),
    ...(params.type ? { type: params.type } : {}),
  });
  return adminFetch<{ data: AdminMedia[]; meta: AdminMediaMeta }>(`/media?${qs.toString()}`);
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  service: string | null;
  message: string;
  status: "NEW" | "CONTACTED" | "CLOSED";
  marketingConsent?: boolean;
  preferredChannel?: "EMAIL" | "TELEGRAM" | "WHATSAPP" | "INSTAGRAM" | "FACEBOOK" | null;
  createdAt: string;
}

export async function getAdminInquiries(params: { page?: number; search?: string; status?: string }) {
  const qs = new URLSearchParams({
    page: String(params.page ?? 1),
    pageSize: "10",
    ...(params.search ? { search: params.search } : {}),
    ...(params.status ? { status: params.status } : {}),
  });
  return adminFetch<{ data: Inquiry[]; meta: PaginatedMeta; counts: Record<string, number> }>(
    `/inquiries?${qs.toString()}`
  );
}

export type BroadcastChannel = "EMAIL" | "TELEGRAM" | "WHATSAPP" | "INSTAGRAM" | "FACEBOOK";
export type BroadcastProvider =
  | "EMAIL_SMTP"
  | "TELEGRAM_BOT"
  | "WHATSAPP_BAILEYS"
  | "WHATSAPP_OFFICIAL"
  | "WHATSAPP_WAHA"
  | "WHATSAPP_EVOLUTION"
  | "INSTAGRAM_META"
  | "FACEBOOK_META";
export type BroadcastConnectionMode = "PRODUCTION" | "EXPERIMENTAL";
export type BroadcastConnectionStatus = "DISCONNECTED" | "CONNECTED" | "ERROR";
export type BroadcastCampaignStatus =
  | "DRAFT"
  | "SENDING"
  | "SENT"
  | "PARTIAL"
  | "FAILED"
  | "CANCELLED";
export type BroadcastAudienceType = "ALL_CONTACTS" | "CONSENTED_ONLY" | "TAGGED";

export interface BroadcastConnection {
  id: string;
  channel: BroadcastChannel;
  provider: BroadcastProvider;
  mode: BroadcastConnectionMode;
  accountKey: string;
  label: string;
  senderIdentity: string | null;
  isEnabled: boolean;
  isPrimary: boolean;
  priority: number;
  weight: number;
  dailyLimit: number | null;
  hourlyLimit: number | null;
  status: BroadcastConnectionStatus;
  statusMessage: string | null;
  config: Record<string, unknown>;
  cooldownUntil: string | null;
  lastCheckedAt: string | null;
  lastUsedAt: string | null;
  updatedAt: string;
  metrics: { campaigns: number; deliveries: number };
}

export type BroadcastConnectionSessionState =
  | "CONNECTED"
  | "QR_READY"
  | "PAIRING"
  | "DISCONNECTED"
  | "ERROR"
  | "UNKNOWN";

export interface BroadcastConnectionSession {
  connectionId: string;
  provider: BroadcastProvider;
  sessionKey: string;
  state: BroadcastConnectionSessionState;
  qrCodeDataUrl: string | null;
  qrCodeText: string | null;
  /** Kode 8 karakter untuk "Tautkan dengan nomor telepon". */
  pairingCode: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  message: string | null;
  canScanQr: boolean;
  /** Perkiraan kedaluwarsa QR — dasar hitung mundur dan auto-refresh. */
  qrExpiresAt: string | null;
  lastSyncedAt: string;
}

export interface BroadcastContact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  telegramChatId: string | null;
  instagramHandle: string | null;
  facebookPageScopedId: string | null;
  preferredChannel: BroadcastChannel | null;
  consent: boolean;
  consentSource: string | null;
  tags: string[];
  updatedAt: string;
  metrics: { deliveries: number };
}

export interface BroadcastCampaignRow {
  id: string;
  title: string;
  channel: BroadcastChannel;
  status: BroadcastCampaignStatus;
  audienceType: BroadcastAudienceType;
  audienceFilter: Record<string, unknown>;
  subject: string | null;
  message: string;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  connection: Pick<BroadcastConnection, "id" | "channel" | "label" | "isEnabled" | "status"> | null;
  createdBy: { id: string; name: string; email: string };
  stats: { total: number; sent: number; failed: number; skipped: number; pending: number };
}

export interface BroadcastOverview {
  summary: {
    totalContacts: number;
    consentedContacts: number;
    enabledConnections: number;
    activeChannels: number;
    draftCampaigns: number;
    sentCampaigns: number;
    partialCampaigns: number;
  };
  connections: BroadcastConnection[];
  contacts: BroadcastContact[];
  campaigns: BroadcastCampaignRow[];
}

export async function getBroadcastOverview() {
  const res = await adminFetch<{ data: BroadcastOverview }>("/broadcasts/overview");
  return res.data;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  meta: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

export async function getAdminAuditLogs(params: { page?: number; entity?: string }) {
  const qs = new URLSearchParams({
    page: String(params.page ?? 1),
    pageSize: "15",
    ...(params.entity ? { entity: params.entity } : {}),
  });
  const res = await adminFetch<{ data: AuditLogEntry[]; meta: PaginatedMeta }>(`/audit-logs?${qs.toString()}`);
  return res;
}

// --- Project Role (unified — signatories + workforce) -----------------------
export type { ProjectRole, WorkforceRole } from "@/lib/adminSignatories";
export { PROJECT_ROLE_LABEL } from "@/lib/adminSignatories";
export type { Signatory } from "@/lib/adminSignatories";
export { getSignatories, getSignatoryById } from "@/lib/adminSignatories.server";

// --- Estimasi biaya: Harga Satuan Dasar -> AHSP -> RAB ---------------------
// Tipe & konstanta domain ada di `@/lib/estimation` agar bisa dipakai komponen klien.

export async function getPriceItems(params: { page?: number; search?: string; type?: string }) {
  const qs = new URLSearchParams({
    page: String(params.page ?? 1),
    pageSize: "15",
    ...(params.search ? { search: params.search } : {}),
    ...(params.type ? { type: params.type } : {}),
  });
  return adminFetch<{ data: PriceItem[]; meta: PaginatedMeta }>(`/price-items?${qs.toString()}`);
}

/** Semua harga satuan aktif — dipakai untuk dropdown komponen AHSP. */
export async function getAllPriceItems() {
  const items: PriceItem[] = [];
  let page = 1;

  while (true) {
    const res = await adminFetch<{ data: PriceItem[]; meta: PaginatedMeta }>(
      `/price-items?page=${page}&pageSize=100&isActive=true`
    );
    items.push(...res.data);
    if (page >= res.meta.totalPages) break;
    page += 1;
  }

  return items;
}

export async function getAhspList(params: { page?: number; search?: string; category?: string }) {
  const qs = new URLSearchParams({
    page: String(params.page ?? 1),
    pageSize: "15",
    ...(params.search ? { search: params.search } : {}),
    ...(params.category ? { category: params.category } : {}),
  });
  return adminFetch<{ data: Ahsp[]; meta: PaginatedMeta }>(`/ahsp?${qs.toString()}`);
}

export async function getAhspById(id: string) {
  const res = await adminFetch<{ data: Ahsp }>(`/ahsp/${id}`);
  return res.data;
}

/** Semua AHSP aktif — dipakai untuk memilih item saat menyusun RAB. */
export async function getAllAhsp() {
  const items: Ahsp[] = [];
  let page = 1;

  while (true) {
    const res = await adminFetch<{ data: Ahsp[]; meta: PaginatedMeta }>(`/ahsp?page=${page}&pageSize=100&isActive=true`);
    items.push(...res.data);
    if (page >= res.meta.totalPages) break;
    page += 1;
  }

  return items;
}

export async function getRabList(params: { page?: number; search?: string; status?: string }) {
  const qs = new URLSearchParams({
    page: String(params.page ?? 1),
    pageSize: "10",
    ...(params.search ? { search: params.search } : {}),
    ...(params.status ? { status: params.status } : {}),
  });
  return adminFetch<{ data: RabListRow[]; meta: PaginatedMeta }>(`/rab?${qs.toString()}`);
}

export async function getRabById(id: string) {
  const res = await adminFetch<{ data: Rab }>(`/rab/${id}`);
  return res.data;
}

export async function getRabTakeoff(id: string) {
  const res = await adminFetch<{ data: RabTakeoff }>(`/rab/${id}/takeoff`);
  return res.data;
}

export async function getRabSchedule(id: string) {
  const res = await adminFetch<{ data: RabSchedule }>(`/rab/${id}/schedule`);
  return res.data;
}

export async function getProgressEntries(id: string) {
  const res = await adminFetch<{ data: ProgressEntry[] }>(`/rab/${id}/progress`);
  return res.data;
}

export async function getScheduleBaselines(id: string) {
  const res = await adminFetch<{ data: ScheduleBaseline[] }>(`/rab/${id}/baselines`);
  return res.data;
}

export async function getDailyReports(id: string) {
  const res = await adminFetch<{ data: { rab: { id: string; number: string; title: string }; reports: DailyReport[] } }>(
    `/rab/${id}/daily-reports`
  );
  return res.data;
}

export interface DailyReportSummary {
  id: string;
  number: string;
  title: string;
  location: string | null;
  status: string;
  reportCount: number;
  latestReport: {
    id: string;
    date: string;
    weatherMorning: string | null;
    weatherAfternoon: string | null;
  } | null;
}

export async function getDailyReportSummary() {
  const res = await adminFetch<{ data: DailyReportSummary[] }>("/rab/daily-reports/summary");
  return res.data;
}

export async function getBillings(id: string) {
  const res = await adminFetch<{ data: ProgressBilling[] }>(`/rab/${id}/billings`);
  return res.data;
}

// --- Dokumen proyek: pengajuan, logbook, site memo, surat-menyurat ----------

export async function getSubmissions(params: {
  page?: number;
  rabId?: string;
  type?: string;
  status?: string;
  search?: string;
}) {
  const qs = new URLSearchParams({
    page: String(params.page ?? 1),
    pageSize: "15",
    ...(params.rabId ? { rabId: params.rabId } : {}),
    ...(params.type ? { type: params.type } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.search ? { search: params.search } : {}),
  });
  return adminFetch<{ data: Submission[]; meta: PaginatedMeta }>(`/submissions?${qs.toString()}`);
}

export async function getSubmissionById(id: string) {
  const res = await adminFetch<{ data: Submission }>(`/submissions/${id}`);
  return res.data;
}

export async function getLogbook(rabId: string, params: { category?: string; unresolved?: string } = {}) {
  const qs = new URLSearchParams({
    ...(params.category ? { category: params.category } : {}),
    ...(params.unresolved ? { unresolved: params.unresolved } : {}),
  });
  const res = await adminFetch<{ data: LogbookBoardData }>(`/rab/${rabId}/logbook?${qs.toString()}`);
  return res.data;
}

export async function getMemos(rabId: string, params: { direction?: string; status?: string } = {}) {
  const qs = new URLSearchParams({
    ...(params.direction ? { direction: params.direction } : {}),
    ...(params.status ? { status: params.status } : {}),
  });
  const res = await adminFetch<{ data: MemoBoardData }>(`/rab/${rabId}/memos?${qs.toString()}`);
  return res.data;
}

export async function getMemoById(memoId: string) {
  const res = await adminFetch<{ data: SiteMemo }>(`/site-memos/${memoId}`);
  return res.data;
}

export async function getLetters(rabId: string, params: { type?: string; status?: string } = {}) {
  const qs = new URLSearchParams({
    ...(params.type ? { type: params.type } : {}),
    ...(params.status ? { status: params.status } : {}),
  });
  const res = await adminFetch<{ data: LetterBoardData }>(`/rab/${rabId}/letters?${qs.toString()}`);
  return res.data;
}

export async function getLetterById(letterId: string) {
  const res = await adminFetch<{ data: ProjectLetter }>(`/letters/${letterId}`);
  return res.data;
}

export async function getLetterDefaults(rabId: string, type: LetterType, billingId?: string) {
  const qs = new URLSearchParams({ rabId, type, ...(billingId ? { billingId } : {}) });
  const res = await adminFetch<{ data: LetterDefaultsResponse }>(`/letters/defaults?${qs.toString()}`);
  return res.data;
}

export async function getWeeklyReports(rabId: string) {
  const res = await adminFetch<{ data: PeriodicReportData }>(`/rab/${rabId}/reports/weekly`);
  return res.data;
}

export async function getMonthlyReports(rabId: string) {
  const res = await adminFetch<{ data: PeriodicReportData }>(`/rab/${rabId}/reports/monthly`);
  return res.data;
}

// --- SEO --------------------------------------------------------------------

export type SeoCheckStatus = "good" | "warning" | "bad";

export interface SeoCheck {
  id: string;
  label: string;
  status: SeoCheckStatus;
  message: string;
}

export interface SeoAnalysis {
  score: number;
  grade: "baik" | "cukup" | "kurang";
  checks: SeoCheck[];
}

export interface SeoOverviewRow {
  id: string;
  title: string;
  slug: string;
  type: "PAGE" | "POST";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  metaTitle: string | null;
  metaDescription: string | null;
  focusKeyword: string | null;
  noIndex: boolean;
  updatedAt: string;
  score: number;
  grade: "baik" | "cukup" | "kurang";
  issues: number;
}

export interface SeoOverview {
  items: SeoOverviewRow[];
  summary: { total: number; indexable: number; noIndex: number; averageScore: number; needsWork: number };
}

export async function getSeoOverview() {
  const res = await adminFetch<{ data: SeoOverview }>("/contents/seo/overview");
  return res.data;
}

// --- Surat Penawaran Harga --------------------------------------------------

export async function getQuotations(params: { page?: number; search?: string; status?: string }) {
  const qs = new URLSearchParams({
    page: String(params.page ?? 1),
    pageSize: "10",
    ...(params.search ? { search: params.search } : {}),
    ...(params.status ? { status: params.status } : {}),
  });
  return adminFetch<{ data: QuotationListRow[]; meta: PaginatedMeta }>(`/quotations?${qs.toString()}`);
}

export async function getQuotationById(id: string) {
  const res = await adminFetch<{ data: Quotation }>(`/quotations/${id}`);
  return res.data;
}

export async function getQuotationDefaults(rabId: string) {
  const res = await adminFetch<{ data: QuotationDefaults }>(`/quotations/defaults?rabId=${rabId}`);
  return res.data;
}

// --- CMS konten situs -------------------------------------------------------

export type ChoiceKey = "variant" | "accent";
export type NumberKey = "heightM" | "widthM" | "depthM" | "startWeek" | "durationWeeks";
export type TextKey = "phone" | "hours" | "keywords";

/** Field teks pendek, juga disimpan di `meta`. */
export interface TextDef {
  label: string;
  placeholder?: string;
  maxLength?: number;
}

/** Field pilihan yang disimpan di kolom `meta`, bukan kolom tetap. */
export interface ChoiceDef {
  label: string;
  options: { value: string; label: string }[];
}

/** Field angka, juga disimpan di `meta`. */
export interface NumberDef {
  label: string;
  min: number;
  max: number;
  step: number;
  fallback: number;
  suffix?: string;
}

export interface CollectionDef {
  label: string;
  page: string;
  description: string;
  fields: Partial<Record<"title" | "subtitle" | "body" | "icon" | "imageUrl" | "href", string>>;
  choices?: Partial<Record<ChoiceKey, ChoiceDef>>;
  numbers?: Partial<Record<NumberKey, NumberDef>>;
  texts?: Partial<Record<TextKey, TextDef>>;
}

export interface AdminSiteSetting {
  key: string;
  value: string;
  group: string;
  label: string;
  type: string;
  order: number;
}

export async function getSiteCollections() {
  const res = await adminFetch<{ data: Record<string, CollectionDef> }>("/site-content/collections");
  return res.data;
}

export async function getSiteCollectionItems(collection: string) {
  const res = await adminFetch<{ data: SiteContentItem[] }>(`/site-content/items/${collection}`);
  return res.data;
}

export async function getSiteSettings() {
  const res = await adminFetch<{ data: AdminSiteSetting[] }>("/site-content/settings");
  return res.data;
}

// ── Project Roles & Workforce Roles ─────────────────────────────────────────

export async function getWorkforceRoles() {
  const res = await adminFetch<{ data: import("@/lib/adminSignatories").WorkforceRole[] }>("/workforce-roles");
  return res.data;
}

export type { Category };
