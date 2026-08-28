import { notFound } from "next/navigation";
import { getQcRecord } from "@/lib/workforceApi.server";
import { QcDetailClient } from "@/app/admin/(dashboard)/workforce/qc/[id]/QcDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Detail QC - SANTRA",
};

export default async function QcDetailPage({ params }: Props) {
  const { id } = await params;

  let record;
  try {
    record = await getQcRecord(id);
  } catch {
    notFound();
  }

  return <QcDetailClient record={record} />;
}
