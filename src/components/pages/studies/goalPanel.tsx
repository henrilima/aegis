"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { StudyGoal } from "./types";

export const GOAL_LABELS: Record<string, string> = {
  weekly_hours: "Horas semanais",
  monthly_hours: "Horas mensais",
  weekly_questions: "Questões semanais",
  monthly_questions: "Questões mensais",
  weekly_pages: "Páginas semanais",
  monthly_pages: "Páginas mensais",
};

export const GOAL_UNITS: Record<string, string> = {
  weekly_hours: "h",
  monthly_hours: "h",
  weekly_questions: "q",
  monthly_questions: "q",
  weekly_pages: "p",
  monthly_pages: "p",
};

interface GoalPanelProps {
  goals: StudyGoal[];
  userId: string;
  onSave: (gs: StudyGoal[]) => void;
}

export function GoalPanel({ goals, userId, onSave }: GoalPanelProps) {
  const goalTypes = [
    "weekly_hours",
    "monthly_hours",
    "weekly_questions",
    "monthly_questions",
    "weekly_pages",
    "monthly_pages",
  ] as const;

  const [vals, setVals] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const t of goalTypes) {
      const g = goals.find((g) => g.goal_type === t);
      m[t] = g ? String(g.target_value) : "";
    }
    return m;
  });

  const [isSaving, setIsSaving] = useState(false);

  async function saveAll() {
    setIsSaving(true);
    const updates: StudyGoal[] = [];

    for (const type of goalTypes) {
      const valStr = vals[type] ?? "";
      const v = valStr === "" ? 0 : parseFloat(valStr);

      if (Number.isNaN(v) || v < 0) {
        toast.error(`Valor inválido para ${GOAL_LABELS[type]}`);
        setIsSaving(false);
        return;
      }

      updates.push({
        user_id: userId,
        goal_type: type as StudyGoal["goal_type"],
        target_value: v,
      });
    }

    try {
      await onSave(updates);
      toast.success("Todas as metas foram atualizadas!");
    } catch {
      toast.error("Erro ao salvar metas");
    } finally {
      setIsSaving(false);
    }
  }

  const ic =
    "flex-1 bg-neutral-800/60 border border-neutral-700 rounded-xl px-3 py-2 text-white placeholder:text-neutral-600 focus:outline-none focus:border-violet-600/20 transition-colors";

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {goalTypes.map((type) => (
          <div
            key={type}
            className="flex flex-col gap-2 rounded-xl border-none"
          >
            <span className="text-xs font-black uppercase text-neutral-500 ml-1">
              {GOAL_LABELS[type]}
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                className={ic}
                placeholder={GOAL_UNITS[type] === "h" ? "Ex: 40" : "Ex: 300"}
                value={vals[type]}
                onChange={(e) =>
                  setVals((v) => ({ ...v, [type]: e.target.value }))
                }
              />
              <span className="text-xs font-bold text-neutral-600 w-4">
                {GOAL_UNITS[type]}
              </span>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={saveAll}
        disabled={isSaving}
        className="w-full px-3 py-3 rounded-xl bg-violet-600/10 hover:bg-violet-600/20 text-violet-500 text-xs font-bold border border-violet-600/20 transition-colors cursor-pointer"
      >
        {isSaving ? "Salvando..." : "Salvar Todas as Metas"}
      </button>
    </div>
  );
}
