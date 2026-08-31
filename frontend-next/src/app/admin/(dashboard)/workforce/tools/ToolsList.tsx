"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import {
  Wrench,
  Plus,
  Eye,
  Search,
  Package,
  Filter,
  ImageIcon,
  Clock,
  AlertTriangle,
  X,
} from "lucide-react";
import {
  getTools,
  getToolsEnhanced,
  getToolCategories,
  createTool,
  updateToolCondition,
  type MasterTool,
  type ToolCondition,
  type ToolCategory,
  type EnhancedTool,
} from "@/lib/workforceApi";
import { Badge, Button, Card, Dialog, EmptyState, Toast, useToast } from "@/components/admin/ExtendedUI";

const CONDITION_COLORS: Record<ToolCondition, string> = {
  GOOD: "text-emerald-400",
  FAIR: "text-amber-400",
  DAMAGED: "text-rose-400",
  LOST: "text-rose-400",
};

const CONDITION_LABELS: Record<ToolCondition, string> = {
  GOOD: "Baik",
  FAIR: "Cukup",
  DAMAGED: "Rusak",
  LOST: "Hilang",
};

const CATEGORY_LABELS: Record<string, string> = {
  measurement: "Alat Ukur",
  safety: "Keselamatan",
  electrical: "Elektrik",
  plumbing: "Plumbing",
  carpentry: "Pertukangan Kayu",
  masonry: "Pertukangan Batu",
  welding: "Las",
  cutting: "Pemotongan",
  power_tool: "Power Tool",
  hand_tool: "Hand Tool",
  equipment: "Equipment",
  consumable: "Habis Pakai",
  general: "Umum",
};

interface ToolsListProps {
  initialTools: MasterTool[];
  initialCategories: Array<{ value: string; label: string; count: number }>;
}

