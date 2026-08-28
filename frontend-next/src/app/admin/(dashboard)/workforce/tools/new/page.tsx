"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Image as ImageIcon, Plus, X } from "lucide-react";
import { PageHeader } from "@/components/admin/ui";
import { Button, Card, Input, Select, Textarea, useToast } from "@/components/admin/ExtendedUI";
import { createTool, getAvailableWorkers } from "@/lib/workforceApi";
import type { ToolCondition, ToolOwner } from "@/lib/workforceApi";

const CATEGORIES = [
  { value: "measurement", label: "Pengukuran" },
  { value: "safety", label: "Keselamatan" },
  { value: "electrical", label: "Elektrik" },
  { value: "plumbing", label: "Plumbing" },
  { value: "carpentry", label: "Pertukangan Kayu" },
  { value: "masonry", label: "Pertukangan Batu" },
  { value: "welding", label: "Las" },
  { value: "cutting", label: "Pemotongan" },
  { value: "power_tool", label: "Power Tool" },
  { value: "hand_tool", label: "Hand Tool" },
  { value: "equipment", label: "Equipment" },
  { value: "general", label: "Umum" },
];

const CONDITIONS: { value: ToolCondition; label: string }[] = [
  { value: "GOOD", label: "Baik" },
  { value: "FAIR", label: "Cukup" },
  { value: "DAMAGED", label: "Rusak" },
  { value: "LOST", label: "Hilang" },
];

const OWNERS: { value: ToolOwner; label: string }[] = [
  { value: "COMPANY", label: "Perusahaan" },
  { value: "PERSONAL", label: "Pribadi" },
  { value: "RENTED", label: "Sewa" },
];

const TRADES = [
  { value: "", label: "Tidak ada" },
  { value: "masonry", label: "Tukang Batu" },
  { value: "carpentry", label: "Tukang Kayu" },
  { value: "welding", label: "Tukang Las" },
  { value: "electrical", label: "Teknisi Elektrik" },
  { value: "plumbing", label: "Tukang Ledeng" },
  { value: "general", label: "Umum" },
];

