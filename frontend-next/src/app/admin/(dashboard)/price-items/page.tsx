import type { Metadata } from "next";
import { requireAdminRole } from "@/lib/adminApi";
import { getPriceItems } from "@/lib/adminResources";
import { PriceItemsTable } from "./PriceItemsTable";

export const metadata: Metadata = { title: "Harga Satuan Dasar" };

export default async function AdminPriceItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; type?: string }>;
}) {
  const session = await requireAdminRole("ADMIN", "EDITOR");
  const params = await searchParams;

  const { data, meta } = await getPriceItems({
    page: Number(params.page) || 1,
    search: params.search,
    type: params.type,
  });

  return (
    <PriceItemsTable
      items={data}
      meta={meta}
      search={params.search ?? ""}
      type={params.type ?? ""}
      isAdmin={session.role === "ADMIN"}
    />
  );
}
