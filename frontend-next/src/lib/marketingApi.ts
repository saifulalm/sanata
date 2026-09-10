const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
import { fetchWithTimeout, isHttpRequestError, readJsonSafely } from "@/lib/http";

export class MarketingApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

export interface PaginatedMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// Campaign Types
export type CampaignType = "WHATSAPP" | "EMAIL" | "INSTAGRAM" | "MULTI";
export type CampaignStatus = "DRAFT" | "SCHEDULED" | "SENDING" | "COMPLETED" | "CANCELLED" | "FAILED";

export interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  audience?: {
    id: string;
    name: string;
    count: number;
  };
  content?: {
    subject?: string;
    body: string;
    media?: { url: string; type: string };
  };
  statistics?: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
    failed: number;
  };
  scheduledAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignCreateInput {
  name: string;
  type: CampaignType;
  audienceId?: string;
  audienceFilter?: Record<string, any>;
  content: {
    subject?: string;
    body: string;
    mediaUrl?: string;
  };
  scheduledAt?: string;
}

// Contact Types
export interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  tags: string[];
  lists: string[];
  totalReceived: number;
  totalOpened: number;
  lastReceived?: string;
  createdAt: string;
}

export interface ContactCreateInput {
  name: string;
  phone?: string;
  email?: string;
  tags?: string[];
}

// Broadcast List Types
export interface BroadcastList {
  id: string;
  name: string;
  description?: string;
  type: "WHATSAPP" | "EMAIL" | "GENERAL";
  contactCount: number;
  createdAt: string;
  updatedAt: string;
}

// Template Types
export type TemplateCategory = "WHATSAPP" | "EMAIL" | "INSTAGRAM" | "OFFER" | "GENERAL";

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  content: {
    subject?: string;
    body: string;
    media?: { url: string; type: string };
  };
  variables: string[];
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

// Offer Types
export type OfferType = "DISCOUNT" | "PROMO" | "BUNDLE" | "FLASH_SALE";
export type OfferStatus = "ACTIVE" | "SCHEDULED" | "EXPIRED" | "DRAFT";

export interface Offer {
  id: string;
  name: string;
  type: OfferType;
  status: OfferStatus;
  title: string;
  description: string;
  discountValue?: number;
  discountType?: "PERCENTAGE" | "FIXED";
  minPurchase?: number;
  startDate: string;
  endDate: string;
  usageCount: number;
  conversionCount: number;
  createdAt: string;
}

// Analytics Types
export interface CampaignAnalytics {
  campaignId: string;
  date: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
}

export interface ChannelAnalytics {
  channel: CampaignType;
  totalSent: number;
  totalDelivered: number;
  avgOpenRate: number;
  avgClickRate: number;
  totalConversions: number;
}

// API Helper
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  let res: Response;
  try {
    res = await fetchWithTimeout(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
  } catch (error) {
    if (isHttpRequestError(error)) {
      throw new MarketingApiError("Backend tidak dapat dijangkau.", 503);
    }
    throw new MarketingApiError("Terjadi gangguan saat memuat data.", 500);
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Unknown error" }));
    throw new MarketingApiError(error.message || `API ${path} failed`, res.status);
  }

  const json = await readJsonSafely<{ data: T }>(res);
  if (!json) throw new MarketingApiError("Respons API tidak valid.", 502);
  return json.data;
}

async function apiFetchPaginated<T>(path: string): Promise<{ data: T[]; meta: PaginatedMeta }> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const res = await fetchWithTimeout(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) throw new MarketingApiError(`API ${path} failed`, res.status);
  const json = await readJsonSafely<{ data: T[]; meta: PaginatedMeta }>(res);
  if (!json) throw new MarketingApiError("Respons API tidak valid.", 502);
  return json;
}

// Campaign API
export async function getCampaigns(params?: {
  page?: number;
  pageSize?: number;
  status?: CampaignStatus;
  type?: CampaignType;
  search?: string;
}) {
  const qs = new URLSearchParams({
    page: String(params?.page ?? 1),
    pageSize: String(params?.pageSize ?? 20),
    ...(params?.status ? { status: params.status } : {}),
    ...(params?.type ? { type: params.type } : {}),
    ...(params?.search ? { search: params.search } : {}),
  });
  return apiFetchPaginated<Campaign>(`/marketing/campaigns?${qs.toString()}`);
}

