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
          <div className="p-[5cqw] @sm:p-5 rounded-xl border border-border/40 bg-neutral-900/10 hover:bg-neutral-900/20 hover:border-border/60 transition-all text-left">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp
                className={cn(
                  "w-[4cqw] h-[4cqw] @sm:w-3.5 @sm:h-3.5",
                  theme.text,
                )}
              />
              <span className="text-[3.5cqw] @sm:text-[11px] font-bold text-muted-foreground">
                Consistência
              </span>
            </div>
            <p className="text-2xl @sm:text-3xl font-bold text-foreground leading-none">
              {summary.consistencyScore.toFixed(0)}%
            </p>
          </div>
          <div className="p-[5cqw] @sm:p-5 rounded-xl border border-border/40 bg-neutral-900/10 hover:bg-neutral-900/20 hover:border-border/60 transition-all text-left">
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="w-[4cqw] h-[4cqw] @sm:w-3.5 @sm:h-3.5 text-amber-500" />
              <span className="text-[3.5cqw] @sm:text-[11px] font-bold text-muted-foreground">
                Eficiência
              </span>
            </div>
            <p className="text-2xl @sm:text-3xl font-bold text-foreground leading-none">
              {summary.studyEfficiency.toFixed(1)}
            </p>
          </div>
        </div>

        <div className="space-y-[2.5cqw] @sm:space-y-3">
          <div className="flex items-center justify-between p-[2.5cqw] @sm:p-2.5 rounded-xl border border-border/40 bg-neutral-900/10 hover:bg-neutral-900/20 hover:border-border/60 transition-all gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="shrink-0 p-2 rounded-xl bg-neutral-900/40 border border-border/30 text-emerald-500">
                <Target className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-foreground truncate">
                  Taxa de Acerto
                </span>
                <span className="text-[10px] font-bold text-zinc-500/80 mt-0.5">
                  Questões respondidas
                </span>
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-start justify-center px-3 py-1.5 rounded-xl bg-neutral-900/30 border border-border/30 min-w-[72px] text-left">
              <span className="block text-xs font-bold leading-none text-emerald-400">
                {summary.avgHitRate.toFixed(1)}%
              </span>
              <span className="text-[9px] font-semibold text-neutral-500 block mt-1">
                Acertos
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-[2.5cqw] @sm:p-2.5 rounded-xl border border-border/40 bg-neutral-900/10 hover:bg-neutral-900/20 hover:border-border/60 transition-all gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="shrink-0 p-2 rounded-xl bg-neutral-900/40 border border-border/30 text-orange-500">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-foreground truncate">
                  PPM Médio
                </span>
                <span className="text-[10px] font-bold text-zinc-500/80 mt-0.5">
                  Velocidade de leitura
                </span>
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-start justify-center px-3 py-1.5 rounded-xl bg-neutral-900/30 border border-border/30 min-w-[72px] text-left">
              <span className="block text-xs font-bold leading-none text-orange-400">
                {summary.avgPpm.toFixed(1)}
              </span>
              <span className="text-[9px] font-semibold text-neutral-500 block mt-1">
                Pág / Min
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-[2.5cqw] @sm:p-2.5 rounded-xl border border-border/40 bg-neutral-900/10 hover:bg-neutral-900/20 hover:border-border/60 transition-all gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  "shrink-0 p-2 rounded-xl bg-neutral-900/40 border border-border/30",
                  theme.text,
                )}
              >
                <BarChart3 className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-foreground truncate">
                  Dias Analisados
                </span>
                <span className="text-[10px] font-bold text-zinc-500/80 mt-0.5">
                  Período avaliado
                </span>
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-start justify-center px-3 py-1.5 rounded-xl bg-neutral-900/30 border border-border/30 min-w-[72px] text-left">
              <span className="block text-xs font-bold leading-none text-zinc-300">
                {summary.totalDaysAnalyzed}d
              </span>
              <span className="text-[9px] font-semibold text-neutral-500 block mt-1">
                Total
              </span>
            </div>
          </div>
        </div>

        {summary.peakStudySubject && (
          <div className="mt-1 text-left">
            <p className="text-[10px] font-bold text-neutral-600 mb-1.5">
              Foco Principal
            </p>
            <div className="px-3 py-1.5 rounded-xl border border-border/40 bg-neutral-900/10 hover:bg-neutral-900/20 transition-all w-fit text-left">
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
