"use client";

import { cn, type getColorTheme } from "@/lib/utils";

interface HeatmapFooterProps {
  years: number[];
  selectedYear: number;
  onYearSelect: (year: number) => void;
  intensityLevels: Record<0 | 1 | 2 | 3 | 4, string>;
  theme: ReturnType<typeof getColorTheme>;
}

export function HeatmapFooter({
  years,
  selectedYear,
  onYearSelect,
  intensityLevels,
  theme,
}: HeatmapFooterProps) {
  return (
    <div className="flex items-center justify-between mt-2 pt-5 border-t border-border/50">
      <div className="flex items-center gap-1.5 p-1.5 bg-background/40 rounded-xl border border-border relative z-10">
        {years.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => onYearSelect(y)}
            className={cn(
              "px-3 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer",
              selectedYear === y
                ? cn("text-white", theme.solid)
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
            )}
          >
            {y}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <span className="text-[10px] font-bold text-neutral-600">
          Intensidade
        </span>
        <div className="flex gap-1.5">
          {[0, 1, 2, 3, 4].map((v) => (
            <div
              key={v}
              className={cn(
                "w-3.5 h-3.5 rounded-[2px]",
                v === 0
                  ? intensityLevels[0]
                  : cn(theme.solid, intensityLevels[v as 0 | 1 | 2 | 3 | 4]),
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
