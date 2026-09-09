"use client";

import { useState } from "react";
import { MultiSectionSCurveChart, SCurveChart } from "./SCurveChart";
import type { ScheduleBaseline, ScheduleBucket } from "@/lib/estimation";

interface SectionBucket {
  sectionId: string;
  sectionName: string;
  totalWeight: number;
  buckets: ScheduleBucket[];
}

interface SCurveChartWrapperProps {
  buckets: ScheduleBucket[];
  sectionBuckets: SectionBucket[];
  lastReportedIndex: number;
  baselines?: ScheduleBaseline[];
}

export function SCurveChartWrapper({
  buckets,
  sectionBuckets,
  lastReportedIndex,
  baselines = [],
}: SCurveChartWrapperProps) {
  const [mode, setMode] = useState<"combined" | "per-section">("combined");
  const [selectedSections, setSelectedSections] = useState<string[]>(
    sectionBuckets.map((s) => s.sectionId)
  );

  const handleToggleSection = (sectionId: string) => {
    setSelectedSections((prev) => {
      if (prev.includes(sectionId)) {
        // Don't allow deselecting all
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== sectionId);
      } else {
        return [...prev, sectionId];
      }
    });
  };

  // If no section data or only one section, show simple chart
  if (!sectionBuckets || sectionBuckets.length <= 1) {
    return (
      <SCurveChart
        buckets={buckets}
        lastReportedIndex={lastReportedIndex}
        baselines={baselines}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Tampilan:</span>
          <button
            onClick={() => setMode("combined")}
            className={`px-3 py-1 rounded text-xs font-medium transition-all ${
              mode === "combined"
                ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:text-slate-300"
            }`}
          >
            Gabungan
          </button>
          <button
            onClick={() => setMode("per-section")}
            className={`px-3 py-1 rounded text-xs font-medium transition-all ${
              mode === "per-section"
                ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:text-slate-300"
            }`}
          >
            Per Section
          </button>
        </div>
        <span className="text-xs text-slate-500">
          {sectionBuckets.length} section • Total {sectionBuckets.reduce((sum, s) => sum + s.totalWeight, 0).toFixed(1)}% bobot
        </span>
      </div>

      {/* Multi Section Chart */}
      <MultiSectionSCurveChart
        buckets={buckets}
        sectionBuckets={sectionBuckets}
        lastReportedIndex={lastReportedIndex}
        baselines={baselines}
        mode={mode}
        selectedSections={selectedSections}
        onToggleSection={handleToggleSection}
      />
    </div>
  );
}
