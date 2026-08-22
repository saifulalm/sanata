"use client";

import { useState, useTransition } from "react";
import { Download } from "lucide-react";
import { btn } from "@/components/admin/ui";
import { exportTakeoffCsvAction } from "../../actions";

export function DownloadTakeoffButton({ rabId }: { rabId: string }) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleDownload = () => {
    setError("");
    startTransition(async () => {
      const result = await exportTakeoffCsvAction(rabId);
      if (!result.ok || !result.csv) {
        setError(result.message ?? "Gagal mengunduh takeoff");
        return;
      }

      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename ?? "takeoff.csv";
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleDownload}
        disabled={isPending}
        className={btn("secondary", "sm")}
      >
        <Download size={13} /> {isPending ? "Menyiapkan…" : "Excel (CSV)"}
      </button>
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}
