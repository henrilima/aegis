"use client";

import type { CrossMetric } from "../types";

interface CorrelationChartProps {
  metrics: CrossMetric[];
}

/**
 * Gráfico comparativo de barras para visualizar relação entre sono, estudo e acerto
 */
export function CorrelationChart({ metrics }: CorrelationChartProps) {
  // Encontra os limites para cálculo das escalas
  const maxStudy = Math.max(...metrics.map((m) => m.study_hours), 0.1);
  const maxSleep = Math.max(...metrics.map((m) => m.sleep_hours), 0.1);

  if (metrics.length === 0) {
    return (
      <p className=" text-neutral-600 text-center py-6 italic font-medium">
        Dados insuficientes para gerar visualização temporal.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Legenda simples */}
      <div className="flex items-center gap-4 text-[10px] font-black uppercase text-neutral-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-violet-500 shadow-sm" />
          Estudo
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm" />
          Sono
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 shadow-sm" />%
          Acerto
        </span>
      </div>

      <div className="overflow-x-auto scrollbar-hide">
        <div
          className="flex items-end gap-1.5 pb-2 ml-auto"
          style={{ minWidth: `${Math.min(metrics.length * 36, 1200)}px` }}
        >
          {metrics.slice(-30).map((m) => {
            const studyPct = (m.study_hours / maxStudy) * 100;
            const sleepPct = (m.sleep_hours / maxSleep) * 100;
            const hitPct = m.study_hit_rate;
            const day = m.date.slice(8, 10);

            return (
              <div
                key={m.date}
                className="flex flex-col items-center gap-1 flex-1 min-w-8 group"
              >
                {/* Agrupador vertical das barras do dia */}
                <div className="flex items-end gap-0.5 h-32 w-full">
                  {/* Barra: Sono */}
                  <div
                    className="flex-1 rounded-t-sm bg-blue-500/40 hover:bg-blue-500/80 transition-all duration-300"
                    style={{ height: `${sleepPct}%` }}
                    title={`Sono: ${m.sleep_hours.toFixed(1)}h`}
                  />
                  {/* Barra: Estudo */}
                  <div
                    className="flex-1 rounded-t-sm bg-violet-500/50 hover:bg-violet-500/90 transition-all duration-300"
                    style={{ height: `${studyPct}%` }}
                    title={`Estudo: ${m.study_hours.toFixed(1)}h`}
                  />
                  {/* Barra: Acerto */}
                  {m.questions_total > 0 && (
                    <div
                      className="flex-1 rounded-t-sm bg-green-500/50 hover:bg-green-500/90 transition-all duration-300"
                      style={{ height: `${hitPct}%` }}
                      title={`Acerto: ${m.study_hit_rate}%`}
                    />
                  )}
                </div>
                {/* Rótulo do eixo X */}
                <span className="text-[10px] text-neutral-700 font-bold group-hover:text-neutral-400 transition-colors">
                  {day}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
