"use client";

import {
  ChevronLeft,
  ChevronRight,
  Flame,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, getColorTheme } from "@/lib/utils";

export interface HeatmapItem {
  count: number;
  details?: string;
}

export interface ActivityHeatmapStat {
  label: string;
  value: string | number;
  colorClass?: string;
}

export interface ActivityHeatmapProps {
  /** Cor identitária do módulo (ex: "blue", "orange", "violet", "emerald") */
  color: string;
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  /** Objeto onde a chave é YYYY-MM-DD e o valor traz count e detalhes do dia */
  data: Record<string, HeatmapItem>;
  /** Rótulo da métrica principal em minúsculas (ex: "cartões", "sessões", "hábitos") */
  unitLabel?: string;
  /** Estatísticas resumidas exibidas no canto superior direito do cabeçalho */
  stats?: ActivityHeatmapStat[];
}

const WEEK_LABELS = [
  { id: "sun", label: "D" },
  { id: "mon", label: "S" },
  { id: "tue", label: "T" },
  { id: "wed", label: "Q" },
  { id: "thu", label: "Q" },
  { id: "fri", label: "S" },
  { id: "sat", label: "S" },
];

const MONTH_LABELS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

const INTENSITY_LEVELS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-muted/40 border border-border/20",
  1: "opacity-30",
  2: "opacity-55",
  3: "opacity-80",
  4: "opacity-100",
};

function getIntensity(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4;
}

