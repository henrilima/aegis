"use client";

import { Activity, TrendingDown, TrendingUp } from "lucide-react";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import type { PerformanceSummary } from "../types";

interface CorrelationInsightProps {
  summary: PerformanceSummary;
}

/**
 * Card de síntese que traduz dados matemáticos em texto informativo (insights)
 */
export function CorrelationInsight({ summary }: CorrelationInsightProps) {
  const isPositive = summary.correlation_label === "Positiva";
  const isNegative = summary.correlation_label === "Negativa";

  // Define o ícone e cor baseado no tipo de correlação
  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Activity;
  const color = isPositive ? "#22c55e" : isNegative ? "#ef4444" : "#94a3b8";

  return (
    <div
      className="rounded-xl p-5 border flex items-start gap-4 transition-all"
      style={{ backgroundColor: `${color}08`, borderColor: `${color}25` }}
    >
      <div
        className="p-2.5 rounded-xl shrink-0 shadow-sm"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>

      <div className="flex flex-col gap-1 flex-1">
        <div className="flex items-center justify-between">
          <span className="font-bold" style={{ color }}>
            Correlação {summary.correlation_label}: Sono x Acerto
          </span>
          <ToolTip content="Análise automatizada que identifica tendências entre seus hábitos e seu rendimento acadêmico.">
            <div className="text-[10px] text-neutral-600 cursor-help hover:text-neutral-400 transition-colors">
              Como funciona?
            </div>
          </ToolTip>
        </div>
        <p className=" text-neutral-500 leading-relaxed font-medium">
          {isPositive
            ? "Métricas indicam que maiores períodos de sono impactam positivamente sua produtividade. Priorizar o descanso está rendendo resultados diretos nos estudos!"
            : isNegative
              ? "A performance cai quando os períodos de sono flutuam excessivamente. Tente padronizar seu horário para estabilizar a taxa de acerto."
              : "Não há uma correlação estatística clara entre sono e acerto no momento. Outros fatores externos podem estar influenciando sua performance diária."}
        </p>
      </div>
    </div>
  );
}
