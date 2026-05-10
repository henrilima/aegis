"use client";

import { BarChart3, BookOpen, Target, TrendingUp, Zap } from "lucide-react";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { PerformanceSummary } from "../../types";
import { BaseWidget } from "../BaseWidget";

interface StatisticsWidgetProps {
  summary: PerformanceSummary | null;
  isEditMode?: boolean;
  isInteractive?: boolean;
  onToggleInteractive?: () => void;
}

export function StatisticsWidget({
  summary,
  isEditMode,
  isInteractive,
  onToggleInteractive,
}: StatisticsWidgetProps) {
  const color = getModuleColor("statistics");
  const theme = getColorTheme(color);

  if (!summary)
    return (
      <BaseWidget
        title="Estatísticas"
        icon={BarChart3}
        color={color}
        route="statistics"
        isEditMode={isEditMode}
        isInteractive={isInteractive}
        onToggleInteractive={onToggleInteractive}
      >
        <p className="text-xs text-neutral-600 italic">Processando dados...</p>
      </BaseWidget>
    );

  return (
    <BaseWidget
      title="Desempenho Semanal"
      icon={BarChart3}
      color={color}
      route="statistics"
      isEditMode={isEditMode}
      isInteractive={isInteractive}
      onToggleInteractive={onToggleInteractive}
    >
      <div className="flex flex-col gap-[6cqw] @sm:gap-4">
        <div className="grid grid-cols-2 gap-[4cqw] @sm:gap-4">
          <div
            className={cn(
              "p-[5cqw] @sm:p-5 rounded-xl border",
              theme.bg,
              theme.border,
            )}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp
                className={cn(
                  "w-[4cqw] h-[4cqw] @sm:w-3.5 @sm:h-3.5",
                  theme.text,
                )}
              />
              <span className="text-[3.5cqw] @sm:text-[11px] font-bold text-muted-foregroundr">
                Consistência
              </span>
            </div>
            <p className="text-2xl @sm:text-3xl font-black text-foreground leading-none">
              {summary.consistencyScore.toFixed(0)}%
            </p>
          </div>
          <div className="p-[5cqw] @sm:p-5 rounded-xl bg-amber-500/5 border border-amber-500/10">
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="w-[4cqw] h-[4cqw] @sm:w-3.5 @sm:h-3.5 text-amber-600 dark:text-amber-500" />
              <span className="text-[3.5cqw] @sm:text-[11px] font-bold text-muted-foregroundr">
                Eficiência
              </span>
            </div>
            <p className="text-2xl @sm:text-3xl font-black text-foreground leading-none">
              {summary.studyEfficiency.toFixed(1)}
            </p>
          </div>
        </div>

        <div className="space-y-[2.5cqw] @sm:space-y-3">
          <div className="flex items-center justify-between p-[3.5cqw] @sm:p-4 rounded-xl bg-neutral-800/20 border border-border/40">
            <div className="flex items-center gap-[3cqw] @sm:gap-3">
              <Target className="w-[4.5cqw] h-[4.5cqw] @sm:w-4.5 @sm:h-4.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[3.8cqw] @sm:text-sm font-semibold text-muted-foreground">
                Taxa de Acerto
              </span>
            </div>
            <span className="text-[4cqw] @sm:text-sm font-black text-emerald-600 dark:text-emerald-400">
              {summary.avgHitRate.toFixed(1)}%
            </span>
          </div>

          <div className="flex items-center justify-between p-[3.5cqw] @sm:p-4 rounded-xl bg-orange-500/5 border border-orange-500/10">
            <div className="flex items-center gap-[3cqw] @sm:gap-3">
              <BookOpen className="w-[4.5cqw] h-[4.5cqw] @sm:w-4.5 @sm:h-4.5 text-orange-600 dark:text-orange-400" />
              <span className="text-[3.8cqw] @sm:text-sm font-semibold text-muted-foreground">
                PPM Médio (Leitura)
              </span>
            </div>
            <span className="text-[4cqw] @sm:text-sm font-black text-orange-600 dark:text-orange-400">
              {summary.avgPpm.toFixed(1)}
            </span>
          </div>

          <div className="flex items-center justify-between p-[3.5cqw] @sm:p-4 rounded-xl bg-neutral-800/20 border border-border/40">
            <div className="flex items-center gap-[3cqw] @sm:gap-3">
              <BarChart3
                className={cn(
                  "w-[4.5cqw] h-[4.5cqw] @sm:w-4.5 @sm:h-4.5",
                  theme.text,
                )}
              />
              <span className="text-[3.8cqw] @sm:text-sm font-semibold text-muted-foreground">
                Dias Analisados
              </span>
            </div>
            <span className="text-[4cqw] @sm:text-sm font-black text-foreground">
              {summary.totalDaysAnalyzed}d
            </span>
          </div>
        </div>

        {summary.peakStudySubject && (
          <div className="mt-1">
            <p className="text-[10px] font-bold text-neutral-600 mb-1.5">
              Foco Principal
            </p>
            <div
              className={cn(
                "px-3 py-1.5 rounded-lg border w-fit",
                theme.bg,
                theme.border,
              )}
            >
              <span className={cn("text-xs font-bold", theme.text)}>
                {summary.peakStudySubject}
              </span>
            </div>
          </div>
        )}
      </div>
    </BaseWidget>
  );
}
