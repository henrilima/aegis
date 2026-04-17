"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDuration, qualityLabel } from "../sleepUtils";
import type { SleepEntry } from "../types";

interface SleepChartProps {
  weekDays: { label: string; entry?: SleepEntry }[];
  targetMinutes: number;
}

/**
 * Gráfico de barras que compara o sono diário com a meta estabelecida
 */
export function SleepChart({ weekDays, targetMinutes }: SleepChartProps) {
  // Encontra o valor máximo para escala do gráfico
  const maxMins = Math.max(
    targetMinutes * 1.5,
    ...weekDays.map((d) => d.entry?.duration_minutes ?? 0),
    1,
  );

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h2 className=" font-black uppercase text-muted-foreground mb-4">
        Sono por Dia
      </h2>
      <div className="flex items-end gap-2 h-32">
        {weekDays.map(({ label, entry }) => {
          const dur = entry?.duration_minutes ?? 0;
          const pct = (dur / maxMins) * 100;
          const targetPct = (targetMinutes / maxMins) * 100;

          return (
            <div
              key={label}
              className="flex-1 flex flex-col items-center gap-1 h-full justify-end"
            >
              <div className="w-full flex flex-col justify-end relative h-[90%]">
                {/* Linha pontilhada da meta */}
                <div
                  className="absolute w-full border-t border-dashed border-blue-500/30 z-0"
                  style={{ bottom: `${targetPct}%` }}
                />

                {dur > 0 && entry ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={`w-full rounded-t-lg transition-all relative z-10 ${
                          entry.quality >= 4
                            ? "bg-blue-500"
                            : entry.quality === 3
                              ? "bg-blue-400/60"
                              : "bg-blue-300/40"
                        }`}
                        style={{ height: `${pct}%` }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      {formatDuration(dur)} · {qualityLabel(entry.quality)}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <div className="w-full h-1 rounded-full bg-muted relative z-10" />
                )}
              </div>
              <span className="text-[10px] text-neutral-600 font-bold">
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legenda do gráfico */}
      <div className="flex items-center gap-2 mt-3">
        <div className="w-4 border-t border-dashed border-blue-500/50" />
        <span className="text-[10px] text-blue-400/60 font-medium">
          Meta ({formatDuration(targetMinutes)})
        </span>
      </div>
    </div>
  );
}
