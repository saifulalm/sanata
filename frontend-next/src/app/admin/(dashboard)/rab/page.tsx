import type { Metadata } from "next";
import { requireAdminRole } from "@/lib/adminApi";
import { getRabList } from "@/lib/adminResources";
import { RabList } from "./RabList";

export const metadata: Metadata = { title: "RAB" };

export default async function AdminRabPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  const session = await requireAdminRole("ADMIN", "EDITOR");
  const params = await searchParams;

  const { data, meta } = await getRabList({
    page: Number(params.page) || 1,
    search: params.search,
    status: params.status,
  });

  return (
    <RabList
      items={data}
      meta={meta}
      search={params.search ?? ""}
      status={params.status ?? ""}
      isAdmin={session.role === "ADMIN"}
    />
  );
}
