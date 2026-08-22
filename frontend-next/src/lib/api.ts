const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
import { fetchWithTimeout, isHttpRequestError, readJsonSafely } from "@/lib/http";

export class PublicApiError extends Error {
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

async function apiFetch<T>(path: string, revalidate = 60): Promise<T> {
  let res: Response;
  try {
    res = await fetchWithTimeout(`${API_URL}${path}`, { next: { revalidate } });
  } catch (error) {
    if (isHttpRequestError(error)) {
      throw new PublicApiError("Backend publik tidak dapat dijangkau.", 503);
    }
    throw new PublicApiError("Terjadi gangguan saat memuat data publik.", 500);
  }

  if (!res.ok) throw new PublicApiError(`API ${path} failed with ${res.status}`, res.status);
  const json = await readJsonSafely<{ data: T }>(res);
  if (!json) throw new PublicApiError("Respons API publik tidak valid.", 502);
  return json.data;
}

async function apiFetchPaginated<T>(path: string, revalidate = 60): Promise<{ data: T; meta: PaginatedMeta }> {
  let res: Response;
  try {
    res = await fetchWithTimeout(`${API_URL}${path}`, { next: { revalidate } });
  } catch (error) {
    if (isHttpRequestError(error)) {
      throw new PublicApiError("Backend publik tidak dapat dijangkau.", 503);
    }
    throw new PublicApiError("Terjadi gangguan saat memuat data publik.", 500);
  }

  if (!res.ok) throw new PublicApiError(`API ${path} failed with ${res.status}`, res.status);
  const json = await readJsonSafely<{ data: T; meta: PaginatedMeta }>(res);
  if (!json) throw new PublicApiError("Respons API publik tidak valid.", 502);
  return { data: json.data, meta: json.meta };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface ContentItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  type: "PAGE" | "POST";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  coverImage: string | null;
  views: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt?: string;
  category: Category | null;
  author?: { id: string; name: string };

  // --- SEO ---
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: string | null;
  canonicalUrl?: string | null;
  focusKeyword?: string | null;
  noIndex?: boolean;
}

export interface ProductItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  compareAtPrice?: string | null;
  sku?: string | null;
  stock?: number;
  isActive?: boolean;
  category: Category | null;
  images: { id: string; url: string }[];
}

export async function getFeaturedProjects(): Promise<ProductItem[]> {
  return apiFetch<ProductItem[]>("/products?pageSize=6&isActive=true");
}

export async function getLatestArticles(): Promise<ContentItem[]> {
  return apiFetch<ContentItem[]>("/contents?pageSize=3&status=PUBLISHED&type=POST");
}

export async function getCategories(): Promise<Category[]> {
  return apiFetch<Category[]>("/categories");
}

export async function getProducts(params: { page?: number; pageSize?: number; search?: string; categoryId?: string } = {}) {
  const qs = new URLSearchParams({
    pageSize: String(params.pageSize ?? 12),
    page: String(params.page ?? 1),
    isActive: "true",
    ...(params.search ? { search: params.search } : {}),
    ...(params.categoryId ? { categoryId: params.categoryId } : {}),
  });
  return apiFetchPaginated<ProductItem[]>(`/products?${qs.toString()}`);
}

export async function getProductBySlug(slug: string): Promise<ProductItem> {
  return apiFetch<ProductItem>(`/products/slug/${slug}`);
}

export async function getArticles(params: { page?: number; pageSize?: number; search?: string; categoryId?: string } = {}) {
  const qs = new URLSearchParams({
    pageSize: String(params.pageSize ?? 9),
    page: String(params.page ?? 1),
    status: "PUBLISHED",
    type: "POST",
    ...(params.search ? { search: params.search } : {}),
    ...(params.categoryId ? { categoryId: params.categoryId } : {}),
  });
  return apiFetchPaginated<ContentItem[]>(`/contents?${qs.toString()}`);
}

export async function getArticleBySlug(slug: string): Promise<ContentItem> {
  return apiFetch<ContentItem>(`/contents/slug/${slug}`);
}
