"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
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
  const color = getModuleColor("studies");
  const theme = getColorTheme(color);
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
      const g = goals.find((g) => g.goalType === t);
      m[t] = g ? String(g.targetValue) : "";
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
        userId: userId,
        goalType: type as StudyGoal["goalType"],
        targetValue: v,
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

  const ic = cn(
    "flex-1 bg-background/50 border border-border rounded-xl px-4 py-2.5 text-sm font-bold text-foreground placeholder:text-neutral-700 focus:outline-none transition-all",
    theme.borderHover.replace("hover:", "focus:").replace("500", "500/50"),
    theme.textSub
      .replace("text-", "focus:ring-1 focus:ring-")
      .replace("400", "500/20"),
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
        {goalTypes.map((type) => (
          <div key={type} className="group flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold text-muted-foreground">
                {GOAL_LABELS[type]}
              </span>
              <span className="text-[10px] font-bold text-neutral-600">
                {GOAL_UNITS[type] === "h"
                  ? "Horas"
                  : GOAL_UNITS[type] === "q"
                    ? "Questões"
                    : "Páginas"}
              </span>
            </div>
            <div className="flex items-center gap-3 relative">
              <Input
                type="number"
                min="0"
                className={ic}
                placeholder={GOAL_UNITS[type] === "h" ? "Ex: 40" : "Ex: 300"}
                value={vals[type]}
                onChange={(e) =>
                  setVals((v) => ({ ...v, [type]: e.target.value }))
                }
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                <div className="w-px h-4 bg-border mx-1" />
                <span className={cn("text-xs font-bold", theme.text)}>
                  {GOAL_UNITS[type]}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-border/50">
        <button
          type="button"
          onClick={saveAll}
          disabled={isSaving}
          className={cn(
            "w-full p-3 rounded-2xl text-xs font-bold text-white transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50",
            theme.solid,
            theme.solidHover,
          )}
        >
          {isSaving ? "Sincronizando..." : "Salvar objetivos"}
        </button>
      </div>
    </div>
  );
}
