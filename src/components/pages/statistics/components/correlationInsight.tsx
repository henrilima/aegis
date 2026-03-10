"use client";

import { Activity, TrendingDown, TrendingUp } from "lucide-react";
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
      className="rounded-2xl p-5 border flex items-start gap-4 transition-all"
      style={{ backgroundColor: `${color}08`, borderColor: `${color}25` }}
    >
      <div
        className="p-2.5 rounded-xl shrink-0 shadow-sm"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-black uppercase" style={{ color }}>
          Correlação {summary.correlation_label}: Sono × Acerto
        </span>
        <p className="text-sm text-neutral-500 leading-relaxed font-medium">
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
