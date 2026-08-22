"use client";

import { useState, useTransition, Fragment } from "react";
import { AlertTriangle, CalendarDays, CloudRain, Download, FileStack, Users } from "lucide-react";
import type { PeriodicReportData, PeriodSummary } from "@/lib/projectDocs";
import { formatDate, formatRupiah } from "@/lib/format";
import { Badge, btn, EmptyState, Panel, Td, Th, TableWrap, Toolbar, Tr } from "@/components/admin/ui";
import { exportMonthlyCsvAction, exportWeeklyCsvAction } from "../documents/actions";

type Mode = "weekly" | "monthly";

/**
 * Laporan mingguan dan bulanan.
 *
 * Keduanya memakai tampilan yang sama karena isinya memang sama — yang berbeda
 * hanya panjang periodenya. Satu komponen dengan sakelar periode juga membuat
 * angka mingguan dan bulanan tampil dalam susunan yang persis sama, sehingga
 * bisa disandingkan tanpa harus dibaca ulang dari awal.
 */
export function PeriodicReportBoard({
  rabId,
  weekly,
  monthly,
}: {
  rabId: string;
  weekly: PeriodicReportData;
  monthly: PeriodicReportData;
}) {
  const [mode, setMode] = useState<Mode>("weekly");
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const data = mode === "weekly" ? weekly : monthly;

  const download = () => {
    setError("");
    startTransition(async () => {
      const result = await (mode === "weekly" ? exportWeeklyCsvAction(rabId) : exportMonthlyCsvAction(rabId));
      if (!result.ok || !result.csv) return setError(result.message ?? "Gagal mengunduh laporan");

      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename ?? "laporan.csv";
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="space-y-4">
      <Toolbar>
        <button type="button" onClick={() => setMode("weekly")} className={btn(mode === "weekly" ? "primary" : "ghost", "sm")}>
          Mingguan
        </button>
        <button
          type="button"
          onClick={() => setMode("monthly")}
          className={btn(mode === "monthly" ? "primary" : "ghost", "sm")}
        >
          Bulanan
        </button>
        <span className="ml-auto" />
        <button type="button" onClick={download} disabled={isPending} className={btn("secondary", "sm")}>
          <Download size={13} /> Unduh CSV
        </button>
      </Toolbar>

      {error && (
        <p className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">{error}</p>
      )}

      {data.periods.length === 0 ? (
        <EmptyState
          icon={<FileStack size={20} />}
          title="Belum ada periode untuk direkap"
          description="Laporan mingguan dan bulanan disusun otomatis dari laporan harian dan opname yang sudah disetujui. Isi keduanya lebih dulu."
        />
      ) : (
        <Panel padded={false}>
          <TableWrap>
            <thead>
              <tr>
                <Th>Periode</Th>
                <Th className="text-right">Hari lapor</Th>
                <Th className="text-right">Tenaga kerja</Th>
                <Th className="text-right">Rencana</Th>
                <Th className="text-right">Realisasi</Th>
                <Th className="text-right">Deviasi</Th>
                <Th className="text-right">Nilai terpasang</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {data.periods.map((period) => {
                const deviation = Number(period.deviationPct);
                const isOpen = openKey === period.key;

                return (
                  <Fragment key={period.key}>
                    <Tr>
                      <Td>
                        <p className="font-medium text-white">{period.label}</p>
                        <p className="text-xs text-slate-500">
                          {formatDate(period.startDate)} – {formatDate(period.endDate)}
                        </p>
                      </Td>
                      <Td className="text-right tabular-nums">
                        {period.reportedDays}/{period.calendarDays}
                        {period.missingDates.length > 0 && (
                          <span className="block text-[11px] text-amber-300">
                            {period.missingDates.length} hari tanpa laporan
                          </span>
                        )}
                      </Td>
                      <Td className="text-right tabular-nums">
                        {period.averageWorkforce}
                        <span className="block text-[11px] text-slate-500">puncak {period.peakWorkforce}</span>
                      </Td>
                      <Td className="text-right tabular-nums text-slate-300">{period.plannedPct}%</Td>
                      <Td className="text-right tabular-nums text-white">{period.cumulativePct}%</Td>
                      <Td className="text-right tabular-nums">
                        <Badge tone={deviation < -1 ? "danger" : deviation > 0 ? "success" : "neutral"}>
                          {deviation > 0 ? "+" : ""}
                          {period.deviationPct}%
                        </Badge>
                      </Td>
                      <Td className="text-right tabular-nums">Rp {formatRupiah(period.cumulativeValue)}</Td>
                      <Td className="text-right">
                        <button
                          type="button"
                          onClick={() => setOpenKey(isOpen ? null : period.key)}
                          className={btn("ghost", "sm")}
                        >
                          {isOpen ? "Tutup" : "Rincian"}
                        </button>
                      </Td>
                    </Tr>

                    {isOpen && (
                      <tr key={`${period.key}-detail`}>
                        <td colSpan={8} className="border-b border-white/[0.05] bg-white/[0.02] px-4 py-5">
                          <PeriodDetail period={period} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </TableWrap>
        </Panel>
      )}
    </div>
  );
}

function PeriodDetail({ period }: { period: PeriodSummary }) {
  const weather = Object.entries(period.weatherTally);

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="space-y-3">
        <Stat icon={<CalendarDays size={14} />} label="Progres periode ini" value={`${period.progressPct}%`} />
        <Stat
          icon={<Users size={14} />}
          label="Rata-rata tenaga kerja"
          value={`${period.averageWorkforce} orang/hari`}
        />
        <Stat icon={<CloudRain size={14} />} label="Cuaca" value={weather.length > 0 ? weather.map(([k, v]) => `${k} ${v}×`).join(", ") : "Tidak dicatat"} />
        {period.missingDates.length > 0 && (
          <Stat
            icon={<AlertTriangle size={14} />}
            label="Hari tanpa laporan harian"
            value={period.missingDates.map((d) => formatDate(d)).join(", ")}
            tone="warning"
          />
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Pekerjaan</p>
        {period.activities.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada laporan harian pada periode ini.</p>
        ) : (
          <ul className="space-y-2 text-sm text-slate-300">
            {period.activities.map((item) => (
              <li key={item.date}>
                <span className="text-xs text-slate-500">{formatDate(item.date)}</span>
                <p className="whitespace-pre-line">{item.text}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Kendala</p>
          {period.obstacles.length === 0 ? (
            <p className="text-sm text-slate-500">Tidak ada kendala tercatat.</p>
          ) : (
            <ul className="space-y-2 text-sm text-amber-100/90">
              {period.obstacles.map((item) => (
                <li key={item.date}>
                  <span className="text-xs text-slate-500">{formatDate(item.date)}</span>
                  <p className="whitespace-pre-line">{item.text}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {period.criticalLogbook.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Kejadian berat di logbook
            </p>
            <ul className="space-y-1 text-sm text-red-200">
              {period.criticalLogbook.map((item, index) => (
                <li key={`${item.date}-${index}`}>
                  <span className="text-xs text-slate-500">{formatDate(item.date)}</span> — {item.title}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "default" | "warning";
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        {icon} {label}
      </p>
      <p className={`mt-0.5 text-sm ${tone === "warning" ? "text-amber-200" : "text-slate-200"}`}>{value}</p>
    </div>
  );
}
