"use client";

interface HeatmapFooterProps {
  years: number[];
  selectedYear: number;
  onYearSelect: (year: number) => void;
  intensityColors: Record<0 | 1 | 2 | 3 | 4, string>;
}

export function HeatmapFooter({
  years,
  selectedYear,
  onYearSelect,
  intensityColors,
}: HeatmapFooterProps) {
  return (
    <div className="flex items-center justify-between mt-2 pt-5 border-t border-border/50">
      <div className="flex items-center gap-1.5 p-1.5 bg-background/40 rounded-xl border border-border relative z-10">
        {years.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => onYearSelect(y)}
            className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
              selectedYear === y
                ? "bg-violet-600 text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
          >
            {y}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <span className="text-[10px] font-black uppercase text-neutral-600">
          Intensidade
        </span>
        <div className="flex gap-1.5">
          {[0, 1, 2, 3, 4].map((v) => (
            <div
              key={v}
              className={`w-3.5 h-3.5 rounded-[2px] ${intensityColors[v as 0 | 1 | 2 | 3 | 4]}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
