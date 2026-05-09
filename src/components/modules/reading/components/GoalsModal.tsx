"use client";

import { Target, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { ReadingGoal } from "../types";

interface GoalsModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (goals: ReadingGoal[], weekStartsOnMonday: boolean) => void;
  goals: ReadingGoal[];
  uid: string;
  weekStartsOnMondayInitial?: boolean;
}

export function GoalsModal({
  show,
  onClose,
  onSave,
  goals,
  uid,
  weekStartsOnMondayInitial = true,
}: GoalsModalProps) {
  const color = getModuleColor("reading");
  const theme = getColorTheme(color);
  const [localGoals, setLocalGoals] = useState<ReadingGoal[]>([]);
  const [weekStartsOnMonday, setWeekStartsOnMonday] = useState(
    weekStartsOnMondayInitial,
  );

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (show) {
      window.addEventListener("keydown", handleEscape);
      setWeekStartsOnMonday(weekStartsOnMondayInitial);

      const essentialTypes = [
        "TimePerWeek",
        "TimePerMonth",
        "PagesPerWeek",
        "PagesPerMonth",
      ];

      const mergedGoals = essentialTypes.map((type) => {
        const existing = goals.find((g) => g.goalType === type);
        return existing || { userId: uid, goalType: type, targetValue: 0 };
      });

      setLocalGoals(mergedGoals);
    }
    return () => window.removeEventListener("keydown", handleEscape);
  }, [show, goals, uid, onClose, weekStartsOnMondayInitial]);

  if (!show) return null;

  const handleUpdate = (type: string, value: number) => {
    setLocalGoals((prev) =>
      prev.map((g) => (g.goalType === type ? { ...g, targetValue: value } : g)),
    );
  };

  const getGoalValue = (type: string) => {
    return localGoals.find((g) => g.goalType === type)?.targetValue || 0;
  };

  const inputClass = cn(
    "flex-1 bg-background/50 border border-border rounded-xl px-4 py-2.5 text-sm font-bold text-foreground placeholder:text-neutral-700 focus:outline-none transition-all",
    theme.borderHover.replace("hover:", "focus:").replace("500", "500/50"),
    theme.textSub
      .replace("text-", "focus:ring-1 focus:ring-")
      .replace("400", "500/20"),
  );

  const goalTypes = [
    { id: "TimePerWeek", label: "Horas semanais", unit: "h", factor: 60 },
    { id: "TimePerMonth", label: "Horas mensais", unit: "h", factor: 60 },
    { id: "PagesPerWeek", label: "Páginas semanais", unit: "p", factor: 1 },
    { id: "PagesPerMonth", label: "Páginas mensais", unit: "p", factor: 1 },
  ];

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card/90 backdrop-blur-xl border border-border/60 rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-8 border-b border-border/50 flex items-center justify-between bg-card/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className={cn("p-3 rounded-2xl bg-muted/50", theme.text)}>
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground">
                Metas de Leitura
              </h2>
              <p className="text-xs text-muted-foreground font-medium">
                Configure seus objetivos literários
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-3 hover:bg-red-500/10 rounded-2xl transition-all text-muted-foreground hover:text-red-500 cursor-pointer group"
          >
            <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-1 custom-scrollbar">
          <div className="p-8 space-y-10">
            {/* Week Start Preference */}
            <div className="flex items-center justify-between p-5 bg-muted/30 border border-border/50 rounded-2xl">
              <div>
                <p className="text-sm font-bold text-foreground">
                  Início da semana
                </p>
                <p className="text-[10px] text-muted-foreground font-medium">
                  Define o ciclo de cálculo semanal
                </p>
              </div>
              <div className="flex p-1 bg-background/50 border border-border/60 rounded-xl">
                {[
                  { id: false, label: "Domingo" },
                  { id: true, label: "Segunda" },
                ].map((day) => (
                  <button
                    key={String(day.id)}
                    type="button"
                    onClick={() => setWeekStartsOnMonday(day.id)}
                    className={cn(
                      "px-4 py-1.5 text-[10px] font-bold transition-all rounded-lg",
                      weekStartsOnMonday === day.id
                        ? cn(theme.bg, theme.text, "border border-border/50")
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                    )}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Goals Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              {goalTypes.map((goal) => (
                <div key={goal.id} className="group flex flex-col gap-2.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {goal.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 relative">
                    <input
                      type="number"
                      value={
                        goal.factor === 60
                          ? Math.round(getGoalValue(goal.id) / 60) || ""
                          : getGoalValue(goal.id) || ""
                      }
                      onChange={(e) =>
                        handleUpdate(
                          goal.id,
                          (parseInt(e.target.value, 10) || 0) * goal.factor,
                        )
                      }
                      className={inputClass}
                      placeholder="0"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                      <div className="w-px h-4 bg-border mx-1" />
                      <span className={cn("text-xs font-bold", theme.text)}>
                        {goal.unit}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-border/50 shrink-0 bg-card/50">
          <button
            type="button"
            onClick={() => onSave(localGoals, weekStartsOnMonday)}
            className={cn(
              "w-full p-4 rounded-2xl text-xs font-bold text-white transition-all active:scale-[0.98] cursor-pointer",
              theme.solid,
              theme.solidHover,
            )}
          >
            Salvar objetivos de leitura
          </button>
        </div>
      </div>
    </div>
  );
}
