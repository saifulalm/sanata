import type { Metadata } from "next";
import { getCategories } from "@/lib/api";
import { getAdminProducts } from "@/lib/adminResources";
import { getAdminSession } from "@/lib/adminApi";
import { ProductsTable } from "./ProductsTable";

export const metadata: Metadata = { title: "Layanan" };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  const session = await getAdminSession();

  const [{ data: items, meta }, categories] = await Promise.all([
    getAdminProducts({ page: params.page ? Number(params.page) : 1, search: params.search }),
    getCategories(),
  ]);

  return (
    <ProductsTable
      items={items}
      meta={meta}
      categories={categories}
      canManage={session.role !== "USER"}
      isAdmin={session.role === "ADMIN"}
      search={params.search ?? ""}
    />
  );
}
