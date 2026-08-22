import type { ReactNode } from "react";
import { PageHeader } from "@/components/admin/ui";
import { ProjectTabs } from "@/components/admin/ProjectTabs";

/**
 * Kepala halaman yang sama untuk setiap berkas proyek.
 *
 * Nomor dan nama proyek selalu terlihat karena satu panel admin melayani banyak
 * proyek sekaligus, dan dokumen yang tercatat di proyek yang salah adalah jenis
 * kekeliruan yang baru ketahuan setelah suratnya terkirim.
 */
export function ProjectHeader({
  rab,
  title,
  description,
  eyebrow,
  actions,
}: {
  rab: { id: string; number: string; title: string; clientName?: string | null };
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={eyebrow ?? `${rab.number} · ${rab.title}${rab.clientName ? ` · ${rab.clientName}` : ""}`}
        title={title}
        description={description}
        actions={actions}
      />
      <ProjectTabs rabId={rab.id} />
    </div>
  );
}
