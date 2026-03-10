"use client";

import { Moon } from "lucide-react";
import type { PerformanceSummary } from "../types";

interface SleepImpactProps {
  summary: PerformanceSummary;
}

/**
 * Métrica de Correlação: Impacto dos ciclos de sono na taxa de acerto acadêmico
 */
export function SleepImpact({ summary }: SleepImpactProps) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col gap-6 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-500/10 rounded-lg">
          <Moon className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <h2 className="text-[10px] font-black uppercase text-neutral-500">
          Impacto do Sono na Performance
        </h2>
      </div>

      <div className="flex flex-col gap-6">
        {/* Camada: Performance em Estado de Repouso Ideal */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-[10px] font-black uppercase">
            <span className="text-green-400">Descansado ({">"}7.5h)</span>
            <span className="text-green-500 tabular-nums">
              {summary.rested_hit_rate.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 w-full bg-neutral-950 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-linear-to-r from-green-600 to-green-400 transition-all duration-1000 ease-out shadow-lg shadow-green-600/20"
              style={{ width: `${summary.rested_hit_rate}%` }}
            />
          </div>
        </div>

        {/* Camada: Performance em Estado de Deprivação */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-[10px] font-black uppercase">
            <span className="text-red-400">Privação de Sono ({"<"}6h)</span>
            <span className="text-red-500 tabular-nums">
              {summary.tired_hit_rate.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 w-full bg-neutral-950 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-linear-to-r from-red-600 to-red-400 transition-all duration-1000 ease-out shadow-lg shadow-red-600/20"
              style={{ width: `${summary.tired_hit_rate}%` }}
            />
          </div>
        </div>

        <p className="text-[9px] text-neutral-700 italic font-bold leading-tight mt-2 border-t border-neutral-800/50 pt-4">
          *Indicador gerado através do cruzamento entre logs biométricos de sono
          e métricas de acerto do módulo de estudos.
        </p>
      </div>
    </div>
  );
}
