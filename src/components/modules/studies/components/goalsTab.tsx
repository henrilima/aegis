"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import { GoalPanel } from "../goalPanel";

interface Habit {
  id?: number;
  name: string;
  habitType: string;
  archived?: boolean;
}

interface GoalsTabProps {
  vals: Record<string, string>;
  setVals: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  weekStartDay?: number;
  onWeekStartChange?: (val: number) => void;
  habits: Habit[];
  linkedHabitId: string;
  onLinkedHabitChange: (val: string) => void;
  showSaturday: boolean;
  onShowSaturdayChange: (val: boolean) => void;
  showSunday: boolean;
  onShowSundayChange: (val: boolean) => void;
}

export function GoalsTab({
  vals,
  setVals,
  weekStartDay,
  onWeekStartChange,
  habits,
  linkedHabitId,
  onLinkedHabitChange,
  showSaturday,
  onShowSaturdayChange,
  showSunday,
  onShowSundayChange,
}: GoalsTabProps) {
  const color = getModuleColor("studies");
  const theme = getColorTheme(color);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500 w-full items-start">
      {/* Coluna 1: Metas de Desempenho */}
      <div className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-6">
        <div className="border-b border-border pb-4">
          <h3 className="text-sm font-bold text-foreground">
            Metas de Desempenho
          </h3>
          <p className="text-xs text-muted-foreground font-medium">
            Defina seus alvos de tempo, questões e páginas
          </p>
        </div>
        <GoalPanel vals={vals} setVals={setVals} />
      </div>

      {/* Coluna 2: Preferências & Exibição */}
      <div className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-6">
        <div className="border-b border-border pb-4">
          <h3 className="text-sm font-bold text-foreground">
            Preferências do Módulo
          </h3>
          <p className="text-xs text-muted-foreground font-medium">
            Personalize a visualização e integrações automáticas
          </p>
        </div>

        <div className="space-y-6">
          {onWeekStartChange !== undefined && (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-foreground">
                  Início da semana
                </p>
                <p className="text-[11px] text-muted-foreground font-medium">
                  Define o ciclo de cálculo semanal
                </p>
              </div>
              <div className="flex p-1 bg-background border border-border rounded-xl shrink-0">
                {[
                  { id: 0, label: "Domingo" },
                  { id: 1, label: "Segunda" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onWeekStartChange(opt.id)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer border",
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

          <div className="flex flex-col gap-2">
            <div>
              <p className="text-xs font-bold text-foreground">
                Vincular ao Hábito de Estudos
              </p>
              <p className="text-[11px] text-muted-foreground font-medium">
                Marcar automaticamente o hábito selecionado como feito ao
                registrar uma sessão de estudos no dia.
              </p>
            </div>
            <Select value={linkedHabitId} onValueChange={onLinkedHabitChange}>
              <SelectTrigger className="w-full bg-background border border-border rounded-xl h-11 text-xs mt-1">
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

          {/* Quadro de Horários: Dias Ativos */}
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs font-bold text-foreground">
                Fim de Semana na Grade
              </p>
              <p className="text-[11px] text-muted-foreground font-medium">
                Selecione se sábado e/ou domingo devem ser exibidos na
                visualização
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onShowSaturdayChange(!showSaturday)}
                className={cn(
                  "py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer border text-center",
                  showSaturday
                    ? cn(theme.bg, theme.text, theme.border)
                    : "bg-background border-border text-neutral-600 hover:text-muted-foreground",
                )}
              >
                Sábado {showSaturday ? "Ativo" : "Inativo"}
              </button>
              <button
                type="button"
                onClick={() => onShowSundayChange(!showSunday)}
                className={cn(
                  "py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer border text-center",
                  showSunday
                    ? cn(theme.bg, theme.text, theme.border)
                    : "bg-background border-border text-neutral-600 hover:text-muted-foreground",
                )}
              >
                Domingo {showSunday ? "Ativo" : "Inativo"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export {
  GoalsTab as MetasTab,
  type GoalsTabProps as MetasTabProps,
  type GoalsTabProps,
};
