"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Trash2,
  ClipboardList,
  FileText,
  AlertTriangle,
} from "lucide-react";
import {
  getQcTemplate,
  deleteQcTemplate,
  WBS_STAGES,
  type WbsStage,
  type QcTemplate,
  type QcTemplateItem,
} from "@/lib/workforceApi";
import {
  Badge,
  Button,
  Card,
  Dialog,
  Toast,
  useToast,
} from "@/components/admin/ExtendedUI";

interface Props {
  params: Promise<{ id: string }>;
}

export default function QcTemplateDetailPage({ params }: Props) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [data, setData] = useState<QcTemplate | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getQcTemplate(resolvedParams.id);
        setData(result);
      } catch {
        toast("Gagal memuat data", "error");
        router.push("/admin/workforce/qc-templates");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [resolvedParams.id]);

  const handleDelete = async () => {
    if (!data) return;
    setDeleting(true);
    try {
      await deleteQcTemplate(resolvedParams.id);
      toast("Template berhasil dihapus", "success");
      router.push("/admin/workforce/qc-templates");
    } catch (err: any) {
      toast(err.message || "Gagal menghapus", "error");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const getWbsLabel = (stage: WbsStage) => {
    return WBS_STAGES[stage]?.label || stage;
  };

  const parseItems = (items: QcTemplate["items"]): QcTemplateItem[] => {
    if (Array.isArray(items)) return items;
    if (typeof items === "string") {
      try {
        return JSON.parse(items);
      } catch {
        return [];
      }
    }
    return [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  if (!data) return null;

  const items = parseItems(data.items);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/workforce/qc-templates"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition-colors hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-400"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">{data.name}</h1>
            <p className="text-sm text-slate-400">
              {data.methodCode ? `${data.methodCode} - ` : ""}{getWbsLabel(data.wbsStage)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/workforce/qc-templates/${data.id}/edit`}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-300 transition-all hover:bg-amber-400/20"
          >
            <Edit size={16} />
            Edit
          </Link>
          <Button variant="danger" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        <Badge tone="info">{getWbsLabel(data.wbsStage)}</Badge>
        {data.methodCode && <Badge tone="neutral">{data.methodCode}</Badge>}
        <Badge tone={data.isActive ? "success" : "neutral"}>
          {data.isActive ? "Active" : "Inactive"}
        </Badge>
        <Badge tone="neutral">{items.length} items</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {data.description && (
            <Card className="p-6">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <FileText size={16} />
                Deskripsi
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">{data.description}</p>
            </Card>
          )}

          {/* Checklist Items */}
          <Card className="p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <ClipboardList size={16} />
              Checklist Items ({items.length})
            </h3>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className={`rounded-xl border p-4 ${
                    item.isMandatory
                      ? "border-amber-500/30 bg-amber-500/5"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-slate-400">
                          {index + 1}
                        </span>
                        {item.isMandatory && (
                          <Badge tone="warning" className="text-xs">
                            <AlertTriangle size={10} />
                            Mandatory
                          </Badge>
                        )}
                      </div>
                      <p className="mb-2 font-medium text-white">{item.itemDesc}</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <p className="text-xs text-slate-500">Criteria</p>
                          <p className="text-sm text-emerald-400">{item.criteria}</p>
                        </div>
                        {item.tolerance && (
                          <div>
                            <p className="text-xs text-slate-500">Tolerance</p>
                            <p className="text-sm text-white">{item.tolerance}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <Card className="p-6">
            <h3 className="mb-4 text-sm font-semibold text-white">Informasi</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">WBS Stage</span>
                <Badge tone="info">{getWbsLabel(data.wbsStage)}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Method Code</span>
                <span className="font-mono text-sm text-cyan-400">
                  {data.methodCode || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Total Items</span>
                <span className="font-medium text-white">{items.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Mandatory</span>
                <span className="text-sm text-amber-400">
                  {items.filter((i) => i.isMandatory).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Status</span>
                <Badge tone={data.isActive ? "success" : "neutral"}>
                  {data.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Meta */}
          <Card className="p-6">
            <h3 className="mb-3 text-sm font-semibold text-white">Log</h3>
            <div className="space-y-2 text-xs text-slate-500">
              <p>Dibuat: {new Date(data.createdAt).toLocaleDateString("id-ID")}</p>
              <p>Diperbarui: {new Date(data.updatedAt).toLocaleDateString("id-ID")}</p>
            </div>
          </Card>

          {/* Action */}
          <Card className="p-6">
            <h3 className="mb-3 text-sm font-semibold text-white">Aksi</h3>
            <div className="space-y-2">
              <Link
                href={`/admin/workforce/qc-templates/${data.id}/edit`}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-300 transition-all hover:bg-cyan-400/20"
              >
                <Edit size={16} />
                Edit Template
              </Link>
              <Link
                href="/admin/workforce/qc-templates"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-400 transition-all hover:border-white/20 hover:text-white"
              >
                Kembali ke List
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Hapus QC Template"
        description={`Yakin ingin menghapus "${data.name}"?`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              <Trash2 size={16} />
              Hapus
            </Button>
          </div>
        }
      />
    </div>
  );
}
