import type { Metadata } from "next";
import Link from "next/link";
import { Send } from "lucide-react";
import { requireAdminRole } from "@/lib/adminApi";
import { getSubmissions } from "@/lib/adminResources";
import { formatDate, formatRupiah } from "@/lib/format";
import {
  SUBMISSION_STATUS_LABEL,
  SUBMISSION_STATUS_TONE,
  SUBMISSION_TYPE_LABEL,
  type SubmissionStatus,
  type SubmissionType,
} from "@/lib/projectDocs";
import { Badge, btn, EmptyState, PageHeader, Panel, Td, Th, TableWrap, Toolbar, Tr } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Pengajuan" };

/**
 * Kotak masuk pengajuan lintas proyek.
 *
 * Halaman per-proyek menjawab "apa saja pengajuan proyek ini". Atasan justru
 * punya pertanyaan sebaliknya — "apa yang menunggu keputusan saya hari ini" —
 * dan jawabannya tersebar di banyak proyek. Karena itu bawaan halaman ini
 * adalah yang menunggu diperiksa, bukan seluruh riwayat.
 */
const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Semua" },
  { value: "SUBMITTED", label: "Menunggu atasan" },
  { value: "APPROVED_INTERNAL", label: "Disetujui atasan" },
  { value: "FORWARDED_CLIENT", label: "Menunggu klien" },
  { value: "APPROVED_CLIENT", label: "Disetujui klien" },
  { value: "REJECTED", label: "Ditolak" },
];

const TYPE_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Semua jenis" },
  { value: "ALAT", label: "Alat" },
  { value: "MATERIAL", label: "Material" },
  { value: "WAKTU", label: "Waktu" },
  { value: "RENCANA_WAKTU", label: "Rencana waktu" },
];

export default async function AllSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; page?: string }>;
}) {
  await requireAdminRole("ADMIN", "EDITOR");
  const query = await searchParams;
  const status = query.status ?? "";
  const type = query.type ?? "";

  const { data, meta } = await getSubmissions({
    page: Number(query.page) || 1,
    ...(status ? { status } : {}),
    ...(type ? { type } : {}),
  });

  const buildHref = (next: { status?: string; type?: string }) => {
    const params = new URLSearchParams();
    const nextStatus = next.status ?? status;
    const nextType = next.type ?? type;
    if (nextStatus) params.set("status", nextStatus);
    if (nextType) params.set("type", nextType);
    const qs = params.toString();
    return qs ? `/admin/submissions?${qs}` : "/admin/submissions";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dokumen Proyek"
        title="Pengajuan"
        description="Ajuan alat, material, dan waktu dari seluruh proyek — disaring menurut tahap persetujuannya."
      />

      <Toolbar>
        {STATUS_FILTERS.map((filter) => (
          <Link
            key={filter.value || "all"}
            href={buildHref({ status: filter.value })}
            className={btn(status === filter.value ? "primary" : "ghost", "sm")}
          >
            {filter.label}
          </Link>
        ))}
        <span className="ml-auto" />
        {TYPE_FILTERS.map((filter) => (
          <Link
            key={filter.value || "all-types"}
            href={buildHref({ type: filter.value })}
            className={btn(type === filter.value ? "secondary" : "ghost", "sm")}
          >
            {filter.label}
          </Link>
        ))}
      </Toolbar>

      {data.length === 0 ? (
        <EmptyState
          icon={<Send size={20} />}
          title="Tidak ada pengajuan pada saringan ini"
          description="Pengajuan dibuat dari halaman proyek masing-masing, di tab Pengajuan."
        />
      ) : (
        <Panel padded={false}>
          <TableWrap>
            <thead>
              <tr>
                <Th>Nomor</Th>
                <Th>Proyek</Th>
                <Th>Jenis</Th>
                <Th>Perihal</Th>
                <Th>Dibutuhkan</Th>
                <Th className="text-right">Nilai / durasi</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <Tr key={item.id}>
                  <Td className="font-mono text-xs text-slate-300">{item.number}</Td>
                  <Td>
                    <Link
                      href={`/admin/rab/${item.rabId}/submissions`}
                      className="text-sm text-cyan-200 hover:text-cyan-100"
                    >
                      {item.rab.number}
                    </Link>
                    <p className="truncate text-xs text-slate-500">{item.rab.title}</p>
                  </Td>
                  <Td className="text-xs">{SUBMISSION_TYPE_LABEL[item.type as SubmissionType]}</Td>
                  <Td>
                    <p className="font-medium text-white">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.requestedByName}</p>
                  </Td>
                  <Td className="whitespace-nowrap text-xs">
                    {item.neededDate ? formatDate(item.neededDate) : "—"}
                    {item.isOverdue && <span className="ml-1.5 font-semibold text-amber-300">lewat</span>}
                  </Td>
                  <Td className="text-right tabular-nums">
                    {item.type === "WAKTU"
                      ? `${item.requestedDays ?? 0} hari`
                      : `Rp ${formatRupiah(item.estimatedCost)}`}
                  </Td>
                  <Td>
                    <Badge tone={SUBMISSION_STATUS_TONE[item.status as SubmissionStatus]}>
                      {SUBMISSION_STATUS_LABEL[item.status as SubmissionStatus]}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        </Panel>
      )}

      {meta.totalPages > 1 && (
        <p className="text-xs text-slate-500">
          Halaman {meta.page} dari {meta.totalPages} · {meta.total} pengajuan
        </p>
      )}
    </div>
  );
}
