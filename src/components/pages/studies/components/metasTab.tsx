"use client";

import { Target } from "lucide-react";
import { GoalPanel } from "../goalPanel";
import type { StudyGoal } from "../types";

interface MetasTabProps {
  goals: StudyGoal[];
  userId: string;
  onSave: (gs: StudyGoal[]) => Promise<void>;
  weekStartDay?: number;
  onWeekStartChange?: (val: number) => void;
}

export function MetasTab({
  goals,
  userId,
  onSave,
  weekStartDay,
  onWeekStartChange,
}: MetasTabProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-6 w-full ">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl">
            <Target className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground leading-none">
              Definir metas
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Planejamento e objetivos de desempenho
            </p>
          </div>
        </div>

        {onWeekStartChange !== undefined && (
          <div className="flex flex-col gap-1.5 items-end">
            <span className="text-[10px] font-bold text-muted-foreground">
              Início da semana
            </span>
            <div className="flex gap-1 p-1 bg-background border border-border rounded-lg">
              <button
                type="button"
                onClick={() => onWeekStartChange(0)}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${weekStartDay === 0 ? "bg-violet-600/20 text-violet-600 dark:text-violet-400 border border-violet-600/30" : "text-neutral-600 hover:text-muted-foreground"}`}
              >
                Dom
              </button>
              <button
                type="button"
                onClick={() => onWeekStartChange(1)}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${weekStartDay === 1 ? "bg-violet-600/20 text-violet-600 dark:text-violet-400 border border-violet-600/30" : "text-neutral-600 hover:text-muted-foreground"}`}
              >
                Seg
              </button>
            </div>
          </div>
        )}
      </div>
      <GoalPanel goals={goals} userId={userId} onSave={onSave} />
    </div>
  );
}
