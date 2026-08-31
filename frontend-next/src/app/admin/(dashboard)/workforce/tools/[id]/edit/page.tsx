"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Image as ImageIcon, Upload, X, Plus } from "lucide-react";
import { PageHeader } from "@/components/admin/ui";
import { Button, Card, Input, Select, Textarea, useToast } from "@/components/admin/ExtendedUI";
import { getTool, updateTool, updateToolCondition, getToolPhotos, addToolPhoto, deleteToolPhoto, setPrimaryPhoto } from "@/lib/workforceApi";
import type { MasterTool, ToolCondition, ToolPhoto } from "@/lib/workforceApi";
import { PhotoGallery } from "@/components/admin/PhotoGallery";

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

const CONDITIONS: { value: ToolCondition; label: string; color: string }[] = [
  { value: "GOOD", label: "Baik", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  { value: "FAIR", label: "Cukup", color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  { value: "DAMAGED", label: "Rusak", color: "bg-rose-500/10 text-rose-400 border-rose-500/30" },
  { value: "LOST", label: "Hilang", color: "bg-rose-500/10 text-rose-400 border-rose-500/30" },
];

const OWNERS = [
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

export default function EditToolPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const toolId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [tool, setTool] = useState<MasterTool | null>(null);
  const [photos, setPhotos] = useState<ToolPhoto[]>([]);
  const [photoUrlDialog, setPhotoUrlDialog] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");

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
    owner: "COMPANY",
    needsMaintenance: false,
    maintenanceIntervalDays: "",
    currentLocation: "",
    notes: "",
  });

  useEffect(() => {
    async function fetchTool() {
      try {
        const [data, photosData] = await Promise.all([
          getTool(toolId),
          getToolPhotos(toolId).catch(() => []),
        ]);
        setTool(data);
        setPhotos(photosData);
        setForm({
          name: data.name,
          category: data.category,
          trade: data.trade || "",
          brand: data.brand || "",
          model: data.model || "",
          serialNumber: data.serialNumber || "",
          purchaseDate: data.purchaseDate ? data.purchaseDate.split("T")[0] : "",
          warrantyExpiry: data.warrantyExpiry ? data.warrantyExpiry.split("T")[0] : "",
          purchasePrice: data.purchasePrice ? String(data.purchasePrice) : "",
          minQuantity: String(data.minQuantity),
          unit: data.unit,
          owner: data.owner,
          needsMaintenance: data.needsMaintenance || false,
          maintenanceIntervalDays: data.maintenanceIntervalDays ? String(data.maintenanceIntervalDays) : "",
          currentLocation: data.currentLocation || "",
          notes: data.notes || "",
        });
      } catch (error) {
        toast("Gagal memuat data alat", "error");
        router.push("/admin/workforce/tools");
      } finally {
        setIsLoading(false);
      }
    }
    fetchTool();
  }, [toolId, toast, router]);

  const handleChange = (field: string, value: string | boolean | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast("Nama alat wajib diisi", "warning");
      return;
    }

    setIsSaving(true);
    try {
      await updateTool(toolId, {
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
        owner: form.owner as any,
        needsMaintenance: form.needsMaintenance,
        maintenanceIntervalDays: form.maintenanceIntervalDays ? parseInt(form.maintenanceIntervalDays) : undefined,
        currentLocation: form.currentLocation || undefined,
        notes: form.notes || undefined,
      });

      toast("Alat berhasil diperbarui", "success");
      router.push(`/admin/workforce/tools/${toolId}`);
    } catch (error) {
      toast(String(error), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConditionChange = async (condition: ToolCondition) => {
    try {
      await updateToolCondition(toolId, condition);
      setTool(prev => prev ? { ...prev, currentCondition: condition } : null);
      toast("Kondisi alat diperbarui", "success");
    } catch (error) {
      toast(String(error), "error");
    }
  };

  const handleAddPhoto = async () => {
    if (!newPhotoUrl.trim()) {
      toast("URL foto wajib diisi", "warning");
      return;
    }

    try {
      const photo = await addToolPhoto(toolId, {
        url: newPhotoUrl,
        isPrimary: photos.length === 0,
      });
      setPhotos(prev => [...prev, photo]);
      setNewPhotoUrl("");
      setPhotoUrlDialog(false);
      toast("Foto ditambahkan", "success");
    } catch (error) {
      toast("Gagal menambahkan foto", "error");
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await deleteToolPhoto(toolId, photoId);
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      toast("Foto dihapus", "success");
    } catch (error) {
      toast("Gagal menghapus foto", "error");
    }
  };

  const handleSetPrimary = async (photoId: string) => {
    try {
      await setPrimaryPhoto(toolId, photoId);
      setPhotos(prev => prev.map(p => ({ ...p, isPrimary: p.id === photoId })));
      toast("Foto utama diperbarui", "success");
    } catch (error) {
      toast("Gagal mengubah foto utama", "error");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!tool) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/workforce/tools/${toolId}`}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition-colors hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-400"
        >
          <ArrowLeft size={20} />
        </Link>
        <PageHeader
          eyebrow="SANTRA"
          title="Edit Alat"
          description={`${tool.name} (${tool.toolCode})`}
        />
      </div>

      <form onSubmit={handleSave} className="max-w-3xl space-y-6">
        {/* Photos */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-400">Foto Alat</h3>
            <Button size="sm" variant="ghost" onClick={() => setPhotoUrlDialog(true)}>
              <Plus size={14} /> Tambah Foto
            </Button>
          </div>
          <PhotoGallery
            photos={photos}
            toolName={tool.name}
            editable={true}
            onDelete={handleDeletePhoto}
            onSetPrimary={handleSetPrimary}
          />
        </Card>

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
            <div>
              <label className="mb-2 block text-xs text-slate-500">Kondisi Saat Ini</label>
              <div className="grid grid-cols-2 gap-2">
                {CONDITIONS.map(({ value, label, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleConditionChange(value)}
                    className={`rounded-xl border p-4 text-left transition ${
                      tool.currentCondition === value
                        ? `${color} border-current`
                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}
                  >
                    <p className={`text-sm font-medium ${tool.currentCondition === value ? "" : "text-white"}`}>
                      {label}
                    </p>
                    {tool.currentCondition === value && (
                      <p className="mt-1 text-xs opacity-60">Kondisi saat ini</p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <Select
              label="Kepemilikan"
              value={form.owner}
              onChange={(e) => handleChange("owner", e.target.value)}
              options={OWNERS}
            />
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
          <Link href={`/admin/workforce/tools/${toolId}`}>
            <Button variant="ghost" type="button">
              Batal
            </Button>
          </Link>
          <Button type="submit" loading={isSaving}>
            <Save size={16} />
            Simpan Perubahan
          </Button>
        </div>
      </form>

      {/* Add Photo URL Dialog */}
      {photoUrlDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white">Tambah Foto</h3>
              <button onClick={() => setPhotoUrlDialog(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <Input
                label="URL Foto"
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
                placeholder="https://..."
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setPhotoUrlDialog(false)}>
                  Batal
                </Button>
                <Button onClick={handleAddPhoto}>
                  Tambah
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
