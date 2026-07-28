"use client";

import { Target, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Habit } from "@/components/modules/habits/types";
import { Input } from "@/components/ui/input";
import { ModalShell } from "@/components/ui/ModalShell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { ReadingGoal } from "../types";

interface GoalsModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (
    goals: ReadingGoal[],
    weekStartsOnMonday: boolean,
    linkedHabitId: string,
  ) => void;
  goals: ReadingGoal[];
  uid: string;
  weekStartsOnMondayInitial?: boolean;
  habits?: Habit[];
  linkedHabitIdInitial?: string;
}

export function GoalsModal({
  show,
  onClose,
  onSave,
  goals,
  uid,
  weekStartsOnMondayInitial = true,
  habits = [],
  linkedHabitIdInitial = "none",
}: GoalsModalProps) {
  const color = getModuleColor("reading");
  const theme = getColorTheme(color);
  const [localGoals, setLocalGoals] = useState<ReadingGoal[]>([]);
  const [weekStartsOnMonday, setWeekStartsOnMonday] = useState(
    weekStartsOnMondayInitial,
  );
  const [linkedHabitId, setLinkedHabitId] = useState(linkedHabitIdInitial);

  useEffect(() => {
    if (show) {
      setWeekStartsOnMonday(weekStartsOnMondayInitial);
      setLinkedHabitId(linkedHabitIdInitial);

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
  }, [show, goals, uid, weekStartsOnMondayInitial, linkedHabitIdInitial]);

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
    <ModalShell isOpen={show} onClose={onClose} size="2xl">
      {/* Cabeçalho */}
      <div className="p-6 md:p-8 border-b border-border/50 flex items-center justify-between bg-card/50 shrink-0">
        <div className="flex items-center gap-4">
          <div className={cn("p-3 rounded-2xl bg-muted/50", theme.text)}>
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Metas de Leitura
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
              Configure seus objetivos literários e preferências do módulo
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

      {/* Conteúdo em 2 Colunas */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          {/* Coluna 1: Metas de Desempenho */}
          <div className="space-y-6">
            <div className="border-b border-border/20 pb-3">
              <h3 className="text-sm font-bold text-foreground">
                Metas de Desempenho
              </h3>
              <p className="text-[10px] text-muted-foreground font-medium">
                Defina seus alvos de tempo e páginas
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {goalTypes.map((goal) => (
                <div key={goal.id} className="group flex flex-col gap-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {goal.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 relative">
                    <Input
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

          {/* Coluna 2: Preferências do Módulo */}
          <div className="space-y-6">
            <div className="border-b border-border/20 pb-3">
              <h3 className="text-sm font-bold text-foreground">
                Preferências do Módulo
              </h3>
              <p className="text-[10px] text-muted-foreground font-medium">
                Personalize a visualização e integrações automáticas
              </p>
            </div>

            {/* Preferência de Início da Semana */}
            <div className="flex items-center justify-between p-5 bg-muted/30 border border-border/50 rounded-2xl">
              <div>
                <p className="text-xs font-bold text-foreground">
                  Início da semana
                </p>
                <p className="text-[9px] text-muted-foreground font-medium">
                  Define o ciclo de cálculo semanal
                </p>
              </div>
              <div className="flex p-1 bg-background/50 border border-border rounded-xl">
                {[
                  { id: false, label: "Domingo" },
                  { id: true, label: "Segunda" },
                ].map((day) => (
                  <button
                    key={String(day.id)}
                    type="button"
                    onClick={() => setWeekStartsOnMonday(day.id)}
                    className={cn(
                      "px-3 py-1.5 text-[9px] font-bold rounded-lg transition-all cursor-pointer border",
                      weekStartsOnMonday === day.id
                        ? cn(theme.bg, theme.text, theme.border)
                        : "bg-transparent border-transparent text-neutral-600 hover:text-muted-foreground",
                    )}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Vincular ao Hábito de Leitura */}
            <div className="flex flex-col gap-2 p-5 bg-muted/30 border border-border/50 rounded-2xl">
              <div>
                <p className="text-xs font-bold text-foreground">
                  Vincular ao hábito de leitura
                </p>
                <p className="text-[9px] text-muted-foreground font-medium mb-3">
                  Marcar automaticamente o hábito selecionado como feito ao
                  registrar uma sessão de leitura no dia.
                </p>
              </div>
              <Select value={linkedHabitId} onValueChange={setLinkedHabitId}>
                <SelectTrigger className="w-full bg-card border border-border rounded-xl h-11 text-xs">
                  <SelectValue placeholder="Selecione um hábito..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="none" className="text-xs">
                    Nenhum
                  </SelectItem>
                  {habits
                    .filter(
                      (h) =>
                        !h.archived &&
                        (h.habitType.toLowerCase() === "positive" ||
                          h.habitType.toLowerCase() === "good"),
                    )
                    .map((h) => (
                      <SelectItem
                        key={h.id ?? h.name}
                        value={String(h.id)}
                        className="text-xs"
                      >
                        {h.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <div className="p-6 md:p-8 border-t border-border/50 shrink-0 bg-card/50">
        <button
          type="button"
          onClick={() => onSave(localGoals, weekStartsOnMonday, linkedHabitId)}
          className={cn(
            "w-full p-4 rounded-2xl text-xs font-bold text-white transition-all active:scale-[0.98] cursor-pointer",
            theme.solid,
            theme.solidHover,
          )}
        >
          Salvar objetivos de leitura
        </button>
      </div>
    </ModalShell>
  );
}
