import type { Metadata } from "next";
import { requireAdminRole } from "@/lib/adminApi";
import { getAhspList, getAllPriceItems } from "@/lib/adminResources";
import { AhspTable } from "./AhspTable";

export const metadata: Metadata = { title: "AHSP" };

export default async function AdminAhspPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const session = await requireAdminRole("ADMIN", "EDITOR");
  const params = await searchParams;

  const [{ data, meta }, priceItems] = await Promise.all([
    getAhspList({ page: Number(params.page) || 1, search: params.search }),
    getAllPriceItems(),
  ]);

  return (
    <AhspTable
      items={data}
      meta={meta}
      search={params.search ?? ""}
      priceItems={priceItems}
      isAdmin={session.role === "ADMIN"}
    />
  );
}
