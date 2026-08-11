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
        <div className="flex flex-col items-center justify-center py-6 text-center h-full">
          <p className="text-xs text-neutral-600 font-bold">
            Processando dados
          </p>
          <p className="text-[10px] text-neutral-600 font-medium max-w-45 mt-1">
            Por favor, aguarde enquanto calculamos suas estatísticas semanais.
          </p>
        </div>
      </BaseWidget>
    );

  return (
    <BaseWidget
      title="Desempenho semanal"
      icon={BarChart3}
      color={color}
      route="statistics"
      isEditMode={isEditMode}
      isInteractive={isInteractive}
      onToggleInteractive={onToggleInteractive}
    >
      <div className="flex flex-col gap-3 py-1">
        {/* Top KPIs: Consistência e Eficiência sem cards internos */}
        <div className="flex items-center justify-between pb-2 border-b border-border/40">
          <div className="flex items-center gap-4">
            <div className="text-left">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className={cn("w-3.5 h-3.5", theme.text)} />
                <span className="text-[11px] font-bold text-muted-foreground">
                  Consistência
                </span>
              </div>
              <p className="text-2xl @sm:text-3xl font-bold text-foreground leading-none">
                {summary.consistencyScore.toFixed(0)}%
              </p>
            </div>
            <div className="w-px h-8 bg-border/60" />
            <div className="text-left">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] font-bold text-muted-foreground">
                  Eficiência
                </span>
              </div>
              <p className="text-2xl @sm:text-3xl font-bold text-foreground leading-none">
                {summary.studyEfficiency.toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        {/* Lista de métricas sem bordas de cards internos */}
        <div className="space-y-1">
          <div className="flex items-center justify-between py-2 px-1 rounded-lg hover:bg-muted/30 transition-colors gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="shrink-0 p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <Target className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1 gap-0.5 text-left">
                <span className="text-xs font-bold text-foreground truncate">
                  Taxa de acerto
                </span>
                <span className="text-[10px] font-medium text-muted-foreground">
                  Questões respondidas
                </span>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold shrink-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span>{summary.avgHitRate.toFixed(1)}%</span>
              </div>
              <span className="text-xs font-medium text-muted-foreground min-w-10.5 text-right">
                Acertos
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between py-2 px-1 rounded-lg hover:bg-muted/30 transition-colors gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="shrink-0 p-2 rounded-xl bg-orange-500/10 text-orange-500">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1 gap-0.5 text-left">
                <span className="text-xs font-bold text-foreground truncate">
                  PPM médio
                </span>
                <span className="text-[10px] font-medium text-muted-foreground">
                  Velocidade de leitura
                </span>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold shrink-0 bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                <span>{summary.avgPpm.toFixed(1)}</span>
              </div>
              <span className="text-xs font-medium text-muted-foreground min-w-10.5 text-right">
                Pág/Min
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between py-2 px-1 rounded-lg hover:bg-muted/30 transition-colors gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className={cn(
                  "shrink-0 p-2 rounded-xl bg-cyan-500/10",
                  theme.text,
                )}
              >
                <BarChart3 className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1 gap-0.5 text-left">
                <span className="text-xs font-bold text-foreground truncate">
                  Dias analisados
                </span>
                <span className="text-[10px] font-medium text-muted-foreground">
                  Período avaliado
                </span>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold shrink-0 bg-muted/40 text-muted-foreground border border-border/40">
                <span>{summary.totalDaysAnalyzed}d</span>
              </div>
              <span className="text-xs font-medium text-muted-foreground min-w-10.5 text-right">
                Total
              </span>
            </div>
          </div>
        </div>

        {summary.peakStudySubject && (
          <div className="pt-2 border-t border-border/40 flex items-center justify-between text-left">
            <span className="text-[10px] font-bold text-muted-foreground">
              Foco principal
            </span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-md text-xs font-bold bg-cyan-500/10 border border-cyan-500/20",
                theme.text,
              )}
            >
              {summary.peakStudySubject}
            </span>
          </div>
        )}
      </div>
    </BaseWidget>
  );
}
