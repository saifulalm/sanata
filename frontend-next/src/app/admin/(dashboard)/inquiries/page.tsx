import type { Metadata } from "next";
import { getAdminInquiries } from "@/lib/adminResources";
import { requireAdminRole } from "@/lib/adminApi";
import { InquiryBoard } from "./InquiryBoard";

export const metadata: Metadata = { title: "Pesan Masuk" };

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  await requireAdminRole("ADMIN", "EDITOR");
  const params = await searchParams;

  const { data, meta } = await getAdminInquiries({
    page: Number(params.page) || 1,
    search: params.search,
    status: params.status,
  });

  return (
    <InquiryBoard
      inquiries={data}
      meta={meta}
      search={params.search ?? ""}
      status={params.status ?? ""}
    />
  );
}
