"use client";

import { PieChart } from "lucide-react";
import type { StudyStats } from "../types";
import { hitRate } from "../utils";

interface PerformanceGlobalProps {
  allStats: StudyStats;
  globalRate: number;
}

export function PerformanceGlobal({
  allStats,
  globalRate,
}: PerformanceGlobalProps) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col gap-6 shadow-xl lg:col-span-2">
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-black uppercase text-neutral-400">
            Taxa de Acerto Global
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
            <span className="text-5xl font-black text-white leading-none">
              {globalRate}%
            </span>
            <span className="text-xs font-black text-violet-400 uppercase mt-2">
              Acerto Geral
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-neutral-950/50 border border-neutral-800 p-4 rounded-2xl flex flex-col gap-1 items-center">
          <span className="text-xs font-black text-neutral-500 uppercase">
            Inéditas
          </span>
          <span className="text-xl font-black text-white">
            {hitRate(allStats.correctNew, allStats.questionsNew)}%
          </span>
        </div>
        <div className="bg-neutral-950/50 border border-neutral-800 p-4 rounded-2xl flex flex-col gap-1 items-center">
          <span className="text-xs font-black text-neutral-500 uppercase">
            Refeitas
          </span>
          <span className="text-xl font-black text-white">
            {hitRate(allStats.correctReview, allStats.questionsReview)}%
          </span>
        </div>
      </div>
    </div>
  );
}
