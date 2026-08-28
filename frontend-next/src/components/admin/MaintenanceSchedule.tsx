"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, AlertTriangle, CheckCircle, Wrench, Plus, X } from "lucide-react";
import { Button, Card, Dialog, Input, Textarea, Select, useToast } from "@/components/admin/ExtendedUI";

interface MaintenanceItem {
  id?: string;
  toolId: string;
  toolCode: string;
  toolName: string;
  type: "PREVENTIVE" | "CORRECTIVE" | "INSPECTION";
  description: string;
  scheduledDate: string | null;
  performedDate?: string | null;
  cost?: number | null;
  vendor?: string | null;
  status?: "pending" | "completed" | "overdue";
}

interface MaintenanceScheduleProps {
  toolId: string;
  toolName: string;
  toolCode: string;
  maintenanceHistory: MaintenanceItem[];
  onSchedule?: (data: Partial<MaintenanceItem>) => Promise<void>;
  onComplete?: (id: string, data: { performedDate: string; cost?: number; vendor?: string }) => Promise<void>;
}

const MAINTENANCE_TYPES = [
  { value: "PREVENTIVE", label: "Pemeliharaan Rutin" },
  { value: "CORRECTIVE", label: "Perbaikan" },
  { value: "INSPECTION", label: "Inspeksi" },
];

