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
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-border bg-card transition-all hover:bg-muted/30 text-left">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className={cn("w-3.5 h-3.5", theme.text)} />
              <span className="text-[11px] font-bold text-muted-foreground">
                Consistência
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground leading-none">
              {summary.consistencyScore.toFixed(0)}%
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card transition-all hover:bg-muted/30 text-left">
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[11px] font-bold text-muted-foreground">
                Eficiência
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground leading-none">
              {summary.studyEfficiency.toFixed(1)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card transition-all hover:bg-muted/30 gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="shrink-0 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                <Target className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1 gap-0.5 text-left">
                <span className="text-sm font-bold text-foreground truncate">
                  Taxa de Acerto
                </span>
                <span className="text-[10px] font-bold text-muted-foreground">
                  Questões respondidas
                </span>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-bold capitalize shrink-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                <span>{summary.avgHitRate.toFixed(1)}%</span>
              </div>
              <span className="text-xs font-semibold text-muted-foreground min-w-[42px] text-right">
                Acertos
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card transition-all hover:bg-muted/30 gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="shrink-0 p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1 gap-0.5 text-left">
                <span className="text-sm font-bold text-foreground truncate">
                  PPM Médio
                </span>
                <span className="text-[10px] font-bold text-muted-foreground">
                  Velocidade de leitura
                </span>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-bold capitalize shrink-0 bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20">
                <span>{summary.avgPpm.toFixed(1)}</span>
              </div>
              <span className="text-xs font-semibold text-muted-foreground min-w-[42px] text-right">
                Pág/Min
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card transition-all hover:bg-muted/30 gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className={cn(
                  "shrink-0 p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20",
                  theme.text,
                )}
              >
                <BarChart3 className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1 gap-0.5 text-left">
                <span className="text-sm font-bold text-foreground truncate">
                  Dias Analisados
                </span>
                <span className="text-[10px] font-bold text-muted-foreground">
                  Período avaliado
                </span>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-bold capitalize shrink-0 bg-muted/40 text-muted-foreground border-border/40">
                <span>{summary.totalDaysAnalyzed}d</span>
              </div>
              <span className="text-xs font-semibold text-muted-foreground min-w-[42px] text-right">
                Total
              </span>
            </div>
          </div>
        </div>

        {summary.peakStudySubject && (
          <div className="mt-1 text-left">
            <p className="text-[10px] font-bold text-muted-foreground mb-1.5">
              Foco Principal
            </p>
            <div className="px-2.5 py-1 rounded-xl border border-border bg-card transition-all hover:bg-muted/30 w-fit text-left">
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
