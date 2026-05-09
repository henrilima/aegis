"use client";

import { Target } from "lucide-react";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
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
  const color = getModuleColor("studies");
  const theme = getColorTheme(color);
  return (
    <div className="bg-card/40 backdrop-blur-md border border-border rounded-2xl p-8 flex flex-col gap-8 w-full ">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-8">
        <div className="flex items-center gap-4">
          <div className={cn("p-3 rounded-2xl bg-muted/50", theme.text)}>
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground">
              Configurações de Metas
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
              Ajuste seus objetivos semanais e mensais de estudo.
            </p>
          </div>
        </div>

        {onWeekStartChange !== undefined && (
          <div className="flex flex-col gap-2 items-start md:items-end">
            <span className="text-[10px] font-bold text-muted-foreground ml-1">
              Ciclo Semanal
            </span>
            <div className="flex p-1 bg-background border border-border rounded-xl">
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
      </div>
      <GoalPanel goals={goals} userId={userId} onSave={onSave} />
    </div>
  );
}
