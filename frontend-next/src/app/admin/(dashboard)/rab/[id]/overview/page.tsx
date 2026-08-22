import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CalendarRange,
  ClipboardCheck,
  FileSignature,
  Inbox,
  NotebookPen,
  Send,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { requireAdminRole, AdminApiError } from "@/lib/adminApi";
import {
  getLetters,
  getLogbook,
  getMemos,
  getRabSchedule,
  getSubmissions,
  getWeeklyReports,
} from "@/lib/adminResources";
import { formatDate, formatRupiah } from "@/lib/format";
import {
  LETTER_TYPE_LABEL,
  SUBMISSION_STATUS_LABEL,
  SUBMISSION_STATUS_TONE,
  SUBMISSION_TYPE_LABEL,
} from "@/lib/projectDocs";
import { Badge, btn, EmptyState, ListRow, Panel } from "@/components/admin/ui";
import { StatCard } from "@/components/admin/StatCard";
import { ProjectHeader } from "@/components/admin/ProjectHeader";

export const metadata: Metadata = { title: "Ikhtisar Proyek" };

/**
 * Kokpit proyek.
 *
 * Panel admin sebelumnya memperlakukan RAB sebagai berkas anggaran, sehingga
 * setiap dimensi proyek — jadwal, laporan, surat — hanya bisa dilihat satu per
 * satu. Halaman ini membalik urutannya: yang ditampilkan lebih dulu adalah
 * keadaan proyek hari ini, dan yang ditonjolkan adalah hal-hal yang menuntut
 * tindakan — pengajuan menunggu keputusan, komplain lewat tenggat, invoice
 * jatuh tempo, kejadian berat yang belum ditutup. Angka yang baik-baik saja
 * tidak perlu berebut perhatian.
 */
