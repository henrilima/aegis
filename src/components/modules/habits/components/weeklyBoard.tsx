"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Edit2,
  MoreVertical,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTime } from "@/context/TimeContext";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { Habit } from "../types";

interface HabitsWeeklyBoardProps {
  habits: Habit[];
  onRefresh: () => void;
  onEdit: (habit: Habit) => void;
  onOpenHardResetDialog: (id: number) => void;
  onDelete: (id: number) => void;
}

const shortDayNames = ["dom.", "seg.", "ter.", "qua.", "qui.", "sex.", "sáb."];
const fullDayNames = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

export function HabitsWeeklyBoard({
  habits,
  onRefresh,
  onEdit,
  onOpenHardResetDialog,
  onDelete,
}: HabitsWeeklyBoardProps) {
  const { now: simulatedNow } = useTime();
  const [weekOffset, setWeekOffset] = useState(0);
  const [isToggling, setIsToggling] = useState(false);

  const color = getModuleColor("habits");
  const theme = getColorTheme(color);

  // Calcula as datas de visualização móvel: de 5 dias atrás até amanhã (hoje + 1 dia) com base no offset
  const weekDates = useMemo(() => {
    const today = new Date(simulatedNow);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - 5 + weekOffset * 7);

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, [simulatedNow, weekOffset]);

  const getFormattedDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const getDayLabel = (date: Date) => {
    const todayStr = getFormattedDate(simulatedNow);
    const dateStr = getFormattedDate(date);
    if (dateStr === todayStr) return "Hoje";

    const yesterday = new Date(simulatedNow);
    yesterday.setDate(simulatedNow.getDate() - 1);
    if (dateStr === getFormattedDate(yesterday)) return "Ontem";

    const tomorrow = new Date(simulatedNow);
    tomorrow.setDate(simulatedNow.getDate() + 1);
    if (dateStr === getFormattedDate(tomorrow)) return "Amanhã";

    const rawLabel = fullDayNames[date.getDay()];
    return rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
  };

  const getDayNumberLabel = (date: Date) => {
    const day = date.getDate();
    if (day === 1) {
      const monthNames = [
        "jan.",
        "fev.",
        "mar.",
        "abr.",
        "mai.",
        "jun.",
        "jul.",
        "ago.",
        "set.",
        "out.",
        "nov.",
        "dez.",
      ];
      return `1 de ${monthNames[date.getMonth()]}`;
    }
    return String(day);
  };

  const handleToggle = async (
    h: Habit,
    dateStr: string,
    currentVal: boolean,
  ) => {
    if (!h.id || isToggling) return;
    try {
      setIsToggling(true);
      await invoke("habit_toggle_date", {
        id: h.id,
        date: dateStr,
        completed: !currentVal,
      });
      onRefresh();
    } catch (e) {
      toast.error(`Erro ao atualizar hábito: ${e}`);
    } finally {
      setIsToggling(false);
    }
  };

  const isScheduled = (h: Habit, weekday: number) => {
    if (!h.frequency || h.frequency === "daily") return true;
    if (h.frequency === "weekdays" && h.weekdays) {
      const list = h.weekdays.split(",").map(Number);
      return list.includes(weekday);
    }
    return false;
  };

  return (
    <div className="flex flex-col gap-4 w-full overflow-hidden">
      {/* Controles de Paginação da Semana */}
      <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4 shadow-none">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-foreground">
            Visualização Semanal
          </span>
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            {weekOffset === 0
              ? "Semana Atual"
              : weekOffset === -1
                ? "Semana Anterior"
                : `${Math.abs(weekOffset)} sem. atrás`}
          </span>
        </div>

        <div className="flex items-center gap-2 bg-background/50 border border-border rounded-xl p-1">
          <button
            type="button"
            onClick={() => setWeekOffset((o) => o - 1)}
            className="p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer text-muted-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset(0)}
            className="px-4 py-1 text-xs font-bold text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
            title="Voltar para a semana atual"
          >
            Semana Atual
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset((o) => Math.min(0, o + 1))}
            disabled={weekOffset === 0}
            className="p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid de Dias da Semana */}
      <div className="grid grid-cols-7 gap-3 w-full overflow-x-auto min-w-[950px] pb-4 select-none">
        {weekDates.map((date) => {
          const formatted = getFormattedDate(date);
          const wDay = date.getDay(); // 0 = Domingo, 1 = Segunda...

          // Filtra hábitos que estão planejados para este dia ou que foram concluídos nele (se arquivados)
          const scheduledHabits = habits.filter((h) => {
            const isComp = h.completedDates?.includes(formatted);
            if (h.archived) {
              return isComp;
            }
            return isScheduled(h, wDay);
          });

          // Conta completados
          const completedCount = scheduledHabits.filter((h) =>
            h.completedDates?.includes(formatted),
          ).length;

          const totalCount = scheduledHabits.length;
          const percent =
            totalCount > 0
              ? Math.round((completedCount / totalCount) * 100)
              : 0;

          const isToday = formatted === getFormattedDate(simulatedNow);

          // Dias futuros em relação a hoje (não podem ser alterados)
          const todayMidnight = new Date(
            simulatedNow.getFullYear(),
            simulatedNow.getMonth(),
            simulatedNow.getDate(),
          );
          const isFuture =
            date.getTime() > todayMidnight.getTime() + 24 * 60 * 60 * 1000 - 1;

          return (
            <div key={formatted} className="flex flex-col gap-2">
              {/* Header do dia superior */}
              <div className="text-center font-bold text-xs text-muted-foreground/60 uppercase">
                {shortDayNames[date.getDay()]}
              </div>

              {/* Card do Dia */}
              <div
                className={cn(
                  "bg-card border border-border rounded-xl p-4 flex flex-col justify-between min-h-[360px] transition-all shadow-none",
                  isToday && "border-2 border-border/80",
                )}
              >
                <div className="flex flex-col gap-3">
                  {/* Cabeçalho do Card */}
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <span
                      className={cn(
                        "text-xs font-bold tracking-wide",
                        isToday ? theme.text : "text-muted-foreground",
                      )}
                    >
                      {getDayLabel(date)}
                    </span>
                    <span className="text-xs font-black text-muted-foreground/40">
                      {getDayNumberLabel(date)}
                    </span>
                  </div>

                  {/* Checklist dos Hábitos */}
                  <div className="flex flex-col gap-2.5">
                    {scheduledHabits.length > 0 ? (
                      scheduledHabits.map((h) => {
                        const isCompleted =
                          h.completedDates?.includes(formatted) || false;
                        return (
                          <div
                            key={h.id}
                            className="flex items-start justify-between gap-1.5 group/item py-0.5"
                          >
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <button
                                type="button"
                                disabled={isFuture || isToggling}
                                onClick={() =>
                                  handleToggle(h, formatted, isCompleted)
                                }
                                className={cn(
                                  "w-4 h-4 mt-0.5 rounded flex items-center justify-center border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0",
                                  isCompleted
                                    ? h.archived
                                      ? "bg-red-500 border-transparent text-white"
                                      : cn(
                                          theme.solid,
                                          "border-transparent text-white",
                                        )
                                    : h.archived
                                      ? "bg-background border-red-500/50 hover:border-red-500 text-red-500"
                                      : "bg-background border-border hover:border-border/80",
                                )}
                              >
                                {isCompleted && (
                                  <Check className="w-3 h-3 stroke-3" />
                                )}
                              </button>
                              <div className="flex flex-col gap-0.5 flex-1 min-w-0 leading-none">
                                <button
                                  type="button"
                                  disabled={isFuture || isToggling}
                                  className={cn(
                                    "text-xs font-semibold cursor-pointer select-none transition-colors leading-tight focus:outline-none text-left bg-transparent border-none p-0",
                                    isCompleted
                                      ? h.archived
                                        ? "line-through text-red-500/60 dark:text-red-400/60 font-medium"
                                        : "line-through text-muted-foreground/45"
                                      : h.archived
                                        ? "text-red-500 dark:text-red-400 font-medium"
                                        : "text-foreground",
                                  )}
                                  onClick={() =>
                                    handleToggle(h, formatted, isCompleted)
                                  }
                                >
                                  {h.name}
                                </button>
                                {h.goalDays && h.goalDays > 0 ? (
                                  <span className="text-[9px] text-muted-foreground/50 font-bold leading-none mt-0.5">
                                    Meta: {h.completedDates?.length || 0}/
                                    {h.goalDays}d
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            {/* Dropdown de Configurações do Hábito */}
                            <div className="opacity-0 group-hover/item:opacity-100 transition-opacity">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    type="button"
                                    className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground cursor-pointer"
                                  >
                                    <MoreVertical className="w-3.5 h-3.5" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="bg-card border-border text-foreground shadow-none"
                                >
                                  <DropdownMenuItem
                                    className="cursor-pointer text-xs font-bold gap-2"
                                    onClick={() => onEdit(h)}
                                  >
                                    <Edit2 className="w-3 h-3" /> Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="cursor-pointer text-xs font-bold gap-2"
                                    onClick={() =>
                                      h.id && onOpenHardResetDialog(h.id)
                                    }
                                  >
                                    <RotateCcw className="w-3 h-3" /> Limpar
                                    histórico
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="cursor-pointer text-xs font-bold gap-2 text-red-600 dark:text-red-400"
                                    onClick={() => h.id && onDelete(h.id)}
                                  >
                                    <Trash2 className="w-3 h-3" /> Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-[10px] text-muted-foreground/40 font-bold text-center py-6">
                        Nenhum hábito
                      </div>
                    )}
                  </div>
                </div>

                {/* Progresso Diário */}
                <div className="flex flex-col gap-1.5 border-t border-border/40 pt-3">
                  <div className="flex items-center justify-between text-[9px] font-bold text-muted-foreground/80 uppercase">
                    <span>Concluído</span>
                    <span className={cn(percent > 0 && theme.text)}>
                      {percent}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-background border border-border/80 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-500 ease-out",
                        theme.solid.split(" ")[0],
                      )}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
