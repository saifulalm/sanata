"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

const TOAST_ICONS: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const TOAST_COLORS: Record<ToastType, { border: string; bg: string; icon: string; progress: string }> = {
  success: {
    border: "border-emerald-400/30",
    bg: "bg-emerald-500/10",
    icon: "text-emerald-400",
    progress: "bg-emerald-400",
  },
  error: {
    border: "border-red-400/30",
    bg: "bg-red-500/10",
    icon: "text-red-400",
    progress: "bg-red-400",
  },
  warning: {
    border: "border-amber-400/30",
    bg: "bg-amber-500/10",
    icon: "text-amber-400",
    progress: "bg-amber-400",
  },
  info: {
    border: "border-cyan-400/30",
    bg: "bg-cyan-500/10",
    icon: "text-cyan-400",
    progress: "bg-cyan-400",
  },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const Icon = TOAST_ICONS[toast.type];
  const colors = TOAST_COLORS[toast.type];
  const duration = toast.duration ?? 5000;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className={`relative overflow-hidden rounded-2xl border ${colors.border} ${colors.bg} backdrop-blur-xl shadow-xl`}
      style={{
        minWidth: 320,
        maxWidth: 420,
      }}
    >
      <div className="flex items-start gap-3 p-4">
        <Icon size={20} className={colors.icon} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-white">{toast.title}</p>
          {toast.message && (
            <p className="mt-1 text-sm text-slate-400">{toast.message}</p>
          )}
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="rounded-lg p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>

      {/* Progress bar */}
      <motion.div
        className={`h-0.5 ${colors.progress}`}
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: duration / 1000, ease: "linear" }}
      />
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    // Auto remove after duration
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback(
    (title: string, message?: string) => addToast({ type: "success", title, message }),
    [addToast]
  );

  const error = useCallback(
    (title: string, message?: string) => addToast({ type: "error", title, message }),
    [addToast]
  );

  const warning = useCallback(
    (title: string, message?: string) => addToast({ type: "warning", title, message }),
    [addToast]
  );

  const info = useCallback(
    (title: string, message?: string) => addToast({ type: "info", title, message }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}

      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// Hook for simple toast usage
export function useSimpleToast() {
  const { success, error, warning, info } = useToast();

  return {
    success: (message: string) => success("Berhasil", message),
    error: (message: string) => error("Gagal", message),
    warning: (message: string) => warning("Peringatan", message),
    info: (message: string) => info("Info", message),
  };
}
