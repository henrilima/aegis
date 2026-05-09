"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, type getColorTheme } from "@/lib/utils";

interface WeekLabel {
  id: string;
  label: string;
}

interface MonthLabel {
  label: string;
  colIdx: number;
}

interface HeatmapGridProps {
  dates: string[];
  weekLabels: WeekLabel[];
  monthLabels: MonthLabel[];
  selectedYear: number;
  statsMap: Record<string, { questions: number; hours: number; count: number }>;
  intensityLevels: Record<0 | 1 | 2 | 3 | 4, string>;
  getIntensity: (count: number) => 0 | 1 | 2 | 3 | 4;
  theme: ReturnType<typeof getColorTheme>;
}

export function HeatmapGrid({
  dates,
  weekLabels,
  monthLabels,
  selectedYear,
  statsMap,
  intensityLevels,
  getIntensity,
  theme,
}: HeatmapGridProps) {
  return (
    <TooltipProvider>
      <div className="w-full h-fit py-4">
        <div className="grid grid-cols-[30px_1fr] gap-4 h-fit">
          {/* Rótulos dos dias */}
          <div className="flex flex-col gap-1 pt-8 pb-4">
            {weekLabels.map((day) => (
              <div
                key={day.id}
                className="flex-1 flex items-center justify-end"
              >
                <span className="text-[9px] text-neutral-600 font-bold leading-none">
                  {day.label}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            {/* Rótulos dos meses */}
            <div className="h-4 relative w-full pr-8">
              {monthLabels.map((ml) => (
                <div
                  key={ml.label + ml.colIdx}
                  className="absolute text-[10px] text-muted-foreground font-bold"
                  style={{ left: `${(ml.colIdx / (dates.length / 7)) * 100}%` }}
                >
                  {ml.label}
                </div>
              ))}
            </div>

            {/* Grid do Heatmap */}
            <div className="flex gap-1 w-full h-fit pr-8 pb-4">
              {Array.from({ length: Math.ceil(dates.length / 7) }).map(
                (_, ci) => (
                  <div
                    key={dates[ci * 7]}
                    className="flex-1 flex flex-col gap-1"
                  >
                    {dates.slice(ci * 7, (ci + 1) * 7).map((date) => {
                      const isSameYear = date.startsWith(String(selectedYear));
                      const stats = statsMap[date];
                      const questions = stats?.questions || 0;
                      const hours = stats?.hours || 0;
                      const sessionsCount = stats?.count || 0;
                      const intensity = getIntensity(sessionsCount);

                      const [y, m, d] = date.split("-").map(Number);
                      const dateObj = new Date(y, m - 1, d);
                      const dateLabel = dateObj.toLocaleDateString("pt-BR", {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                      });

                      const tooltipText =
                        sessionsCount > 0
                          ? `${sessionsCount} ${sessionsCount !== 1 ? "sessões" : "sessão"} · ${hours.toFixed(1)}h · ${questions} questões`
                          : "Sem registros";

                      return (
                        <Tooltip key={date} delayDuration={0}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "aspect-square w-full rounded-[2px] transition-all hover:scale-150 hover:z-20 cursor-pointer",
                                !isSameYear
                                  ? "opacity-0 pointer-events-none"
                                  : intensity === 0
                                    ? intensityLevels[0]
                                    : cn(
                                        theme.solid,
                                        intensityLevels[intensity],
                                      ),
                              )}
                            />
                          </TooltipTrigger>
                          {isSameYear && (
                            <TooltipContent
                              side="top"
                              className="flex flex-col gap-0.5 pointer-events-none select-none"
                            >
                              <span
                                className={cn(
                                  "font-bold capitalize",
                                  theme.text,
                                )}
                              >
                                {dateLabel}
                              </span>
                              <span>{tooltipText}</span>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      );
                    })}
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
