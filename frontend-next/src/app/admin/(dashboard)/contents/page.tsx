import type { Metadata } from "next";
import { getCategories } from "@/lib/api";
import { getAdminContents } from "@/lib/adminResources";
import { getAdminSession } from "@/lib/adminApi";
import { ContentsTable } from "./ContentsTable";

export const metadata: Metadata = { title: "Content" };

export default async function AdminContentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const session = await getAdminSession();

  const [{ data: items, meta }, categories] = await Promise.all([
    getAdminContents({ page: params.page ? Number(params.page) : 1, search: params.search, status: params.status }),
    getCategories(),
  ]);

  return (
    <ContentsTable
      items={items}
      meta={meta}
      categories={categories}
      canManage={session.role !== "USER"}
      isAdmin={session.role === "ADMIN"}
      search={params.search ?? ""}
      status={params.status ?? ""}
    />
  );
}
