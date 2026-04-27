"use client";

import { Settings, Target, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
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
        const existing = goals.find((g) => g.goal_type === type);
        return existing || { user_id: uid, goal_type: type, target_value: 0 };
      });

      setLocalGoals(mergedGoals);
    }
    return () => window.removeEventListener("keydown", handleEscape);
  }, [show, goals, uid, onClose, weekStartsOnMondayInitial]);

  if (!show) return null;

  const handleUpdate = (type: string, value: number) => {
    setLocalGoals((prev) =>
      prev.map((g) =>
        g.goal_type === type ? { ...g, target_value: value } : g,
      ),
    );
  };

  const getGoalValue = (type: string) => {
    return localGoals.find((g) => g.goal_type === type)?.target_value || 0;
  };

  const labelClass = "text-xs font-semibold text-muted-foreground mb-2 block";
  const inputClass =
    "bg-background border-border/50 h-12 text-foreground font-bold text-sm focus-visible:ring-orange-500/20 tabular-nums rounded-xl px-4 w-full pr-10";

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-[850px]! bg-background border border-border rounded-xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between p-6 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/10 rounded-xl border border-orange-500/20 flex items-center justify-center">
              <Settings className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Metas e preferências
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Objetivos de leitura e desempenho
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-muted/50 rounded-xl transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="bg-card border border-border/60 rounded-xl p-6 relative">
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-500/5 border border-orange-500/10 rounded-xl">
                  <Target className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Definir metas
                  </h3>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Objetivos semanais e mensais
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  Início da semana
                </span>
                <div className="flex p-1 bg-muted/60 border border-border rounded-lg">
                  <button
                    type="button"
                    onClick={() => setWeekStartsOnMonday(false)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-semibold transition-all rounded-md",
                      !weekStartsOnMonday
                        ? "bg-background text-foreground"
                        : "text-neutral-600 hover:text-muted-foreground",
                    )}
                  >
                    Dom
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeekStartsOnMonday(true)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-semibold transition-all rounded-md",
                      weekStartsOnMonday
                        ? "bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/20"
                        : "text-neutral-600 hover:text-muted-foreground",
                    )}
                  >
                    Seg
                  </button>
                </div>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-5 mb-8">
              <div>
                <Label className={labelClass}>Horas semanais</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={Math.round(getGoalValue("TimePerWeek") / 60) || ""}
                    onChange={(e) =>
                      handleUpdate(
                        "TimePerWeek",
                        (parseInt(e.target.value, 10) || 0) * 60,
                      )
                    }
                    className={inputClass}
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600 font-semibold text-xs">
                    h
                  </span>
                </div>
              </div>
              <div>
                <Label className={labelClass}>Horas mensais</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={Math.round(getGoalValue("TimePerMonth") / 60) || ""}
                    onChange={(e) =>
                      handleUpdate(
                        "TimePerMonth",
                        (parseInt(e.target.value, 10) || 0) * 60,
                      )
                    }
                    className={inputClass}
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600 font-semibold text-xs">
                    h
                  </span>
                </div>
              </div>
              <div>
                <Label className={labelClass}>Páginas semanais</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={getGoalValue("PagesPerWeek") || ""}
                    onChange={(e) =>
                      handleUpdate(
                        "PagesPerWeek",
                        parseInt(e.target.value, 10) || 0,
                      )
                    }
                    className={inputClass}
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600 font-semibold text-xs">
                    p
                  </span>
                </div>
              </div>
              <div>
                <Label className={labelClass}>Páginas mensais</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={getGoalValue("PagesPerMonth") || ""}
                    onChange={(e) =>
                      handleUpdate(
                        "PagesPerMonth",
                        parseInt(e.target.value, 10) || 0,
                      )
                    }
                    className={inputClass}
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600 font-semibold text-xs">
                    p
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé Fixo */}
        <div className="flex gap-3 p-6 border-t border-border shrink-0 bg-background/50">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl bg-card border border-border text-muted-foreground font-bold text-xs hover:bg-accent/50 transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <Button
            type="button"
            onClick={() => onSave(localGoals, weekStartsOnMonday)}
            className="flex-2 h-11 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-all active:scale-[0.98]"
          >
            Salvar metas e preferências
          </Button>
        </div>
      </div>
    </div>
  );
}
