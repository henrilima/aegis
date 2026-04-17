"use client";

import { ChevronLeft, ChevronRight, Flame } from "lucide-react";

interface HeatmapHeaderProps {
  selectedYear: number;
  currentYear: number;
  totalQuestions: number;
  totalHours: number;
  totalSessions: number;
  onPrevYear: () => void;
  onNextYear: () => void;
}

export function HeatmapHeader({
  selectedYear,
  currentYear,
  totalQuestions,
  totalHours,
  totalSessions,
  onPrevYear,
  onNextYear,
}: HeatmapHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-5">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl">
          <Flame className="w-5 h-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h2 className="text-lg font-black text-foreground leading-none">
            Mapa de Constância
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Frequência de sessões de estudo em {selectedYear}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-background p-1 border border-border rounded-xl relative z-10">
          <button
            type="button"
            onClick={onPrevYear}
            className="p-1.5 rounded-lg hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-black text-violet-600 dark:text-violet-400 px-2">
            {selectedYear}
          </span>
          <button
            type="button"
            onClick={onNextYear}
            className="p-1.5 rounded-lg hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
            disabled={selectedYear >= currentYear}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="h-8 w-px bg-neutral-800 mx-1" />
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className=" font-black text-violet-600 dark:text-violet-400 leading-none">
              {totalSessions}
            </span>
            <span className="text-[10px] uppercase font-bold text-neutral-600">
              Sessões
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className=" font-black text-foreground leading-none">
              {totalQuestions}
            </span>
            <span className="text-[10px] uppercase font-bold text-neutral-600">
              Questões
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className=" font-black text-foreground leading-none">
              {totalHours.toFixed(1)}h
            </span>
            <span className="text-[10px] uppercase font-bold text-neutral-600">
              Estudo
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
