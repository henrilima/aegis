"use client";

import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import { GoalPanel } from "../goalPanel";

interface MetasTabProps {
  vals: Record<string, string>;
  setVals: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  weekStartDay?: number;
  onWeekStartChange?: (val: number) => void;
}

export function MetasTab({
  vals,
  setVals,
  weekStartDay,
  onWeekStartChange,
}: MetasTabProps) {
  const color = getModuleColor("studies");
  const theme = getColorTheme(color);
  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full">
      {onWeekStartChange !== undefined && (
        <div className="flex items-center justify-between p-5 bg-muted/30 border border-border/50 rounded-2xl">
          <div>
            <p className="text-sm font-bold text-foreground">
              Início da semana
            </p>
            <p className="text-[10px] text-muted-foreground font-medium">
              Define o ciclo de cálculo semanal
            </p>
          </div>
          <div className="flex p-1 bg-background/50 border border-border rounded-xl">
            {[
              { id: 0, label: "Domingo" },
              { id: 1, label: "Segunda" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onWeekStartChange(opt.id)}
                className={cn(
                  "px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer border",
                  weekStartDay === opt.id
                    ? cn(theme.bg, theme.text, theme.border)
                    : "bg-transparent border-transparent text-neutral-600 hover:text-muted-foreground",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <GoalPanel vals={vals} setVals={setVals} />
    </div>
  );
}
