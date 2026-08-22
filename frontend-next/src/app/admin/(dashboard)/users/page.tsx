import type { Metadata } from "next";
import { getAdminUsers } from "@/lib/adminResources";
import { requireAdminRole } from "@/lib/adminApi";
import { UsersBoard } from "./UsersBoard";

export const metadata: Metadata = { title: "Pengguna" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const session = await requireAdminRole("ADMIN");
  const params = await searchParams;

  const { data, meta } = await getAdminUsers({
    page: Number(params.page) || 1,
    search: params.search,
  });

  return (
    <UsersBoard
      users={data}
      meta={meta}
      search={params.search ?? ""}
    />
  );
}