export function MaintenanceSchedule({
  toolId,
  toolName,
  toolCode,
  maintenanceHistory,
  onSchedule,
  onComplete,
}: MaintenanceScheduleProps) {
  const { toast } = useToast();
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MaintenanceItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    type: "PREVENTIVE",
    description: "",
    scheduledDate: "",
  });

  const [completeForm, setCompleteForm] = useState({
    performedDate: new Date().toISOString().split("T")[0],
    cost: "",
    vendor: "",
  });

  const handleSchedule = async () => {
    if (!form.description.trim()) {
      toast("Deskripsi wajib diisi", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSchedule?.({
        toolId,
        type: form.type as MaintenanceItem["type"],
        description: form.description,
        scheduledDate: form.scheduledDate || null,
      });
      toast("Maintenance dijadwalkan", "success");
      setScheduleDialogOpen(false);
      setForm({ type: "PREVENTIVE", description: "", scheduledDate: "" });
    } catch {
      toast("Gagal menjadwalkan maintenance", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!selectedItem?.id) return;

    setIsSubmitting(true);
    try {
      await onComplete?.(selectedItem.id, {
        performedDate: completeForm.performedDate,
        cost: completeForm.cost ? parseFloat(completeForm.cost) : undefined,
        vendor: completeForm.vendor || undefined,
      });
      toast("Maintenance selesai", "success");
      setCompleteDialogOpen(false);
      setSelectedItem(null);
    } catch {
      toast("Gagal menyelesaikan maintenance", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (item: MaintenanceItem) => {
    if (item.performedDate || item.status === "completed") {
      return <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">Selesai</span>;
    }
    if (item.scheduledDate && new Date(item.scheduledDate) < new Date()) {
      return <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-xs text-rose-400">Terlambat</span>;
    }
    return <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">Terjadwal</span>;
  };

  const getTypeLabel = (type: string) => {
    return MAINTENANCE_TYPES.find((t) => t.value === type)?.label || type;
  };

  const upcomingItems = maintenanceHistory.filter(
    (item) => !item.performedDate && item.status !== "completed"
  );
  const completedItems = maintenanceHistory.filter(
    (item) => item.performedDate || item.status === "completed"
  );

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-400">Riwayat Maintenance</h3>
        <Button size="sm" onClick={() => setScheduleDialogOpen(true)}>
          <Plus size={14} /> Jadwalkan
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-full bg-amber-500/10 text-amber-400 mb-2">
            <AlertTriangle size={18} />
          </div>
          <p className="text-xl font-bold text-white">{upcomingItems.length}</p>
          <p className="text-xs text-slate-500">Terjadwal</p>
        </Card>

        <Card className="p-3 text-center">
          <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-full bg-rose-500/10 text-rose-400 mb-2">
            <Clock size={18} />
          </div>
          <p className="text-xl font-bold text-white">
            {upcomingItems.filter((i) => i.scheduledDate && new Date(i.scheduledDate) < new Date()).length}
          </p>
          <p className="text-xs text-slate-500">Terlambat</p>
        </Card>

        <Card className="p-3 text-center">
          <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mb-2">
            <CheckCircle size={18} />
          </div>
          <p className="text-xl font-bold text-white">{completedItems.length}</p>
          <p className="text-xs text-slate-500">Selesai</p>
        </Card>
      </div>

      {/* Maintenance List */}
      {maintenanceHistory.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
            <Wrench size={20} className="text-slate-500" />
          </div>
          <p className="text-slate-400">Belum ada riwayat maintenance</p>
          <Button size="sm" className="mt-3" onClick={() => setScheduleDialogOpen(true)}>
            <Plus size={14} /> Jadwalkan Pertama
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {/* Upcoming */}
          {upcomingItems.length > 0 && (
            <>
              <p className="text-xs font-medium text-slate-500">AKAN DATANG</p>
              {upcomingItems.map((item) => (
                <Card key={item.id || item.toolId} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        item.scheduledDate && new Date(item.scheduledDate) < new Date()
                          ? "bg-rose-500/10 text-rose-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}>
                        <Wrench size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{getTypeLabel(item.type)}</p>
                        <p className="text-xs text-slate-500">{item.description}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <Calendar size={10} className="text-slate-500" />
                          <span className="text-xs text-slate-500">
                            {item.scheduledDate ? formatDate(item.scheduledDate) : "Belum dijadwalkan"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(item)}
                      {item.id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedItem(item);
                            setCompleteDialogOpen(true);
                          }}
                        >
                          Selesai
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </>
          )}

          {/* Completed */}
          {completedItems.length > 0 && (
            <>
              <p className="text-xs font-medium text-slate-500 mt-4">RIWAYAT</p>
              {completedItems.slice(0, 5).map((item) => (
                <Card key={item.id || item.toolId} className="p-3 opacity-75">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                        <CheckCircle size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{getTypeLabel(item.type)}</p>
                        <p className="text-xs text-slate-500">{item.description}</p>
                        <div className="mt-1 flex items-center gap-3">
                          <span className="text-xs text-slate-500">
                            Selesai: {formatDate(item.performedDate || null)}
                          </span>
                          {item.cost && (
                            <span className="text-xs text-slate-500">
                              Rp {(item.cost as number).toLocaleString("id-ID")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(item)}
                  </div>
                </Card>
              ))}
            </>
          )}
        </div>
      )}

      {/* Schedule Dialog */}
      <Dialog
        open={scheduleDialogOpen}
        onClose={() => setScheduleDialogOpen(false)}
        title="Jadwalkan Maintenance"
        description={`${toolName} (${toolCode})`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setScheduleDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSchedule} loading={isSubmitting}>
              Jadwalkan
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select
            label="Jenis Maintenance"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            options={MAINTENANCE_TYPES}
          />

          <Input
            label="Tanggal Terjadwal"
            type="date"
            value={form.scheduledDate}
            onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
          />

          <Textarea
            label="Deskripsi *"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Deskripsi maintenance..."
            rows={3}
          />
        </div>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog
        open={completeDialogOpen}
        onClose={() => setCompleteDialogOpen(false)}
        title="Selesaikan Maintenance"
        description={selectedItem?.description}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCompleteDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleComplete} loading={isSubmitting}>
              Selesaikan
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Tanggal Selesai"
            type="date"
            value={completeForm.performedDate}
            onChange={(e) => setCompleteForm({ ...completeForm, performedDate: e.target.value })}
          />

          <Input
            label="Biaya (Rp)"
            type="number"
            value={completeForm.cost}
            onChange={(e) => setCompleteForm({ ...completeForm, cost: e.target.value })}
            placeholder="0"
          />

          <Input
            label="Vendor/ Teknisi"
            value={completeForm.vendor}
            onChange={(e) => setCompleteForm({ ...completeForm, vendor: e.target.value })}
            placeholder="Nama vendor atau teknisi"
          />
        </div>
      </Dialog>
    </div>
  );
}
