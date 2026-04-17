"use client";

import { PieChart } from "lucide-react";
import type { StudyStats } from "../types";
import { hitRate } from "../utils";

interface PerformanceGlobalProps {
  allStats: StudyStats;
  globalRate: number;
  reportMode?: "daily" | "weekly" | "monthly" | "all";
}

export function PerformanceGlobal({
  allStats,
  globalRate,
  reportMode = "weekly",
}: PerformanceGlobalProps) {
  const rateLabel =
    reportMode === "daily"
      ? "Taxa de Acerto Diária"
      : reportMode === "weekly"
        ? "Taxa de Acerto Semanal"
        : reportMode === "monthly"
          ? "Taxa de Acerto Mensal"
          : "Taxa de Acerto Global";

  const totalLabel =
    reportMode === "daily"
      ? "Acerto Diário"
      : reportMode === "weekly"
        ? "Acerto Semanal"
        : reportMode === "monthly"
          ? "Acerto Mensal"
          : "Acerto Geral";

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-6 lg:col-span-2">
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-emerald-500" />
          <h3 className=" font-black uppercase text-muted-foreground">
            {rateLabel}
          </h3>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center py-8 relative z-10">
        <div className="relative w-48 h-48 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <title>Performance Circular</title>
            <circle
              className="text-neutral-950"
              strokeWidth="12"
              stroke="currentColor"
              fill="transparent"
              r="84"
              cx="96"
              cy="96"
            />
            <circle
              className="text-violet-500"
              strokeWidth="12"
              strokeDasharray={527}
              strokeDashoffset={527 - (527 * globalRate) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="84"
              cx="96"
              cy="96"
              style={{ transition: "stroke-dashoffset 1.5s ease" }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-5xl font-black text-foreground leading-none">
              {globalRate}%
            </span>
            <span className="text-xs font-black text-violet-600 dark:text-violet-400 uppercase mt-2">
              {totalLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-background/50 border border-border p-4 rounded-xl flex flex-col gap-1 items-center">
          <span className="text-xs font-black text-muted-foreground uppercase">
            Inéditas
          </span>
          <span className="text-xl font-black text-foreground">
            {hitRate(allStats.correctNew, allStats.questionsNew)}%
          </span>
        </div>
        <div className="bg-background/50 border border-border p-4 rounded-xl flex flex-col gap-1 items-center">
          <span className="text-xs font-black text-muted-foreground uppercase">
            Refeitas
          </span>
          <span className="text-xl font-black text-foreground">
            {hitRate(allStats.correctReview, allStats.questionsReview)}%
          </span>
        </div>
      </div>
    </div>
  );
}
