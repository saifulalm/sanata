import type { Metadata } from "next";
import { requireAdminRole } from "@/lib/adminApi";
import { getQuotations } from "@/lib/adminResources";
import { QuotationBoard } from "./QuotationBoard";

export const metadata: Metadata = { title: "Surat Penawaran" };

export default async function AdminQuotationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  await requireAdminRole("ADMIN", "EDITOR");
  const params = await searchParams;

  const { data, meta } = await getQuotations({
    page: Number(params.page) || 1,
    search: params.search,
    status: params.status,
  });

  return (
    <QuotationBoard
      quotations={data}
      meta={meta}
      search={params.search ?? ""}
      status={params.status ?? ""}
    />
  );
}