export function ToolsList({ initialTools, initialCategories }: ToolsListProps) {
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [tools, setTools] = useState<MasterTool[]>(initialTools);
  const [categories, setCategories] = useState<ToolCategory[]>(initialCategories);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState<ToolCondition | "">("");
  const [statusFilter, setStatusFilter] = useState<"all" | "available" | "borrowed" | "maintenance">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [condOpen, setCondOpen] = useState<MasterTool | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "general",
    trade: "",
    brand: "",
    model: "",
    notes: "",
  });
  const [cond, setCond] = useState<ToolCondition>("GOOD");

  // Fetch categories on mount - but don't fail if it errors
  useEffect(() => {
    // Use initial categories if available, otherwise try to fetch
    if (initialCategories.length > 0) {
      setCategories(initialCategories);
    }
    getToolCategories()
      .then(setCategories)
      .catch((err) => {
        console.error("[ToolsList] Failed to fetch categories:", err);
        // Keep using initial categories
      });
  }, [initialCategories]);

  // Track if we have initial data
  const hasInitialData = initialTools.length > 0;

  // Refresh tools when filters change - use initial data as fallback
  useEffect(() => {
    start(async () => {
      try {
        const result = await getToolsEnhanced({
          search: search || undefined,
          category: categoryFilter || undefined,
          condition: conditionFilter || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          page: 1,
          pageSize: 50,
        });
        setTools(result.data);
      } catch (err) {
        console.error("[ToolsList] Failed to fetch tools:", err);
        // Keep using initial data if available
        if (hasInitialData) {
          console.log("[ToolsList] Using initial tools data as fallback");
        } else {
          // Try simple list as last resort
          try {
            const simpleTools = await getTools({ status: statusFilter !== "all" ? statusFilter : undefined });
            setTools(simpleTools);
          } catch {
            // All attempts failed, show empty
            setTools([]);
          }
        }
      }
    });
  }, [search, categoryFilter, conditionFilter, statusFilter, hasInitialData]);

  const handleAdd = () => {
    if (!form.name.trim()) {
      toast("Nama wajib diisi", "warning");
      return;
    }
    start(async () => {
      try {
        const created = await createTool({
          name: form.name,
          category: form.category,
          trade: form.trade || undefined,
          notes: form.notes || undefined,
        });
        toast(`"${created.name}" ditambahkan`, "success");
        setTools((p) => [created, ...p]);
        setAddOpen(false);
        setForm({ name: "", category: "general", trade: "", brand: "", model: "", notes: "" });
      } catch (e) {
        toast(`Gagal: ${String(e)}`, "error");
      }
    });
  };

  const handleCond = () => {
    if (!condOpen) return;
    start(async () => {
      try {
        await updateToolCondition(condOpen.id, cond);
        toast(`Kondisi diupdate`, "success");
        setCondOpen(null);
        setTools((p) =>
          p.map((t) =>
            t.id === condOpen.id ? { ...t, currentCondition: cond } : t
          )
        );
      } catch {
        toast("Gagal update kondisi", "error");
      }
    });
  };

  const hasActiveFilters = categoryFilter || conditionFilter || statusFilter !== "all";

  const clearFilters = () => {
    setCategoryFilter("");
    setConditionFilter("");
    setStatusFilter("all");
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none"
            placeholder="Cari alat, kode, merek, model..."
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Button
          variant={showFilters ? "primary" : "ghost"}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} /> Filter
          {hasActiveFilters && (
            <span className="ml-1 rounded-full bg-cyan-500/20 px-1.5 py-0.5 text-xs">!</span>
          )}
        </Button>

        <Button onClick={() => setAddOpen(true)}>
          <Plus size={16} /> Tambah
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-slate-400">Filter</h4>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-cyan-400"
              >
                <X size={12} /> Clear
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            {/* Category Filter */}
            <div className="min-w-[150px]">
              <label className="mb-1.5 block text-xs text-slate-500">Kategori</label>
              <select
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">Semua</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label} ({cat.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Condition Filter */}
            <div className="min-w-[150px]">
              <label className="mb-1.5 block text-xs text-slate-500">Kondisi</label>
              <select
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value as ToolCondition | "")}
              >
                <option value="">Semua</option>
                <option value="GOOD">Baik</option>
                <option value="FAIR">Cukup</option>
                <option value="DAMAGED">Rusak</option>
                <option value="LOST">Hilang</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="min-w-[150px]">
              <label className="mb-1.5 block text-xs text-slate-500">Status</label>
              <select
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              >
                <option value="all">Semua</option>
                <option value="available">Tersedia</option>
                <option value="borrowed">Dipinjam</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Stats Bar */}
      <div className="flex items-center gap-4 text-sm text-slate-500">
        <span>Menampilkan {tools.length} alat</span>
        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <span>|</span>
            <span className="text-cyan-400">Filter aktif</span>
          </div>
        )}
      </div>

      {/* Tools Grid */}
      {tools.length === 0 ? (
        <EmptyState
          icon={<Wrench size={24} />}
          title={search || hasActiveFilters ? "Tidak ada hasil" : "Belum ada alat"}
          description={search || hasActiveFilters ? "Coba ubah filter pencarian" : "Tambahkan alat baru."}
          action={
            search || hasActiveFilters ? (
              <Button variant="ghost" onClick={clearFilters}>
                Reset Filter
              </Button>
            ) : (
              <Button onClick={() => setAddOpen(true)}>
                <Plus size={16} /> Tambah
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tools.map((tool) => (
            <Card className="overflow-hidden p-0" key={tool.id}>
              {/* Image or Placeholder */}
              <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900">
                {tool.imageUrl ? (
                  <img
                    src={tool.imageUrl}
                    alt={tool.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Wrench size={32} className="text-slate-700" />
                  </div>
                )}

                {/* Photo indicator */}
                {"photos" in tool && (tool as EnhancedTool).photos && (tool as EnhancedTool).photos!.length > 0 && (
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs text-white">
                    <ImageIcon size={10} /> {(tool as EnhancedTool).photos!.length}
                  </div>
                )}

                {/* Condition Badge */}
                <div className="absolute left-2 top-2">
                  <Badge
                    tone={
                      tool.currentCondition === "GOOD"
                        ? "success"
                        : tool.currentCondition === "FAIR"
                        ? "warning"
                        : "danger"
                    }
                  >
                    {CONDITION_LABELS[tool.currentCondition]}
                  </Badge>
                </div>

                {/* Borrowed indicator */}
                {"loans" in tool && (tool as EnhancedTool).loans && (tool as EnhancedTool).loans!.length > 0 && (
                  <div className="absolute right-2 top-2">
                    <div className="flex items-center gap-1 rounded-full bg-amber-500/80 px-2 py-1 text-xs text-white">
                      <Clock size={10} /> Dipinjam
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <p className="font-mono text-xs text-cyan-400">{tool.toolCode}</p>
                <h3 className="mt-1 font-medium text-white line-clamp-1">{tool.name}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {CATEGORY_LABELS[tool.category] || tool.category}
                  {tool.brand && ` · ${tool.brand}`}
                </p>

                {/* Additional info */}
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  {tool.currentLocation && (
                    <span className="truncate">{tool.currentLocation}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <button
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:border-cyan-400/30 hover:text-cyan-400"
                    onClick={() => {
                      setCondOpen(tool);
                      setCond(tool.currentCondition);
                    }}
                  >
                    Update
                  </button>
                  <Link
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition-colors hover:border-cyan-400/30 hover:text-cyan-400"
                    href={`/admin/workforce/tools/${tool.id}`}
                  >
                    <Eye size={14} />
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Tool Dialog */}
      <Dialog
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleAdd} loading={pending}>
              <Plus size={16} />
              Tambah
            </Button>
          </>
        }
        onClose={() => setAddOpen(false)}
        open={addOpen}
        title="Tambah Alat Baru"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs text-slate-400">
              Nama Alat *
            </label>
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-600"
              placeholder="Nama alat"
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs text-slate-400">
                Kategori
              </label>
              <select
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white"
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              >
                <option value="hand_tool">Hand Tool</option>
                <option value="power_tool">Power Tool</option>
                <option value="equipment">Equipment</option>
                <option value="measurement">Measurement</option>
                <option value="safety">Safety</option>
                <option value="consumable">Consumable</option>
                <option value="general">Umum</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-slate-400">
                Trade
              </label>
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-600"
                placeholder="contoh: steel"
                type="text"
                value={form.trade}
                onChange={(e) => setForm((p) => ({ ...p, trade: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs text-slate-400">
                Merek
              </label>
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-600"
                placeholder="Merek alat"
                type="text"
                value={form.brand}
                onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-slate-400">
                Model
              </label>
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-600"
                placeholder="Model alat"
                type="text"
                value={form.model}
                onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-slate-400">
              Catatan
            </label>
            <textarea
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 resize-none"
              placeholder="Catatan..."
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            />
          </div>
        </div>
      </Dialog>

      {/* Update Condition Dialog */}
      <Dialog
        footer={
          <>
            <Button variant="ghost" onClick={() => setCondOpen(null)}>
              Batal
            </Button>
            <Button onClick={handleCond} loading={pending}>
              Update
            </Button>
          </>
        }
        onClose={() => setCondOpen(null)}
        open={!!condOpen}
        title={condOpen?.name || ""}
      >
        <div className="space-y-2">
          <p className="text-sm text-slate-400">Kondisi baru:</p>
          <div className="grid grid-cols-2 gap-2">
            {(["GOOD", "FAIR", "DAMAGED", "LOST"] as ToolCondition[]).map((c) => (
              <button
                key={c}
                onClick={() => setCond(c)}
                className={`rounded-xl border p-3 text-left transition-all ${
                  cond === c
                    ? "border-cyan-400/50 bg-cyan-500/10"
                    : "border-white/10 bg-white/5 hover:border-white/18"
                }`}
              >
                <p className={`text-sm font-medium ${CONDITION_COLORS[c]}`}>
                  {c === "GOOD"
                    ? "Baik"
                    : c === "FAIR"
                    ? "Cukup"
                    : "Rusak/Hilang"}
                </p>
              </button>
            ))}
          </div>
        </div>
      </Dialog>
    </div>
  );
}
