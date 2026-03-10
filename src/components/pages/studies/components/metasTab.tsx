"use client";

import { Target } from "lucide-react";
import { GoalPanel } from "../goalPanel";
import type { StudyGoal } from "../types";

interface MetasTabProps {
  goals: StudyGoal[];
  userId: string;
  onSave: (g: StudyGoal) => Promise<void>;
}

export function MetasTab({ goals, userId, onSave }: MetasTabProps) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col gap-6 w-full animate-in fade-in duration-500 shadow-2xl">
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
      </div>
      <GoalPanel goals={goals} userId={userId} onSave={onSave} />
    </div>
  );
}
