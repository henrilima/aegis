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
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col gap-6 w-full animate-in fade-in duration-500 shadow-2xl">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl">
            <Target className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white leading-none">
              Definir Metas
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Planejamento e objetivos de desempenho
            </p>
          </div>
        </div>

        {onWeekStartChange !== undefined && (
          <div className="flex flex-col gap-1.5 items-end">
            <span className="text-[10px] font-black uppercase text-neutral-500">
              Início da Semana
            </span>
            <div className="flex gap-1 p-1 bg-neutral-950 border border-neutral-800 rounded-lg">
              <button
                type="button"
                onClick={() => onWeekStartChange(0)}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${weekStartDay === 0 ? "bg-violet-600/20 text-violet-400 border border-violet-600/30" : "text-neutral-600 hover:text-neutral-400"}`}
              >
                DOM
              </button>
              <button
                type="button"
                onClick={() => onWeekStartChange(1)}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${weekStartDay === 1 ? "bg-violet-600/20 text-violet-400 border border-violet-600/30" : "text-neutral-600 hover:text-neutral-400"}`}
              >
                SEG
              </button>
            </div>
          </div>
        )}
      </div>
      <GoalPanel goals={goals} userId={userId} onSave={onSave} />
    </div>
  );
}
