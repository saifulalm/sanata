import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Boxes, Calculator, HardHat, Package } from "lucide-react";
import { requireAdminRole, AdminApiError } from "@/lib/adminApi";
import { getRabTakeoff } from "@/lib/adminResources";
import { RESOURCE_TYPE_LABEL, type ResourceType } from "@/lib/estimation";
import { formatNumber, formatRupiah } from "@/lib/format";
import { Badge, EmptyState, Panel, Td, Th, TableWrap, Tr, type BadgeTone } from "@/components/admin/ui";
import { ProjectHeader } from "@/components/admin/ProjectHeader";
import { StatCard } from "@/components/admin/StatCard";
import { DownloadTakeoffButton } from "./DownloadTakeoffButton";

export const metadata: Metadata = { title: "Kebutuhan Sumber Daya" };

const TYPE_TONE: Record<ResourceType, BadgeTone> = {
  LABOR: "info",
  MATERIAL: "success",
  EQUIPMENT: "warning",
};

export default async function RabTakeoffPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminRole("ADMIN", "EDITOR");
  const { id } = await params;

  let takeoff: Awaited<ReturnType<typeof getRabTakeoff>>;
  try {
    takeoff = await getRabTakeoff(id);
  } catch (err) {
    if (err instanceof AdminApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <div className="space-y-6">
      <ProjectHeader
        rab={takeoff.rab}
        title="Kebutuhan Sumber Daya"
        description="Volume pekerjaan diurai kembali menjadi kebutuhan upah, bahan, dan alat lewat koefisien AHSP."
        actions={<DownloadTakeoffButton rabId={takeoff.rab.id} />}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Upah"
          value={`Rp ${formatRupiah(takeoff.composition.labor)}`}
          icon={<HardHat size={18} />}
          hint={`${formatNumber(takeoff.composition.laborPct, 1)}% biaya langsung`}
        />
        <StatCard
          label="Bahan"
          value={`Rp ${formatRupiah(takeoff.composition.material)}`}
          icon={<Package size={18} />}
          hint={`${formatNumber(takeoff.composition.materialPct, 1)}% biaya langsung`}
        />
        <StatCard
          label="Alat"
          value={`Rp ${formatRupiah(takeoff.composition.equipment)}`}
          icon={<Calculator size={18} />}
          hint={`${formatNumber(takeoff.composition.equipmentPct, 1)}% biaya langsung`}
        />
        <StatCard
          label="Total biaya langsung"
          value={`Rp ${formatRupiah(takeoff.composition.directTotal)}`}
          icon={<Boxes size={18} />}
          hint={`Nilai RAB Rp ${formatRupiah(takeoff.rab.total)}`}
        />
      </div>

      <Panel padded={false}>
        {takeoff.lines.length > 0 ? (
          <TableWrap>
            <thead>
              <tr>
                <Th>Kode</Th>
                <Th>Sumber daya</Th>
                <Th>Jenis</Th>
                <Th className="text-right">Kuantitas</Th>
                <Th>Satuan</Th>
                <Th className="text-right">Harga satuan</Th>
                <Th className="text-right">Jumlah</Th>
              </tr>
            </thead>
            <tbody>
              {takeoff.lines.map((line) => (
                <Tr key={line.priceItemId}>
                  <Td className="whitespace-nowrap font-mono text-xs text-slate-400">{line.code}</Td>
                  <Td>
                    <p className="font-medium text-white">{line.name}</p>
                    <div className="mt-1 space-y-0.5 text-xs text-slate-500">
                      {line.usedIn.slice(0, 3).map((usage, index) => (
                        <p key={`${line.priceItemId}-${index}`}>
                          {usage.description} · {formatNumber(usage.volume, 3)} × {formatNumber(usage.coefficient, 4)} ={" "}
                          {formatNumber(usage.subtotal, 4)}
                        </p>
                      ))}
                      {line.usedIn.length > 3 && <p>+{line.usedIn.length - 3} pekerjaan lainnya</p>}
                    </div>
                  </Td>
                  <Td>
                    <Badge tone={TYPE_TONE[line.type]}>{RESOURCE_TYPE_LABEL[line.type]}</Badge>
                  </Td>
                  <Td className="whitespace-nowrap text-right tabular-nums">{formatNumber(line.quantity, 4)}</Td>
                  <Td className="text-slate-400">{line.unit}</Td>
                  <Td className="whitespace-nowrap text-right tabular-nums text-slate-400">
                    Rp {formatRupiah(line.unitPrice)}
                  </Td>
                  <Td className="whitespace-nowrap text-right font-semibold tabular-nums text-white">
                    Rp {formatRupiah(line.amount)}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        ) : (
          <div className="p-5">
            <EmptyState
              icon={<Boxes size={20} />}
              title="Belum ada item berbasis AHSP"
              description="Item RAB yang dipilih dari AHSP bisa diurai menjadi kebutuhan sumber daya."
            />
          </div>
        )}
      </Panel>

      {takeoff.unresolved.length > 0 && (
        <Panel
          title="Item manual tanpa AHSP"
          description="Tetap masuk nilai RAB, tetapi belum bisa diurai menjadi kebutuhan upah, bahan, atau alat."
          padded={false}
        >
          <TableWrap>
            <thead>
              <tr>
                <Th>Uraian</Th>
                <Th className="text-right">Volume</Th>
                <Th>Satuan</Th>
                <Th className="text-right">Jumlah</Th>
              </tr>
            </thead>
            <tbody>
              {takeoff.unresolved.map((item, index) => (
                <Tr key={`${item.description}-${index}`}>
                  <Td>{item.description}</Td>
                  <Td className="text-right tabular-nums">{formatNumber(item.volume, 3)}</Td>
                  <Td className="text-slate-400">{item.unit}</Td>
                  <Td className="text-right font-medium tabular-nums text-white">Rp {formatRupiah(item.amount)}</Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        </Panel>
      )}
    </div>
  );
}