export default function NewToolPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "general",
    trade: "",
    brand: "",
    model: "",
    serialNumber: "",
    purchaseDate: "",
    warrantyExpiry: "",
    purchasePrice: "",
    minQuantity: "1",
    unit: "pcs",
    condition: "GOOD" as ToolCondition,
    owner: "COMPANY" as ToolOwner,
    needsMaintenance: false,
    maintenanceIntervalDays: "",
    currentLocation: "",
    notes: "",
    imageUrl: "",
  });

  const handleChange = (field: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast("Nama alat wajib diisi", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createTool({
        name: form.name,
        category: form.category,
        trade: form.trade || undefined,
        brand: form.brand || undefined,
        model: form.model || undefined,
        serialNumber: form.serialNumber || undefined,
        purchaseDate: form.purchaseDate ? new Date(form.purchaseDate).toISOString() : undefined,
        warrantyExpiry: form.warrantyExpiry ? new Date(form.warrantyExpiry).toISOString() : undefined,
        purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : undefined,
        minQuantity: parseInt(form.minQuantity) || 1,
        unit: form.unit,
        condition: form.condition,
        owner: form.owner,
        needsMaintenance: form.needsMaintenance,
        maintenanceIntervalDays: form.maintenanceIntervalDays ? parseInt(form.maintenanceIntervalDays) : undefined,
        currentLocation: form.currentLocation || undefined,
        notes: form.notes || undefined,
        imageUrl: form.imageUrl || undefined,
      });

      toast("Alat berhasil ditambahkan", "success");
      router.push(`/admin/workforce/tools/${result.id}`);
    } catch (error) {
      toast(String(error), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/workforce/tools"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition-colors hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-400"
        >
          <ArrowLeft size={20} />
        </Link>
        <PageHeader
          eyebrow="SANTRA"
          title="Alat Baru"
          description="Tambahkan alat ke inventory"
        />
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        {/* Basic Info */}
        <Card>
          <h3 className="text-sm font-medium text-slate-400 mb-4">Informasi Dasar</h3>
          <div className="space-y-4">
            <Input
              label="Nama Alat *"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Contoh: Waterpass 60cm"
              required
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Kategori"
                value={form.category}
                onChange={(e) => handleChange("category", e.target.value)}
                options={CATEGORIES}
              />

              <Select
                label="Spesialisasi (Trade)"
                value={form.trade}
                onChange={(e) => handleChange("trade", e.target.value)}
                options={TRADES}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Jumlah Minimum"
                type="number"
                min="1"
                value={form.minQuantity}
                onChange={(e) => handleChange("minQuantity", e.target.value)}
              />

              <Input
                label="Satuan"
                value={form.unit}
                onChange={(e) => handleChange("unit", e.target.value)}
                placeholder="pcs, unit, set"
              />
            </div>
          </div>
        </Card>

        {/* Specifications */}
        <Card>
          <h3 className="text-sm font-medium text-slate-400 mb-4">Spesifikasi</h3>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Merek (Brand)"
                value={form.brand}
                onChange={(e) => handleChange("brand", e.target.value)}
                placeholder="Contoh: Bosch, Makita"
              />

              <Input
                label="Model"
                value={form.model}
                onChange={(e) => handleChange("model", e.target.value)}
                placeholder="Contoh: GSL 2"
              />
            </div>

            <Input
              label="Nomor Seri (Serial Number)"
              value={form.serialNumber}
              onChange={(e) => handleChange("serialNumber", e.target.value)}
              placeholder="Contoh: SN-2024-001"
            />
          </div>
        </Card>

        {/* Purchase Info */}
        <Card>
          <h3 className="text-sm font-medium text-slate-400 mb-4">Informasi Pembelian</h3>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Tanggal Pembelian"
                type="date"
                value={form.purchaseDate}
                onChange={(e) => handleChange("purchaseDate", e.target.value)}
              />

              <Input
                label="Harga Beli (Rp)"
                type="number"
                value={form.purchasePrice}
                onChange={(e) => handleChange("purchasePrice", e.target.value)}
                placeholder="0"
              />

              <Input
                label="Masa Garansi"
                type="date"
                value={form.warrantyExpiry}
                onChange={(e) => handleChange("warrantyExpiry", e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Condition & Ownership */}
        <Card>
          <h3 className="text-sm font-medium text-slate-400 mb-4">Kondisi & Kepemilikan</h3>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Kondisi Awal"
                value={form.condition}
                onChange={(e) => handleChange("condition", e.target.value)}
                options={CONDITIONS}
              />

              <Select
                label="Kepemilikan"
                value={form.owner}
                onChange={(e) => handleChange("owner", e.target.value)}
                options={OWNERS}
              />
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
              <p className="text-xs text-slate-500 mb-2">Tips:</p>
              <ul className="text-xs text-slate-400 space-y-1">
                <li>• <strong>Perusahaan:</strong> Alat milik perusahaan yang bisa dipinjamkan</li>
                <li>• <strong>Pribadi:</strong> Alat milik pekerja yang didaftarkan</li>
                <li>• <strong>Sewa:</strong> Alat sewaan dari vendor</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Maintenance Settings */}
        <Card>
          <h3 className="text-sm font-medium text-slate-400 mb-4">Pengaturan Maintenance</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="needsMaintenance"
                checked={form.needsMaintenance}
                onChange={(e) => handleChange("needsMaintenance", e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500"
              />
              <label htmlFor="needsMaintenance" className="text-sm text-white">
                Butuh maintenance rutin
              </label>
            </div>

            {form.needsMaintenance && (
              <Input
                label="Interval Maintenance (hari)"
                type="number"
                min="1"
                value={form.maintenanceIntervalDays}
                onChange={(e) => handleChange("maintenanceIntervalDays", e.target.value)}
                placeholder="Contoh: 30"
              />
            )}

            <Input
              label="Lokasi Saat Ini"
              value={form.currentLocation}
              onChange={(e) => handleChange("currentLocation", e.target.value)}
              placeholder="Contoh: Gudang Utama, Lantai 2"
            />
          </div>
        </Card>

        {/* Notes */}
        <Card>
          <h3 className="text-sm font-medium text-slate-400 mb-4">Catatan</h3>
          <Textarea
            value={form.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            placeholder="Tambahkan catatan atau informasi tambahan..."
            rows={4}
          />
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/admin/workforce/tools">
            <Button variant="ghost" type="button">
              Batal
            </Button>
          </Link>
          <Button type="submit" loading={isSubmitting}>
            <Save size={16} />
            Simpan Alat
          </Button>
        </div>
      </form>
    </div>
  );
}