export async function getCampaign(id: string): Promise<Campaign> {
  return apiFetch<Campaign>(`/marketing/campaigns/${id}`);
}

export async function createCampaign(input: CampaignCreateInput): Promise<Campaign> {
  return apiFetch<Campaign>("/marketing/campaigns", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateCampaign(id: string, input: Partial<CampaignCreateInput>): Promise<Campaign> {
  return apiFetch<Campaign>(`/marketing/campaigns/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteCampaign(id: string): Promise<void> {
  return apiFetch<void>(`/marketing/campaigns/${id}`, { method: "DELETE" });
}

export async function sendCampaign(id: string): Promise<Campaign> {
  return apiFetch<Campaign>(`/marketing/campaigns/${id}/send`, { method: "POST" });
}

export async function cancelCampaign(id: string): Promise<Campaign> {
  return apiFetch<Campaign>(`/marketing/campaigns/${id}/cancel`, { method: "POST" });
}

// Contact API
export async function getContacts(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  tags?: string[];
  listId?: string;
}) {
  const qs = new URLSearchParams({
    page: String(params?.page ?? 1),
    pageSize: String(params?.pageSize ?? 20),
    ...(params?.search ? { search: params.search } : {}),
    ...(params?.tags ? { tags: params.tags.join(",") } : {}),
    ...(params?.listId ? { listId: params.listId } : {}),
  });
  return apiFetchPaginated<Contact>(`/marketing/contacts?${qs.toString()}`);
}

export async function getContact(id: string): Promise<Contact> {
  return apiFetch<Contact>(`/marketing/contacts/${id}`);
}

export async function createContact(input: ContactCreateInput): Promise<Contact> {
  return apiFetch<Contact>("/marketing/contacts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateContact(id: string, input: Partial<ContactCreateInput>): Promise<Contact> {
  return apiFetch<Contact>(`/marketing/contacts/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteContact(id: string): Promise<void> {
  return apiFetch<void>(`/marketing/contacts/${id}`, { method: "DELETE" });
}

export async function importContacts(file: File): Promise<{ imported: number; failed: number }> {
  const formData = new FormData();
  formData.append("file", file);

  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/marketing/contacts/import`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) throw new MarketingApiError("Import failed", res.status);
  return res.json();
}

export async function exportContacts(params?: { tags?: string[]; listId?: string }): Promise<Blob> {
  const qs = new URLSearchParams({
    ...(params?.tags ? { tags: params.tags.join(",") } : {}),
    ...(params?.listId ? { listId: params.listId } : {}),
  });

  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/marketing/contacts/export?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new MarketingApiError("Export failed", res.status);
  return res.blob();
}

// Broadcast List API
export async function getBroadcastLists(params?: { page?: number; pageSize?: number }) {
  const qs = new URLSearchParams({
    page: String(params?.page ?? 1),
    pageSize: String(params?.pageSize ?? 20),
  });
  return apiFetchPaginated<BroadcastList>(`/marketing/broadcast-lists?${qs.toString()}`);
}

export async function getBroadcastList(id: string): Promise<BroadcastList & { contacts: Contact[] }> {
  return apiFetch<BroadcastList & { contacts: Contact[] }>(`/marketing/broadcast-lists/${id}`);
}

export async function createBroadcastList(input: { name: string; description?: string; type: string }): Promise<BroadcastList> {
  return apiFetch<BroadcastList>("/marketing/broadcast-lists", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateBroadcastList(id: string, input: { name?: string; description?: string }): Promise<BroadcastList> {
  return apiFetch<BroadcastList>(`/marketing/broadcast-lists/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteBroadcastList(id: string): Promise<void> {
  return apiFetch<void>(`/marketing/broadcast-lists/${id}`, { method: "DELETE" });
}

export async function addContactsToList(listId: string, contactIds: string[]): Promise<void> {
  return apiFetch<void>(`/marketing/broadcast-lists/${listId}/contacts`, {
    method: "POST",
    body: JSON.stringify({ contactIds }),
  });
}

export async function removeContactsFromList(listId: string, contactIds: string[]): Promise<void> {
  return apiFetch<void>(`/marketing/broadcast-lists/${listId}/contacts`, {
    method: "DELETE",
    body: JSON.stringify({ contactIds }),
  });
}

// Template API
export async function getTemplates(params?: {
  page?: number;
  pageSize?: number;
  category?: TemplateCategory;
  search?: string;
}) {
  const qs = new URLSearchParams({
    page: String(params?.page ?? 1),
    pageSize: String(params?.pageSize ?? 20),
    ...(params?.category ? { category: params.category } : {}),
    ...(params?.search ? { search: params.search } : {}),
  });
  return apiFetchPaginated<Template>(`/marketing/templates?${qs.toString()}`);
}

export async function getTemplate(id: string): Promise<Template> {
  return apiFetch<Template>(`/marketing/templates/${id}`);
}

export async function createTemplate(input: {
  name: string;
  category: TemplateCategory;
  content: { subject?: string; body: string; mediaUrl?: string };
}): Promise<Template> {
  return apiFetch<Template>("/marketing/templates", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateTemplate(id: string, input: Partial<{
  name: string;
  category: TemplateCategory;
  content: { subject?: string; body: string; mediaUrl?: string };
  isActive: boolean;
}>): Promise<Template> {
  return apiFetch<Template>(`/marketing/templates/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteTemplate(id: string): Promise<void> {
  return apiFetch<void>(`/marketing/templates/${id}`, { method: "DELETE" });
}

// Offer API
export async function getOffers(params?: {
  page?: number;
  pageSize?: number;
  status?: OfferStatus;
  type?: OfferType;
}) {
  const qs = new URLSearchParams({
    page: String(params?.page ?? 1),
    pageSize: String(params?.pageSize ?? 20),
    ...(params?.status ? { status: params.status } : {}),
    ...(params?.type ? { type: params.type } : {}),
  });
  return apiFetchPaginated<Offer>(`/marketing/offers?${qs.toString()}`);
}

export async function getOffer(id: string): Promise<Offer> {
  return apiFetch<Offer>(`/marketing/offers/${id}`);
}

export async function createOffer(input: {
  name: string;
  type: OfferType;
  title: string;
  description: string;
  discountValue?: number;
  discountType?: "PERCENTAGE" | "FIXED";
  minPurchase?: number;
  startDate: string;
  endDate: string;
}): Promise<Offer> {
  return apiFetch<Offer>("/marketing/offers", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateOffer(id: string, input: Partial<{
  name: string;
  type: OfferType;
  title: string;
  description: string;
  discountValue?: number;
  discountType?: "PERCENTAGE" | "FIXED";
  minPurchase?: number;
  startDate: string;
  endDate: string;
  status: OfferStatus;
}>): Promise<Offer> {
  return apiFetch<Offer>(`/marketing/offers/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteOffer(id: string): Promise<void> {
  return apiFetch<void>(`/marketing/offers/${id}`, { method: "DELETE" });
}

// Analytics API
export async function getMarketingStats(): Promise<{
  totalCampaigns: number;
  activeCampaigns: number;
  totalContacts: number;
  totalSent: number;
  avgOpenRate: number;
  avgClickRate: number;
  totalConversions: number;
  revenue: number;
}> {
  return apiFetch("/marketing/stats");
}

export async function getChannelAnalytics(): Promise<ChannelAnalytics[]> {
  return apiFetch<ChannelAnalytics[]>("/marketing/analytics/channels");
}

export async function getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics[]> {
  return apiFetch<CampaignAnalytics[]>(`/marketing/analytics/campaigns/${campaignId}`);
}

export async function getCampaignTimeline(params?: { days?: number }): Promise<{
  date: string;
  campaigns: number;
  sent: number;
  conversions: number;
}[]> {
  const qs = new URLSearchParams({ days: String(params?.days ?? 30) });
  return apiFetch(`/marketing/analytics/timeline?${qs.toString()}`);
}
