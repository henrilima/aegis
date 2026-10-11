"use client";

import {
  ChevronLeft,
  ChevronRight,
  Flame,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
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
  /** Cor identitária do módulo (ex: "emerald", "blue", "orange", "violet", "cyan") */
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

const COLOR_LEVELS: Record<string, Record<0 | 1 | 2 | 3 | 4, string>> = {
  emerald: {
    0: "bg-muted/40 border border-border/30",
    1: "bg-emerald-500/25 border border-emerald-500/35 text-emerald-400",
    2: "bg-emerald-500/50 border border-emerald-500/60 text-emerald-300",
    3: "bg-emerald-500/75 border border-emerald-500/85 text-emerald-200",
    4: "bg-emerald-500 border border-emerald-400 text-white font-bold",
  },
  blue: {
    0: "bg-muted/40 border border-border/30",
    1: "bg-blue-500/25 border border-blue-500/35 text-blue-400",
    2: "bg-blue-500/50 border border-blue-500/60 text-blue-300",
    3: "bg-blue-500/75 border border-blue-500/85 text-blue-200",
    4: "bg-blue-500 border border-blue-400 text-white font-bold",
  },
  indigo: {
    0: "bg-muted/40 border border-border/30",
    1: "bg-indigo-500/25 border border-indigo-500/35 text-indigo-400",
    2: "bg-indigo-500/50 border border-indigo-500/60 text-indigo-300",
    3: "bg-indigo-500/75 border border-indigo-500/85 text-indigo-200",
    4: "bg-indigo-500 border border-indigo-400 text-white font-bold",
  },
  violet: {
    0: "bg-muted/40 border border-border/30",
    1: "bg-violet-500/25 border border-violet-500/35 text-violet-400",
    2: "bg-violet-500/50 border border-violet-500/60 text-violet-300",
    3: "bg-violet-500/75 border border-violet-500/85 text-violet-200",
    4: "bg-violet-500 border border-violet-400 text-white font-bold",
  },
  rose: {
    0: "bg-muted/40 border border-border/30",
    1: "bg-rose-500/25 border border-rose-500/35 text-rose-400",
    2: "bg-rose-500/50 border border-rose-500/60 text-rose-300",
    3: "bg-rose-500/75 border border-rose-500/85 text-rose-200",
    4: "bg-rose-500 border border-rose-400 text-white font-bold",
  },
  amber: {
    0: "bg-muted/40 border border-border/30",
    1: "bg-amber-500/25 border border-amber-500/35 text-amber-400",
    2: "bg-amber-500/50 border border-amber-500/60 text-amber-300",
    3: "bg-amber-500/75 border border-amber-500/85 text-amber-200",
    4: "bg-amber-500 border border-amber-400 text-white font-bold",
  },
  cyan: {
    0: "bg-muted/40 border border-border/30",
    1: "bg-cyan-500/25 border border-cyan-500/35 text-cyan-400",
    2: "bg-cyan-500/50 border border-cyan-500/60 text-cyan-300",
    3: "bg-cyan-500/75 border border-cyan-500/85 text-cyan-200",
    4: "bg-cyan-500 border border-cyan-400 text-white font-bold",
  },
};

function getCellLevelStyle(colorKey: string, level: 0 | 1 | 2 | 3 | 4): string {
  const normColor = colorKey.toLowerCase();
  const palette = COLOR_LEVELS[normColor] || COLOR_LEVELS.emerald;
  return palette[level];
}

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
  const [hoveredCell, setHoveredCell] = useState<{
    date: string;
    left: number;
    top: number;
  } | null>(null);

  const gridContainerRef = useRef<HTMLDivElement>(null);
  const theme = getColorTheme(color);

  const dates = useMemo(() => getYearDates(selectedYear), [selectedYear]);

  // Informações do dia sob o cursor calculadas sob demanda
  const hoveredInfo = useMemo(() => {
    if (!hoveredCell?.date) return null;
    const [y, m, d] = hoveredCell.date.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dateLabel = dateObj.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
    const item = data[hoveredCell.date];
    const count = item?.count || 0;
    const details =
      item?.details || (count > 0 ? `${count} ${unitLabel}` : "Sem registros");
    return { dateLabel, details };
  }, [hoveredCell?.date, data, unitLabel]);

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
        label: unitLabel.charAt(0).toUpperCase() + unitLabel.slice(1),
        value: totalCount,
        colorClass: theme.text,
      },
      {
        label: "Dias ativos",
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

  const handleCellMouseEnter = (
    date: string,
    e: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (!gridContainerRef.current) return;
    const containerRect = gridContainerRef.current.getBoundingClientRect();
    const targetRect = e.currentTarget.getBoundingClientRect();

    setHoveredCell({
      date,
      left: targetRect.left - containerRect.left + targetRect.width / 2,
      top: targetRect.top - containerRect.top,
    });
  };

  const handleCellMouseLeave = () => {
    setHoveredCell(null);
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-5 w-full relative overflow-hidden backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn("p-2.5 rounded-xl border", theme.bg, theme.border)}
          >
            <HeaderIcon className={cn("w-5 h-5", theme.text)} />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground leading-none">
              {title}
            </h2>
            {hoveredInfo ? (
              <p className="text-xs font-bold mt-1 flex items-center gap-1.5 transition-all">
                <span className={cn("capitalize font-bold", theme.text)}>
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
          <div className="flex items-center gap-1.5 bg-background p-1 border border-border/60 rounded-xl relative z-10">
            <button
              type="button"
              onClick={() => setSelectedYear((prev) => prev - 1)}
              className="p-1 rounded-lg hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className={cn("text-xs font-bold px-1.5", theme.text)}>
              {selectedYear}
            </span>
            <button
              type="button"
              onClick={() => setSelectedYear((prev) => prev + 1)}
              className="p-1 rounded-lg hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
              disabled={selectedYear >= currentYear}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-7 w-px bg-border/60 mx-1 hidden sm:block" />

          {/* Estatísticas rápidas */}
          <div className="hidden sm:flex items-center gap-5">
            {displayStats.map((st) => (
              <div key={st.label} className="flex flex-col items-end">
                <span
                  className={cn(
                    "font-bold leading-none text-sm",
                    st.colorClass || "text-foreground",
                  )}
                >
                  {st.value}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground mt-0.5">
                  {st.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grade do Heatmap */}
      <div className="w-full overflow-x-auto py-1 custom-scrollbar">
        <div
          ref={gridContainerRef}
          className="min-w-175 flex flex-col gap-2 relative"
        >
          {/* Tooltip flutuante ultrarrápido */}
          {hoveredCell && hoveredInfo && (
            <div
              style={{
                left: `${hoveredCell.left}px`,
                top: `${hoveredCell.top - 8}px`,
                transform: "translate(-50%, -100%)",
              }}
              className="pointer-events-none select-none absolute z-50 flex flex-col gap-0.5 max-w-xs bg-popover/95 backdrop-blur-md border border-border text-foreground text-xs p-2.5 rounded-xl transition-all duration-75"
            >
              <span className={cn("font-bold capitalize", theme.text)}>
                {hoveredInfo.dateLabel}
              </span>
              <span className="text-muted-foreground leading-snug">
                {hoveredInfo.details}
              </span>
            </div>
          )}

          {/* Rótulos dos Meses */}
          <div className="h-4 relative w-full pl-8">
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
          <div className="grid grid-cols-[24px_1fr] gap-2 items-stretch">
            {/* Rótulos dos Dias da Semana */}
            <div className="flex flex-col gap-1.5 text-[9px] text-muted-foreground font-bold py-px">
              {WEEK_LABELS.map((day) => (
                <div
                  key={day.id}
                  className="flex-1 flex items-center justify-end pr-1 min-h-0"
                >
                  <span className="leading-none">{day.label}</span>
                </div>
              ))}
            </div>

            {/* Colunas por semana */}
            <div className="flex gap-1.5 flex-1">
              {Array.from({ length: Math.ceil(dates.length / 7) }).map(
                (_, ci) => (
                  <div
                    key={dates[ci * 7]}
                    className="flex-1 flex flex-col gap-1.5"
                  >
                    {dates.slice(ci * 7, (ci + 1) * 7).map((date) => {
                      const isSameYear = date.startsWith(String(selectedYear));
                      const item = data[date];
                      const count = item?.count || 0;
                      const intensity = isSameYear ? getIntensity(count) : 0;

                      return (
                        <div
                          key={date}
                          onMouseEnter={(e) =>
                            isSameYear && handleCellMouseEnter(date, e)
                          }
                          onMouseLeave={handleCellMouseLeave}
                          className={cn(
                            "aspect-square w-full rounded-xs transition-all duration-150 hover:scale-135 hover:z-20 cursor-pointer",
                            !isSameYear
                              ? "opacity-0 pointer-events-none"
                              : getCellLevelStyle(color, intensity),
                          )}
                        />
                      );
                    })}
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Legenda de Intensidade */}
      <div className="flex items-center justify-end gap-2 text-[10px] text-muted-foreground font-semibold pt-3 border-t border-border/40">
        <span>Menos</span>
        {([0, 1, 2, 3, 4] as const).map((lvl) => (
          <div
            key={lvl}
            className={cn("w-3 h-3 rounded-xs", getCellLevelStyle(color, lvl))}
          />
        ))}
        <span>Mais</span>
      </div>
    </div>
  );
}
