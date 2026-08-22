import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminRole, AdminApiError } from "@/lib/adminApi";
import { getAllAhsp, getRabById } from "@/lib/adminResources";
import { ProjectTabs } from "@/components/admin/ProjectTabs";
import { RabEditor } from "../RabEditor";

export const metadata: Metadata = { title: "Detail RAB" };

export default async function RabDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminRole("ADMIN", "EDITOR");
  const { id } = await params;

  let rab: Awaited<ReturnType<typeof getRabById>>;
  let ahspOptions: Awaited<ReturnType<typeof getAllAhsp>>;
  try {
    [rab, ahspOptions] = await Promise.all([getRabById(id), getAllAhsp()]);
  } catch (err) {
    if (err instanceof AdminApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <div className="space-y-6">
      {/* Editor punya kepala halamannya sendiri, jadi yang ditambahkan di sini
          hanya tab agar berpindah ke berkas proyek lain tidak menuntut mundur
          dulu ke daftar RAB. */}
      <ProjectTabs rabId={rab.id} />
      <RabEditor rab={rab} ahspOptions={ahspOptions} />
    </div>
  );
}
