"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  Wrench,
  Package,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clipboard,
} from "lucide-react";
import {
  getMethodStatement,
  deleteMethodStatement,
  WBS_STAGES,
  type MethodStatement,
  type WbsStage,
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

export default function MethodStatementDetailPage({ params }: Props) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [data, setData] = useState<MethodStatement | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getMethodStatement(resolvedParams.id);
        setData(result);
      } catch (err: any) {
        console.error("[MethodStatement] Load error:", err);
        const errorMsg = err?.message || "Gagal memuat data";
        if (err?.status === 404) {
          toast("Method statement tidak ditemukan", "error");
          router.push("/admin/workforce/method-statements");
        } else if (err?.status === 401) {
          toast("Sesi berakhir. Silakan login ulang.", "error");
          router.push("/admin/login");
        } else {
          toast(errorMsg, "error");
        }
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
      await deleteMethodStatement(data.id);
      toast("Method statement berhasil dihapus", "success");
      router.push("/admin/workforce/method-statements");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/workforce/method-statements"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition-colors hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-400"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <p className="font-mono text-sm text-cyan-400">{data.methodCode}</p>
            <h1 className="text-xl font-bold text-white">{data.workItem}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/workforce/method-statements/${data.id}/edit`}
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
        <Badge tone="neutral">v{data.revision}</Badge>
        {data.holdPoint && (
          <Badge tone="warning">
            <AlertTriangle size={12} />
            Hold Point
          </Badge>
        )}
        <Badge tone={data.isActive ? "success" : "neutral"}>
          {data.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card className="p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <FileText size={18} />
              Scope & Reference
            </h3>
            {data.scope && (
              <div className="mb-4">
                <p className="mb-1 text-xs text-slate-500">Scope</p>
                <p className="text-sm text-white leading-relaxed">{data.scope}</p>
              </div>
            )}
            {data.reference && (
              <div>
                <p className="mb-1 text-xs text-slate-500">Reference</p>
                <p className="text-sm text-white">{data.reference}</p>
              </div>
            )}
            {!data.scope && !data.reference && (
              <p className="text-sm text-slate-500 italic">Tidak ada informasi scope</p>
            )}
          </Card>

          {/* Tools & Materials */}
          <Card className="p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Package size={18} />
              Tools & Materials
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs text-slate-500">Tools</p>
                {data.tools && data.tools.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {data.tools.map((tool, i) => (
                      <Badge key={i} tone="info">{tool}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">-</p>
                )}
              </div>
              <div>
                <p className="mb-2 text-xs text-slate-500">Materials</p>
                {data.materials && data.materials.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {data.materials.map((mat, i) => (
                      <Badge key={i} tone="neutral">{mat}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">-</p>
                )}
              </div>
            </div>
          </Card>

          {/* Quality Criteria */}
          <Card className="p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Shield size={18} />
              Quality & Safety
            </h3>
            <div className="space-y-4">
              <div>
                <p className="mb-1 text-xs text-slate-500">Acceptance Criteria *</p>
                <p className="text-sm text-white leading-relaxed">{data.acceptanceCriteria}</p>
              </div>
              {data.tolerance && (
                <div>
                  <p className="mb-1 text-xs text-slate-500">Tolerance</p>
                  <p className="text-sm text-white">{data.tolerance}</p>
                </div>
              )}
              {data.criticalPoints && (
                <div>
                  <p className="mb-1 text-xs text-slate-500">Critical Points</p>
                  <p className="text-sm text-amber-400">{data.criticalPoints}</p>
                </div>
              )}
              {data.safety && (
                <div>
                  <p className="mb-1 text-xs text-slate-500">Safety</p>
                  <p className="text-sm text-white">{data.safety}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Evidence */}
          <Card className="p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Clipboard size={18} />
              Evidence Requirement
            </h3>
            {data.evidenceRequirement && data.evidenceRequirement.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {data.evidenceRequirement.map((evidence, i) => (
                  <Badge key={i} tone="success">
                    <CheckCircle size={12} />
                    {evidence}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Tidak ada requirement khusus</p>
            )}
          </Card>

          {/* Rework & Lesson */}
          {(data.reworkProcedure || data.lessonLearned) && (
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">Catatan Tambahan</h3>
              {data.reworkProcedure && (
                <div className="mb-4">
                  <p className="mb-1 text-xs text-slate-500">Rework Procedure</p>
                  <p className="text-sm text-white">{data.reworkProcedure}</p>
                </div>
              )}
              {data.lessonLearned && (
                <div>
                  <p className="mb-1 text-xs text-slate-500">Lesson Learned</p>
                  <p className="text-sm text-white">{data.lessonLearned}</p>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Precondition */}
          {data.precondition && (
            <Card className="p-6">
              <h3 className="mb-3 text-sm font-semibold text-white">Precondition</h3>
              <p className="text-sm text-slate-400">{data.precondition}</p>
            </Card>
          )}

          {/* Responsible Roles */}
          {data.responsibleRoles && data.responsibleRoles.length > 0 && (
            <Card className="p-6">
              <h3 className="mb-3 text-sm font-semibold text-white">Responsible Roles</h3>
              <div className="space-y-2">
                {data.responsibleRoles.map((role, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                    <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                    {role}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Meta */}
          <Card className="p-6">
            <h3 className="mb-3 text-sm font-semibold text-white">Informasi</h3>
            <div className="space-y-2 text-xs text-slate-500">
              <p>Dibuat: {new Date(data.createdAt).toLocaleDateString("id-ID")}</p>
              <p>Diperbarui: {new Date(data.updatedAt).toLocaleDateString("id-ID")}</p>
              <p>Revision: v{data.revision}</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Hapus Method Statement"
        description={`Yakin ingin menghapus "${data.methodCode}" - ${data.workItem}?`}
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
