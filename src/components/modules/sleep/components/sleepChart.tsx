"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
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
  const color = getModuleColor("sleep");
  const theme = getColorTheme(color);
  // Encontra o valor máximo para escala do gráfico
  const maxMins = Math.max(
    targetMinutes * 1.5,
    ...weekDays.map((d) => d.entry?.durationMinutes ?? 0),
    1,
  );

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h2 className=" font-bold text-muted-foreground mb-4">Sono por Dia</h2>
      <div className="flex items-end gap-2 h-32">
        {weekDays.map(({ label, entry }) => {
          const dur = entry?.durationMinutes ?? 0;
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
                  className={cn(
                    "absolute w-full border-t border-dashed z-0",
                    theme.border.replace("/20", "/30"),
                  )}
                  style={{ bottom: `${targetPct}%` }}
                />

                {dur > 0 && entry ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "w-full rounded-t-lg transition-all relative z-10",
                          entry.quality >= 4
                            ? theme.solid
                            : entry.quality === 3
                              ? cn(theme.solid, "opacity-60")
                              : cn(theme.solid, "opacity-30"),
                        )}
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
        <div
          className={cn(
            "w-4 border-t border-dashed",
            theme.border.replace("/20", "/50"),
          )}
        />
        <span className={cn("text-[10px] font-medium opacity-60", theme.text)}>
          Meta ({formatDuration(targetMinutes)})
        </span>
      </div>
    </div>
  );
}
