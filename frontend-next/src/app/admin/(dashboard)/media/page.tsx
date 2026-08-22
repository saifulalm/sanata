import type { Metadata } from "next";
import { ImageIcon } from "lucide-react";
import { requireAdminRole } from "@/lib/adminApi";
import { getAdminMedia } from "@/lib/adminResources";
import { MediaLibrary } from "./MediaLibrary";

export const metadata: Metadata = { title: "Pustaka Media" };

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; type?: string }>;
}) {
  await requireAdminRole("ADMIN", "EDITOR");
  const params = await searchParams;

  const { data, meta } = await getAdminMedia({
    page: Number(params.page ?? 1),
    search: params.search,
    type: params.type,
  });

  return (
    <MediaLibrary
      items={data}
      meta={meta}
      search={params.search ?? ""}
      type={params.type ?? ""}
      emptyIcon={<ImageIcon size={22} />}
    />
  );
}
