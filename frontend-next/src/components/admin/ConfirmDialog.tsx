"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

/**
 * Pengganti `confirm()` bawaan browser: sesuai brand, bisa ditutup dengan Esc,
 * dan fokus langsung jatuh ke tombol batal agar aksi merusak tidak terpicu
 * tanpa sengaja oleh Enter.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Hapus",
  cancelLabel = "Batal",
  tone = "danger",
  pending = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
            className="fixed inset-0 z-[60] flex items-center justify-center bg-[#020617]/70 p-4 backdrop-blur-md"
      onClick={onCancel}
    >
      <div
              className="w-full max-w-sm rounded-[1.75rem] border border-white/10 bg-[#081421]/92 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.38)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  tone === "danger" ? "bg-red-500/15 text-red-300" : "bg-cyan-300/10 text-cyan-200"
          }`}
        >
          <AlertTriangle size={20} />
        </div>

              <h2 id="confirm-title" className="mt-4 font-display text-base font-semibold text-white">
          {title}
        </h2>
              {description && <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{description}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={pending}
                  className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/[0.04] disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${
                    tone === "danger"
                      ? "bg-red-600 hover:bg-red-700"
                      : "border border-cyan-300/35 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/20"
            }`}
          >
            {pending ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ConfirmRequest {
  title: string;
  description?: string;
  confirmLabel?: string;
  tone?: "danger" | "primary";
  onConfirm: () => void;
}

/**
 * Menyimpan permintaan konfirmasi yang sedang aktif, sehingga pemanggil cukup
 * memakai `ask({...})` seperti `confirm()` lama dan menempel `<ConfirmDialog {...dialogProps} />`.
 */
export function useConfirm(pending = false) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);

  const ask = useCallback((req: ConfirmRequest) => setRequest(req), []);
  const cancel = useCallback(() => setRequest(null), []);
  const confirm = useCallback(() => {
    request?.onConfirm();
    setRequest(null);
  }, [request]);

  return {
    ask,
    dialogProps: {
      open: request !== null,
      title: request?.title ?? "",
      description: request?.description,
      confirmLabel: request?.confirmLabel,
      tone: request?.tone,
      pending,
      onConfirm: confirm,
      onCancel: cancel,
    },
  };
}
