"use client";

import { Activity, CheckCircle2, Circle, Flame } from "lucide-react";
import type { Habit } from "@/components/modules/habits/types";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import { BaseWidget } from "../BaseWidget";
import { Ring } from "../ui";

interface HabitsWidgetProps {
  habits: Habit[];
  time: Date;
  limit?: number;
  isEditMode?: boolean;
  isInteractive?: boolean;
  onToggleInteractive?: () => void;
  onToggleHabit?: (id: number) => void;
}

export function HabitsWidget({
  habits,
  time,
  limit,
  isEditMode,
  isInteractive,
  onToggleInteractive,
  onToggleHabit,
}: HabitsWidgetProps) {
  const color = getModuleColor("habits");
  const theme = getColorTheme(color);

  const getFormattedDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const todayStr = getFormattedDate(time);
  const todayWeekday = time.getDay();

  const isScheduled = (h: Habit, weekday: number) => {
    if (h.archived) return false;
    if (!h.frequency || h.frequency === "daily") return true;
    if (h.frequency === "weekdays" && h.weekdays) {
      const list = h.weekdays.split(",").map(Number);
      return list.includes(weekday);
    }
    return false;
  };

  // Filtra apenas hábitos positivos que não estão arquivados e estão agendados para hoje
  const positiveHabits = habits.filter(
    (h) => h.habitType === "Positive" && isScheduled(h, todayWeekday),
  );

  const doneToday = positiveHabits.filter(
    (h) => h.completedDates?.includes(todayStr) || false,
  );

  const progressPct =
    positiveHabits.length > 0
      ? Math.round((doneToday.length / positiveHabits.length) * 100)
      : 0;

  // Recorde histórico de todos os hábitos positivos ativos (independentemente de estarem agendados hoje)
  const allActivePositive = habits.filter(
    (h) => h.habitType === "Positive" && !h.archived,
  );

  const maxStreak = allActivePositive.reduce(
    (m, h) => Math.max(m, h.maxStreak || 0),
    0,
  );

  return (
    <BaseWidget
      title="Hábitos"
      icon={Activity}
      color={color}
      route="habits"
      isEditMode={isEditMode}
      isInteractive={isInteractive}
      onToggleInteractive={onToggleInteractive}
    >
      <div className="flex items-center gap-[5cqw] @sm:gap-7 mb-[5cqw] @sm:mb-5">
        <div className="relative shrink-0 w-[20cqw] h-[20cqw] min-w-[75px] min-h-[75px] max-w-[150px] max-h-[150px]">
          <Ring
            pct={progressPct}
            color={
              color === "teal"
                ? "#14b8a6"
                : theme.text.includes("#")
                  ? (theme.text.match(/#[a-f0-9]{6}/i)?.[0] ?? "#14b8a6")
                  : "#14b8a6"
            }
            size={76}
            stroke={7}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={cn(
                "text-[4cqw] @sm:text-xl font-bold leading-none min-text-[13px]",
                theme.text,
              )}
            >
              {progressPct}%
            </span>
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl @sm:text-3xl font-bold text-foreground leading-none">
              {doneToday.length}
            </span>
            <span className="text-lg @sm:text-xl font-bold text-muted-foreground">
              / {positiveHabits.length}
            </span>
          </div>
          <p className="text-[10px] font-bold text-muted-foreground mt-1">
            Concluídos hoje
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <Flame
              className={cn("w-[4cqw] h-[4cqw] @sm:w-4 @sm:h-4", theme.text)}
            />
            <span className="text-[3cqw] @sm:text-xs font-semibold text-muted-foreground min-text-[11px]">
              Recorde:{" "}
              <span className={cn("font-bold", theme.text)}>{maxStreak}d</span>
            </span>
          </div>
        </div>
      </div>

      <div className="w-full space-y-2">
        {positiveHabits.slice(0, limit ?? 3).map((h) => {
          const done = h.completedDates?.includes(todayStr) || false;
          const streak = h.currentStreak || 0;
          return (
            <button
              key={h.id}
              type="button"
              tabIndex={isInteractive && !done ? 0 : undefined}
              className={cn(
                "flex w-full items-center justify-between p-3 rounded-xl border border-border bg-card transition-all hover:bg-muted/30 gap-4 outline-none focus-visible:ring-1 focus-visible:ring-ring/50",
                isInteractive && !done && "cursor-pointer",
              )}
              onClick={(e) => {
                if (isInteractive) {
                  e.stopPropagation();
                  if (!done && onToggleHabit && h.id !== undefined) {
                    onToggleHabit(h.id);
                  }
                }
              }}
              onKeyDown={(e) => {
                if (
                  isInteractive &&
                  !done &&
                  onToggleHabit &&
                  h.id !== undefined &&
                  (e.key === "Enter" || e.key === " ")
                ) {
                  e.preventDefault();
                  onToggleHabit(h.id);
                }
              }}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="shrink-0 transition-transform active:scale-90">
                  {done ? (
                    <CheckCircle2 className={cn("w-5 h-5", theme.text)} />
                  ) : (
                    <Circle
                      className={cn(
                        "w-5 h-5 text-muted-foreground/50",
                        isInteractive && "hover:text-foreground",
                      )}
                    />
                  )}
                </div>
                <div className="flex flex-col min-w-0 flex-1 gap-0.5 text-left">
                  <span
                    className={cn(
                      "text-sm font-bold text-foreground truncate",
                      done && "text-muted-foreground/60 line-through",
                    )}
                  >
                    {h.name}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {done ? "Concluído hoje" : "Pendente"}
                  </span>
                </div>
              </div>

              <div className="shrink-0 flex items-center">
                <div
                  className={cn(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-bold capitalize shrink-0",
                    done
                      ? "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20"
                      : "bg-muted/40 text-muted-foreground border-border/40",
                  )}
                >
                  <Flame className="w-3 h-3 shrink-0" />
                  <span>{streak}d</span>
                </div>
              </div>
            </button>
          );
        })}
        {positiveHabits.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="text-xs text-neutral-600 font-bold">
              Sem Hábitos Ativos
            </p>
            <p className="text-[10px] text-neutral-600 font-medium max-w-[180px] mt-1">
              Cadastre hábitos saudáveis para acompanhar sua consistência
              diária.
            </p>
          </div>
        )}
      </div>
    </BaseWidget>
  );
}
