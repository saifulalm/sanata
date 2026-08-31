"use client";

import { use, useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import {
  getQcTemplate,
  updateQcTemplate,
  WBS_STAGES,
  type WbsStage,
  type QcTemplateItem,
} from "@/lib/workforceApi";
import { Badge, Button, Card, Toast, useToast } from "@/components/admin/ExtendedUI";

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditQcTemplatePage({ params }: Props) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    wbsStage: "PRE_CONSTRUCTION" as WbsStage,
    methodCode: "",
    description: "",
  });

  const [items, setItems] = useState<QcTemplateItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getQcTemplate(resolvedParams.id);
        setForm({
          name: data.name,
          wbsStage: data.wbsStage,
          methodCode: data.methodCode || "",
          description: data.description || "",
        });

        // Parse items from JSON string or array
        let parsedItems: QcTemplateItem[] = [];
        if (typeof data.items === "string") {
          try {
            parsedItems = JSON.parse(data.items);
          } catch {
            parsedItems = [];
          }
        } else if (Array.isArray(data.items)) {
          parsedItems = data.items as QcTemplateItem[];
        }
        setItems(parsedItems.length > 0 ? parsedItems : [{ itemDesc: "", criteria: "", tolerance: "", isMandatory: true, order: 1 }]);
      } catch {
        toast("Gagal memuat data", "error");
        router.push("/admin/workforce/qc-templates");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [resolvedParams.id]);

  const addItem = () => {
    setItems([...items, { itemDesc: "", criteria: "", tolerance: "", isMandatory: true, order: items.length + 1 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof QcTemplateItem, value: string | boolean) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Nama template wajib diisi";
    if (!form.wbsStage) e.wbsStage = "WBS Stage wajib dipilih";
    if (items.length === 0) e.items = "Minimal harus ada 1 checklist item";
    if (items.some((item) => !item.itemDesc.trim() || !item.criteria.trim())) {
      e.items = "Semua item harus memiliki deskripsi dan criteria";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    startTransition(async () => {
      try {
        const validItems = items.filter((item) => item.itemDesc.trim() && item.criteria.trim());

        const data = {
          name: form.name,
          wbsStage: form.wbsStage,
          methodCode: form.methodCode || undefined,
          description: form.description || undefined,
          items: validItems.map((item, index) => ({
            itemDesc: item.itemDesc,
            criteria: item.criteria,
            tolerance: item.tolerance || undefined,
            isMandatory: item.isMandatory,
            order: index + 1,
          })),
          isActive: true,
        };

        await updateQcTemplate(resolvedParams.id, data);
        toast("QC Template berhasil diperbarui", "success");
        router.push("/admin/workforce/qc-templates");
      } catch (err: any) {
        toast(err.message || "Gagal memperbarui template", "error");
      }
    });
  };

  const inputClass = (field: string) =>
    `w-full rounded-xl border ${errors[field] ? "border-rose-500" : "border-white/10"} bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/40 focus:outline-none`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/workforce/qc-templates"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition-colors hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-400"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Edit QC Template</h1>
          <p className="text-sm text-slate-400">{form.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Informasi Template</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                Nama Template *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., QC Pondasi Beton"
                className={inputClass("name")}
              />
              {errors.name && <p className="mt-1 text-xs text-rose-400">{errors.name}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">WBS Stage *</label>
              <select
                value={form.wbsStage}
                onChange={(e) => setForm({ ...form, wbsStage: e.target.value as WbsStage })}
                className={inputClass("wbsStage")}
              >
                {Object.entries(WBS_STAGES).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              {errors.wbsStage && <p className="mt-1 text-xs text-rose-400">{errors.wbsStage}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Method Code (opsional)</label>
              <input
                type="text"
                value={form.methodCode}
                onChange={(e) => setForm({ ...form, methodCode: e.target.value })}
                placeholder="e.g., STR-001"
                className={inputClass("methodCode")}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Deskripsi</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Deskripsi template..."
                rows={2}
                className={inputClass("description")}
              />
            </div>
          </div>
        </Card>

        {/* Checklist Items */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Checklist Items</h3>
            <Button type="button" variant="secondary" onClick={addItem}>
              <Plus size={16} />
              Tambah Item
            </Button>
          </div>

          {errors.items && (
            <p className="mb-4 text-xs text-rose-400">{errors.items}</p>
          )}

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex-1 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs text-slate-400">Item Description *</label>
                      <input
                        type="text"
                        value={item.itemDesc}
                        onChange={(e) => updateItem(index, "itemDesc", e.target.value)}
                        placeholder="e.g., Tebal struktur sesuai drawing"
                        className={inputClass("")}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-400">Tolerance</label>
                      <input
                        type="text"
                        value={item.tolerance || ""}
                        onChange={(e) => updateItem(index, "tolerance", e.target.value)}
                        placeholder="e.g., ±5mm"
                        className={inputClass("")}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">Criteria *</label>
                    <input
                      type="text"
                      value={item.criteria}
                      onChange={(e) => updateItem(index, "criteria", e.target.value)}
                      placeholder="e.g., 150mm ± 5mm"
                      className={inputClass("")}
                    />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-400">
                    <input
                      type="checkbox"
                      checked={item.isMandatory}
                      onChange={(e) => updateItem(index, "isMandatory", e.target.checked)}
                      className="h-4 w-4 rounded border-white/20 bg-white/5 text-cyan-500"
                    />
                    Mandatory
                  </label>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition-colors hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {items.length === 0 && (
            <button
              type="button"
              onClick={addItem}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/10 py-8 text-sm text-slate-400 transition-colors hover:border-cyan-400/30 hover:text-cyan-400"
            >
              <Plus size={16} />
              Tambah checklist item pertama
            </button>
          )}
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link
            href="/admin/workforce/qc-templates"
            className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-slate-400 transition-colors hover:border-white/20 hover:text-white"
          >
            Batal
          </Link>
          <Button type="submit" loading={isPending}>
            <Save size={16} />
            Simpan Perubahan
          </Button>
        </div>
      </form>
    </div>
  );
}