export default async function ProjectOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminRole("ADMIN", "EDITOR");
  const { id } = await params;

  let schedule: Awaited<ReturnType<typeof getRabSchedule>>;
  let submissions: Awaited<ReturnType<typeof getSubmissions>>;
  let memos: Awaited<ReturnType<typeof getMemos>>;
  let letters: Awaited<ReturnType<typeof getLetters>>;
  let logbook: Awaited<ReturnType<typeof getLogbook>>;
  let weekly: Awaited<ReturnType<typeof getWeeklyReports>>;

  try {
    [schedule, submissions, memos, letters, logbook, weekly] = await Promise.all([
      getRabSchedule(id),
      getSubmissions({ rabId: id, page: 1 }),
      getMemos(id),
      getLetters(id),
      getLogbook(id),
      getWeeklyReports(id),
    ]);
  } catch (err) {
    if (err instanceof AdminApiError && err.status === 404) notFound();
    throw err;
  }

  const base = `/admin/rab/${id}`;
  const last = schedule.buckets.at(-1);
  const deviation = Number(last?.deviationPct ?? 0);
  const pendingSubmissions = submissions.data.filter((s) =>
    ["SUBMITTED", "APPROVED_INTERNAL", "FORWARDED_CLIENT"].includes(s.status)
  );
  const latestPeriod = weekly.periods.at(-1);

  return (
    <div className="space-y-6">
      <ProjectHeader
        rab={{ ...schedule.rab, clientName: memos.rab.clientName }}
        title="Ikhtisar Proyek"
        description="Keadaan proyek hari ini, dan hal-hal yang menunggu keputusan."
        actions={
          <Link href={`${base}/schedule`} className={btn("primary", "sm")}>
            <CalendarRange size={13} /> Buka jadwal
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Realisasi"
          value={`${last?.actualPct ?? "0"}%`}
          icon={<TrendingUp size={18} />}
          hint={`Rencana ${last?.plannedPct ?? "0"}% · deviasi ${last?.deviationPct ?? "0"}%`}
          href={`${base}/schedule`}
          tone={deviation < -5 ? "attention" : "default"}
        />
        <StatCard
          label="Nilai terpasang"
          value={`Rp ${formatRupiah(last?.actualValue ?? 0)}`}
          icon={<Wallet size={18} />}
          hint={`Nilai kontrak Rp ${formatRupiah(schedule.rab.subtotal)}`}
          href={`${base}/billings`}
        />
        <StatCard
          label="Sudah ditagih"
          value={`Rp ${formatRupiah(letters.summary.invoicedTotal)}`}
          icon={<FileSignature size={18} />}
          hint={`Lunas Rp ${formatRupiah(letters.summary.paidTotal)}`}
          href={`${base}/letters`}
        />
        <StatCard
          label="Jadwal"
          value={
            schedule.rab.scheduleEnd
              ? `${schedule.rab.totalWorkingDays} hari kerja`
              : "Belum dijadwalkan"
          }
          icon={<CalendarRange size={18} />}
          hint={
            schedule.rab.scheduleStart && schedule.rab.scheduleEnd
              ? `${formatDate(schedule.rab.scheduleStart)} – ${formatDate(schedule.rab.scheduleEnd)}`
              : "Isi tanggal mulai dan durasi item"
          }
          href={`${base}/schedule`}
        />
      </div>

      <AttentionStrip
        base={base}
        items={[
          { count: pendingSubmissions.length, label: "pengajuan menunggu keputusan", href: `${base}/submissions` },
          { count: memos.summary.overdue, label: "surat masuk lewat tenggat", href: `${base}/memos` },
          { count: letters.summary.overdueInvoices, label: "invoice jatuh tempo", href: `${base}/letters` },
          { count: logbook.summary.criticalOpen, label: "kejadian berat belum ditutup", href: `${base}/logbook` },
          { count: letters.summary.drafts, label: "surat masih draf", href: `${base}/letters` },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Pengajuan terbaru"
          description="Ajuan alat, material, dan waktu dari lapangan"
          actions={
            <Link href={`${base}/submissions`} className={btn("ghost", "sm")}>
              Semua <ArrowRight size={13} />
            </Link>
          }
        >
          {submissions.data.length === 0 ? (
            <EmptyState icon={<Send size={18} />} title="Belum ada pengajuan" />
          ) : (
            <div className="space-y-0.5">
              {submissions.data.slice(0, 5).map((item) => (
                <ListRow
                  key={item.id}
                  href={`${base}/submissions`}
                  primary={item.title}
                  secondary={`${SUBMISSION_TYPE_LABEL[item.type]} · ${item.number}`}
                  trailing={
                    <Badge tone={SUBMISSION_STATUS_TONE[item.status]}>{SUBMISSION_STATUS_LABEL[item.status]}</Badge>
                  }
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Site memo"
          description={`${memos.summary.incoming} masuk · ${memos.summary.outgoing} keluar`}
          actions={
            <Link href={`${base}/memos`} className={btn("ghost", "sm")}>
              Semua <ArrowRight size={13} />
            </Link>
          }
        >
          {memos.memos.length === 0 ? (
            <EmptyState icon={<Inbox size={18} />} title="Belum ada surat" />
          ) : (
            <div className="space-y-0.5">
              {memos.memos.slice(0, 5).map((memo) => (
                <ListRow
                  key={memo.id}
                  href={`${base}/memos`}
                  primary={memo.subject}
                  secondary={`${memo.number} · ${formatDate(memo.letterDate)} · ${memo.fromParty}`}
                  trailing={
                    memo.isOverdue ? (
                      <Badge tone="danger">lewat {memo.daysOverdue}h</Badge>
                    ) : (
                      <span>{memo.direction === "INCOMING" ? "masuk" : "keluar"}</span>
                    )
                  }
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Surat-menyurat"
          description="SPK, invoice, kwitansi, BAPP, BAST"
          actions={
            <Link href={`${base}/letters`} className={btn("ghost", "sm")}>
              Semua <ArrowRight size={13} />
            </Link>
          }
        >
          {letters.letters.length === 0 ? (
            <EmptyState icon={<FileSignature size={18} />} title="Belum ada surat" />
          ) : (
            <div className="space-y-0.5">
              {letters.letters.slice(0, 5).map((letter) => (
                <ListRow
                  key={letter.id}
                  href={`${base}/letters`}
                  primary={letter.subject}
                  secondary={`${LETTER_TYPE_LABEL[letter.type]} · ${letter.status === "DRAFT" ? "belum bernomor" : letter.number}`}
                  trailing={
                    Number(letter.totalAmount) > 0 ? <span>Rp {formatRupiah(letter.totalAmount)}</span> : null
                  }
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Pelaporan"
          description={
            latestPeriod
              ? `Periode terakhir: ${latestPeriod.label}`
              : "Belum ada laporan harian yang bisa direkap"
          }
          actions={
            <Link href={`${base}/reports`} className={btn("ghost", "sm")}>
              Rekap <ArrowRight size={13} />
            </Link>
          }
        >
          <div className="space-y-0.5">
            <ListRow
              href={`${base}/daily-reports`}
              primary="Laporan harian"
              secondary="Cuaca, tenaga kerja, kendala, dan foto per hari"
              trailing={<ClipboardCheck size={15} />}
            />
            <ListRow
              href={`${base}/reports`}
              primary="Laporan mingguan & bulanan"
              secondary={
                latestPeriod
                  ? `${latestPeriod.reportedDays}/${latestPeriod.calendarDays} hari terlapor · realisasi ${latestPeriod.cumulativePct}%`
                  : "Terisi otomatis dari laporan harian"
              }
              trailing={<ArrowRight size={15} />}
            />
            <ListRow
              href={`${base}/logbook`}
              primary="Logbook kejadian"
              secondary={`${logbook.summary.total} kejadian · ${logbook.summary.unresolved} belum selesai`}
              trailing={<NotebookPen size={15} />}
            />
          </div>
        </Panel>
      </div>
    </div>
  );
}

/** Deret hal yang menuntut tindakan. Yang bernilai nol tidak ditampilkan. */
function AttentionStrip({
  base,
  items,
}: {
  base: string;
  items: { count: number; label: string; href: string }[];
}) {
  const active = items.filter((item) => item.count > 0);
  if (active.length === 0) {
    return (
      <p className="rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.07] px-4 py-3 text-sm text-emerald-100">
        Tidak ada dokumen yang menunggu tindakan.{" "}
        <Link href={`${base}/schedule`} className="underline underline-offset-2">
          Lanjut ke jadwal
        </Link>
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {active.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-100 transition hover:bg-amber-500/[0.18]"
        >
          <AlertTriangle size={13} />
          <strong className="tabular-nums">{item.count}</strong> {item.label}
        </Link>
      ))}
    </div>
  );
}
