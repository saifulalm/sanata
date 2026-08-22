import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminRole, AdminApiError } from "@/lib/adminApi";
import { getLetters } from "@/lib/adminResources";
import { getSignatories } from "@/lib/adminSignatories.server";
import { ProjectHeader } from "@/components/admin/ProjectHeader";
import { LetterBoard } from "./LetterBoard";

export const metadata: Metadata = { title: "Surat-menyurat" };

export default async function LettersPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminRole("ADMIN", "EDITOR");
  const { id } = await params;

  let data: Awaited<ReturnType<typeof getLetters>>;
  try {
    data = await getLetters(id);
  } catch (err) {
    if (err instanceof AdminApiError && err.status === 404) notFound();
    throw err;
  }

  const { data: signatories } = await getSignatories({ isActive: "active" });

  return (
    <div className="space-y-6">
      <ProjectHeader
        rab={data.rab}
        title="Surat-menyurat"
        description="SPK, invoice, kwitansi, BAPP, dan BAST. Isinya terisi otomatis dari penawaran dan termin; nomor resmi diberikan saat surat diterbitkan."
      />
      <LetterBoard data={data} signatories={signatories} canIssue={session.role === "ADMIN"} />
    </div>
  );
}
