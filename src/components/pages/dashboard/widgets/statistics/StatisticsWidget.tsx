"use client";

import { BarChart3, Target, TrendingUp, Zap } from "lucide-react";
import type { PerformanceSummary } from "../../types";
import { BaseWidget } from "../BaseWidget";

interface StatisticsWidgetProps {
  summary: PerformanceSummary | null;
  isEditMode?: boolean;
}

export function StatisticsWidget({
  summary,
  isEditMode,
}: StatisticsWidgetProps) {
  if (!summary)
    return (
      <BaseWidget
        title="Estatísticas"
        icon={BarChart3}
        iconColor="text-rose-400"
        route="statistics"
        isEditMode={isEditMode}
      >
        <p className="text-xs text-neutral-600 italic">Processando dados...</p>
      </BaseWidget>
    );

  return (
    <BaseWidget
      title="Desempenho Global"
      icon={BarChart3}
      iconColor="text-rose-400"
      route="statistics"
      isEditMode={isEditMode}
    >
      <div className="flex flex-col gap-[6cqw] @sm:gap-4">
        <div className="grid grid-cols-2 gap-[4cqw] @sm:gap-4">
          <div className="p-[5cqw] @sm:p-5 rounded-xl bg-rose-500/5 border border-rose-500/10 shadow-sm">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="w-[4cqw] h-[4cqw] @sm:w-3.5 @sm:h-3.5 text-rose-500" />
              <span className="text-[3.5cqw] @sm:text-[11px] font-bold text-neutral-500r">
                Consistência
              </span>
            </div>
            <p className="text-[6cqw] @sm:text-3xl font-black text-white leading-none">
              {summary.consistency_score.toFixed(0)}%
            </p>
          </div>
          <div className="p-[5cqw] @sm:p-5 rounded-xl bg-amber-500/5 border border-amber-500/10 shadow-sm">
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="w-[4cqw] h-[4cqw] @sm:w-3.5 @sm:h-3.5 text-amber-500" />
              <span className="text-[3.5cqw] @sm:text-[11px] font-bold text-neutral-500r">
                Eficiência
              </span>
            </div>
            <p className="text-[6cqw] @sm:text-3xl font-black text-white leading-none">
              {summary.study_efficiency.toFixed(1)}
            </p>
          </div>
        </div>

        <div className="space-y-[2.5cqw] @sm:space-y-3">
          <div className="flex items-center justify-between p-[3.5cqw] @sm:p-4 rounded-xl bg-neutral-800/20 border border-neutral-800/40 shadow-sm">
            <div className="flex items-center gap-[3cqw] @sm:gap-3">
              <Target className="w-[4.5cqw] h-[4.5cqw] @sm:w-4.5 @sm:h-4.5 text-emerald-400" />
              <span className="text-[3.8cqw] @sm:text-sm font-semibold text-neutral-400">
                Taxa de Acerto
              </span>
            </div>
            <span className="text-[4cqw] @sm:text-sm font-black text-emerald-400">
              {summary.avg_hit_rate.toFixed(1)}%
            </span>
          </div>

          <div className="flex items-center justify-between p-[3.5cqw] @sm:p-4 rounded-xl bg-neutral-800/20 border border-neutral-800/40 shadow-sm">
            <div className="flex items-center gap-[3cqw] @sm:gap-3">
              <BarChart3 className="w-[4.5cqw] h-[4.5cqw] @sm:w-4.5 @sm:h-4.5 text-rose-400" />
              <span className="text-[3.8cqw] @sm:text-sm font-semibold text-neutral-400">
                Dias Analisados
              </span>
            </div>
            <span className="text-[4cqw] @sm:text-sm font-black text-white">
              {summary.total_days_analyzed}d
            </span>
          </div>
        </div>

        {summary.peak_study_subject && (
          <div className="mt-1">
            <p className="text-[10px] font-bold text-neutral-600 uppercase mb-1.5">
              FOCO PRINCIPAL
            </p>
            <div className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 w-fit">
              <span className="text-xs font-bold text-rose-400">
                {summary.peak_study_subject}
              </span>
            </div>
          </div>
        )}
      </div>
    </BaseWidget>
  );
}
