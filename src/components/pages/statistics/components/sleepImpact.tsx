"use client";

import { Moon } from "lucide-react";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import type { PerformanceSummary } from "../types";

interface SleepImpactProps {
  summary: PerformanceSummary;
}

/**
 * Métrica de Correlação: Impacto dos ciclos de sono na taxa de acerto acadêmico
 */
export function SleepImpact({ summary }: SleepImpactProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-6 overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-500/10 rounded-lg">
            <Moon className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <h2 className="text-[10px] font-bold text-muted-foreground">
            Impacto do Sono na Performance
          </h2>
        </div>
        <ToolTip content="Relaciona o acerto nas questões com a quantidade de horas dormidas na noite anterior.">
          <div className="text-[10px] text-neutral-600 cursor-help hover:text-muted-foreground transition-colors">
            O que é isso?
          </div>
        </ToolTip>
      </div>

      <div className="flex flex-col gap-6">
        {/* Camada: Performance em Estado de Repouso Ideal */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-[10px] font-bold">
            <span className="text-green-400">Descansado ({">"}7.5h)</span>
            <span className="text-green-500 tabular-nums">
              {summary.rested_hit_rate.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 w-full bg-background rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-1000 ease-out"
              style={{ width: `${summary.rested_hit_rate}%` }}
            />
          </div>
        </div>

        {/* Camada: Performance em Estado de Deprivação */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-[10px] font-bold">
            <span className="text-red-600 dark:text-red-400">
              Privação de Sono ({"<"}6h)
            </span>
            <span className="text-red-500 tabular-nums">
              {summary.tired_hit_rate.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 w-full bg-background rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all duration-1000 ease-out"
              style={{ width: `${summary.tired_hit_rate}%` }}
            />
          </div>
        </div>

        <p className="text-[9px] text-neutral-700 italic font-bold leading-tight mt-2 border-t border-border/50 pt-4">
          *Indicador gerado através do cruzamento entre logs biométricos de sono
          e métricas de acerto do módulo de estudos.
        </p>
      </div>
    </div>
  );
}
