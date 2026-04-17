"use client";

import { BarChart3 } from "lucide-react";

interface StatisticsHeaderProps {
  days: number;
  onDaysChange: (d: number) => void;
}

/**
 * Cabeçalho do módulo de estatísticas com filtro de período
 */
export function StatisticsHeader({
  days,
  onDaysChange,
}: StatisticsHeaderProps) {
  const options = [7, 14, 30, 60, 90];

  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
          <BarChart3 className="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold leading-none text-foreground">
            Estatísticas
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cruzamento inteligente de dados para análise de performance
          </p>
        </div>
      </div>

      {/* Seletor de período (dias retroativos) */}
      <div className="flex gap-1 p-1 bg-card border border-border rounded-xl">
        {options.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onDaysChange(d)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              days === d
                ? "bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {d}d
          </button>
        ))}
      </div>
    </div>
  );
}
