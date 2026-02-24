"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { StudyGoal } from "./types";

export const GOAL_LABELS: Record<string, string> = {
  weekly_hours: "Horas semanais",
  monthly_hours: "Horas mensais",
  weekly_questions: "Questões semanais",
  monthly_questions: "Questões mensais",
};

export const GOAL_UNITS: Record<string, string> = {
  weekly_hours: "h",
  monthly_hours: "h",
  weekly_questions: "q",
  monthly_questions: "q",
};

interface GoalPanelProps {
  goals: StudyGoal[];
  userId: string;
  onSave: (g: StudyGoal) => void;
}

export function GoalPanel({ goals, userId, onSave }: GoalPanelProps) {
  const goalTypes = [
    "weekly_hours",
    "monthly_hours",
    "weekly_questions",
    "monthly_questions",
  ] as const;

  const [vals, setVals] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const t of goalTypes) {
      const g = goals.find((g) => g.goal_type === t);
      m[t] = g ? String(g.target_value) : "";
    }
    return m;
  });

  function save(type: string) {
    const v = parseFloat(vals[type] ?? "");
    if (Number.isNaN(v) || v <= 0) {
      toast.error("Valor inválido");
      return;
    }
    onSave({
      user_id: userId,
      goal_type: type as StudyGoal["goal_type"],
      target_value: v,
    });
  }

  const ic =
    "flex-1 bg-neutral-800/60 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-violet-500 transition-colors";

  return (
    <div className="flex flex-col gap-3">
      {goalTypes.map((type) => (
        <div key={type} className="flex items-center gap-2">
          <span className="text-sm text-neutral-400 w-44 shrink-0">
            {GOAL_LABELS[type]}
          </span>
          <input
            type="number"
            min="0"
            className={ic}
            placeholder={GOAL_UNITS[type] === "h" ? "Ex: 40" : "Ex: 300"}
            value={vals[type]}
            onChange={(e) => setVals((v) => ({ ...v, [type]: e.target.value }))}
          />
          <span className="text-xs text-neutral-600 w-4">
            {GOAL_UNITS[type]}
          </span>
          <button
            type="button"
            onClick={() => save(type)}
            className="px-3 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/40 text-violet-400 text-xs font-bold border border-violet-600/30 transition-colors cursor-pointer"
          >
            Salvar
          </button>
        </div>
      ))}
    </div>
  );
}
