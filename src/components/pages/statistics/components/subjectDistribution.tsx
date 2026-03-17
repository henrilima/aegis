"use client";

import { BookOpen } from "lucide-react";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import type { PerformanceSummary } from "../types";

interface SubjectDistributionProps {
  summary: PerformanceSummary;
}

/**
 * Visualização da carga horária e performance distribuídas entre as matérias estudadas
 */
export function SubjectDistribution({ summary }: SubjectDistributionProps) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col gap-5 overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-4 h-4 text-violet-400" />
          <h2 className="text-[10px] font-bold text-neutral-400">
            Distribuição de Esforço por Matéria
          </h2>
        </div>
        <ToolTip content="Distribuição do tempo total de estudo e taxa de acerto entre as 5 matérias mais estudadas.">
          <div className="text-[10px] text-neutral-600 cursor-help hover:text-neutral-400 transition-colors">
            O que é isso?
          </div>
        </ToolTip>
      </div>

      <div className="flex flex-col gap-3.5">
        {summary.subject_distribution.slice(0, 5).map((s) => (
          <div key={s.name} className="flex flex-col gap-1.5 group">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-neutral-300 truncate max-w-[170px] group-hover:text-white transition-colors">
                {s.name}
              </span>
              <span className="text-neutral-500 font-bold">
                {s.hours.toFixed(1)}h ·{" "}
                <span className="text-violet-400">{s.hit_rate}%</span>
              </span>
            </div>

            {/* Barra de distribuição percentual do esforço total */}
            <div className="h-2 w-full bg-neutral-800/80 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-violet-600/80 rounded-full transition-all duration-700 hover:bg-violet-500"
                style={{ width: `${s.percent_total}%` }}
              />
            </div>
          </div>
        ))}

        {/* Caso não existam dados */}
        {summary.subject_distribution.length === 0 && (
          <div className="text-center py-10 opacity-30">
            <span className="text-xs text-neutral-600 font-bold">
              Nenhuma matéria registrada
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