function getYearDates(year: number): string[] {
  const dates: string[] = [];
  const firstJan = new Date(year, 0, 1);
  const startDay = new Date(firstJan);

  const diff = -startDay.getDay();
  startDay.setDate(startDay.getDate() + diff);

  const lastDec = new Date(year, 11, 31);
  const endDay = new Date(lastDec);
  const diffEnd = 6 - endDay.getDay();
  endDay.setDate(endDay.getDate() + diffEnd);

  const current = new Date(startDay);
  while (current <= endDay) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const d = String(current.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export function ActivityHeatmap({
  color,
  title = "Mapa de Constância",
  subtitle,
  icon: HeaderIcon = Flame,
  data,
  unitLabel = "atividades",
  stats,
}: ActivityHeatmapProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const theme = getColorTheme(color);

  const dates = useMemo(() => getYearDates(selectedYear), [selectedYear]);

  const hoveredInfo = useMemo(() => {
    if (!hoveredDate) return null;
    const [y, m, d] = hoveredDate.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dateLabel = dateObj.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "long",
    });
    const item = data[hoveredDate];
    const count = item?.count || 0;
    const details =
      item?.details || (count > 0 ? `${count} ${unitLabel}` : "Sem registros");
    return { dateLabel, details };
  }, [hoveredDate, data, unitLabel]);

  // Estatísticas calculadas se não forem fornecidas explicitamente
  const computedStats = useMemo(() => {
    let totalCount = 0;
    let activeDays = 0;

    for (const date of dates) {
      if (date.startsWith(String(selectedYear)) && data[date]) {
        const item = data[date];
        if (item.count > 0) {
          totalCount += item.count;
          activeDays += 1;
        }
      }
    }

    return [
      {
        label: unitLabel.toUpperCase(),
        value: totalCount,
        colorClass: theme.text,
      },
      {
        label: "DIAS ATIVOS",
        value: activeDays,
        colorClass: "text-foreground",
      },
    ];
  }, [dates, selectedYear, data, unitLabel, theme.text]);

  const displayStats = stats || computedStats;

  const monthLabels = useMemo(() => {
    const labels: Array<{ label: string; colIdx: number }> = [];
    let lastMonth = -1;
    for (let ci = 0; ci < dates.length / 7; ci++) {
      const dateStr = dates[ci * 7 + 3];
      const mIdx = Number(dateStr.slice(5, 7)) - 1;
      if (mIdx !== lastMonth) {
        labels.push({ label: MONTH_LABELS[mIdx], colIdx: ci });
        lastMonth = mIdx;
      }
    }
    return labels;
  }, [dates]);

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-6 w-full relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <div
            className={cn("p-2.5 rounded-xl border", theme.bg, theme.border)}
          >
            <HeaderIcon className={cn("w-5 h-5", theme.text)} />
          </div>
          <div>
            <h2 className="text-lg font-black text-foreground leading-none">
              {title}
            </h2>
            {hoveredInfo ? (
              <p className="text-xs font-bold mt-1 animate-in fade-in duration-150 flex items-center gap-1.5">
                <span className={cn("capitalize font-extrabold", theme.text)}>
                  {hoveredInfo.dateLabel}:
                </span>
                <span className="text-foreground">{hoveredInfo.details}</span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                {subtitle || `Frequência de ${unitLabel} em ${selectedYear}`}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Seletor de ano */}
          <div className="flex items-center gap-2 bg-background p-1 border border-border rounded-xl relative z-10">
            <button
              type="button"
              onClick={() => setSelectedYear((prev) => prev - 1)}
              className="p-1.5 rounded-lg hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className={cn("text-xs font-black px-2", theme.text)}>
              {selectedYear}
            </span>
            <button
              type="button"
              onClick={() => setSelectedYear((prev) => prev + 1)}
              className="p-1.5 rounded-lg hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
              disabled={selectedYear >= currentYear}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="h-8 w-px bg-border/60 mx-1 hidden sm:block" />

          {/* Estatísticas rápidas */}
          <div className="hidden sm:flex items-center gap-6">
            {displayStats.map((st) => (
              <div key={st.label} className="flex flex-col items-end">
                <span
                  className={cn(
                    "font-black leading-none text-sm",
                    st.colorClass || "text-foreground",
                  )}
                >
                  {st.value}
                </span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                  {st.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grade do Heatmap */}
      <TooltipProvider delayDuration={0}>
        <div className="w-full overflow-x-auto py-2">
          <div className="min-w-[700px] flex flex-col gap-2">
            {/* Rótulos dos Meses */}
            <div className="h-4 relative w-full pl-[36px]">
              {monthLabels.map((ml) => (
                <div
                  key={ml.label + ml.colIdx}
                  className="absolute text-[10px] text-muted-foreground font-bold"
                  style={{
                    left: `${(ml.colIdx / (dates.length / 7)) * 100}%`,
                  }}
                >
                  {ml.label}
                </div>
              ))}
            </div>

            {/* Grid dos Dias */}
            <div className="grid grid-cols-[28px_1fr] gap-2 items-stretch">
              {/* Rótulos dos Dias da Semana */}
              <div className="flex flex-col gap-1 text-[9px] text-muted-foreground font-bold py-[1px]">
                {WEEK_LABELS.map((day) => (
                  <div
                    key={day.id}
                    className="flex-1 flex items-center justify-end pr-1.5 min-h-0"
                  >
                    <span className="leading-none">{day.label}</span>
                  </div>
                ))}
              </div>

              {/* Colunas por semana */}
              <div className="flex gap-1 flex-1">
                {Array.from({ length: Math.ceil(dates.length / 7) }).map(
                  (_, ci) => (
                    <div
                      key={dates[ci * 7]}
                      className="flex-1 flex flex-col gap-1"
                    >
                      {dates.slice(ci * 7, (ci + 1) * 7).map((date) => {
                        const isSameYear = date.startsWith(
                          String(selectedYear),
                        );
                        const item = data[date];
                        const count = item?.count || 0;
                        const intensity = isSameYear ? getIntensity(count) : 0;

                        const [y, m, d] = date.split("-").map(Number);
                        const dateObj = new Date(y, m - 1, d);
                        const dateLabel = dateObj.toLocaleDateString("pt-BR", {
                          weekday: "long",
                          day: "2-digit",
                          month: "long",
                        });

                        const tooltipText =
                          item?.details ||
                          (count > 0
                            ? `${count} ${unitLabel}`
                            : "Sem registros");

                        return (
                          <Tooltip key={date}>
                            <TooltipTrigger asChild>
                              {/* biome-ignore lint/a11y/noStaticElementInteractions: Interatividade de hover do mapa de calor */}
                              <div
                                onMouseEnter={() => setHoveredDate(date)}
                                onMouseLeave={() => setHoveredDate(null)}
                                className={cn(
                                  "aspect-square w-full rounded-[2px] transition-all hover:scale-150 hover:z-20 cursor-pointer",
                                  !isSameYear
                                    ? "opacity-0 pointer-events-none"
                                    : intensity === 0
                                      ? INTENSITY_LEVELS[0]
                                      : cn(
                                          theme.solid,
                                          INTENSITY_LEVELS[intensity],
                                        ),
                                )}
                              />
                            </TooltipTrigger>
                            {isSameYear && (
                              <TooltipContent
                                side="top"
                                sideOffset={8}
                                style={{ pointerEvents: "none" }}
                                className="pointer-events-none select-none z-[9999] flex flex-col gap-0.5 max-w-xs bg-popover/95 backdrop-blur-md border border-border text-foreground text-xs p-2 rounded-xl shadow-xl"
                              >
                                <span
                                  className={cn(
                                    "font-bold capitalize",
                                    theme.text,
                                  )}
                                >
                                  {dateLabel}
                                </span>
                                <span className="text-muted-foreground leading-snug">
                                  {tooltipText}
                                </span>
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

      {/* Legenda de Intensidade */}
      <div className="flex items-center justify-end gap-2 text-[10px] text-muted-foreground font-semibold pt-3 border-t border-border/40">
        <span>Menos</span>
        {[0, 1, 2, 3, 4].map((lvl) => (
          <div
            key={lvl}
            className={cn(
              "w-3 h-3 rounded-[2px]",
              lvl === 0
                ? INTENSITY_LEVELS[0]
                : cn(theme.solid, INTENSITY_LEVELS[lvl as 1 | 2 | 3 | 4]),
            )}
          />
        ))}
        <span>Mais</span>
      </div>
    </div>
  );
}
