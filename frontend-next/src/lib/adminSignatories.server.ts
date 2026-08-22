"use server";

import { adminFetch } from "@/lib/adminApi";
import type { Signatory } from "@/lib/adminSignatories";
import type { PaginatedMeta } from "@/lib/api";

export async function getSignatories(params: {
  page?: number;
  search?: string;
  isActive?: string;
}) {
  const qs = new URLSearchParams({
    page: String(params.page ?? 1),
    pageSize: "15",
    ...(params.search ? { search: params.search } : {}),
    ...(params.isActive ? { isActive: params.isActive } : {}),
  });
  return adminFetch<{
    data: Signatory[];
    meta: PaginatedMeta;
  }>(`/signatories?${qs.toString()}`);
}

export async function getSignatoryById(id: string) {
  const res = await adminFetch<{ data: Signatory }>(`/signatories/${id}`);
  return res.data;
}
