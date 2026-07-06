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
                "flex w-full items-center justify-between p-[2.5cqw] @sm:p-2.5 rounded-xl border border-neutral-200/60 dark:border-border/40 bg-neutral-100 dark:bg-neutral-900/10 hover:bg-neutral-200/50 dark:hover:bg-neutral-900/20 hover:border-neutral-300/60 dark:hover:border-border/60 transition-all gap-4 outline-none focus-visible:ring-1 focus-visible:ring-ring/50",
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
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "shrink-0 p-2 rounded-xl bg-neutral-200 dark:bg-neutral-900/40 border border-neutral-300/40 dark:border-border/30 text-teal-500",
                    isInteractive &&
                      !done &&
                      "transition-transform hover:scale-105 active:scale-95",
                  )}
                >
                  {done ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Circle
                      className={cn(
                        "w-4 h-4 text-zinc-500",
                        isInteractive && "hover:text-foreground",
                      )}
                    />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span
                    className={cn(
                      "text-sm font-bold text-foreground truncate",
                      done && "text-muted-foreground/60 line-through",
                    )}
                  >
                    {h.name}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-500/80 mt-0.5">
                    {done ? "Concluído hoje" : "Pendente"}
                  </span>
                </div>
              </div>

              <div className="shrink-0 flex flex-col items-start justify-center px-3 py-1.5 rounded-xl bg-neutral-200/70 dark:bg-neutral-900/30 border border-neutral-300/40 dark:border-border/30 min-w-[72px] text-left">
                <span
                  className={cn(
                    "block text-xs font-bold leading-none",
                    done ? theme.text : "text-zinc-650 dark:text-zinc-500",
                  )}
                >
                  {streak}d
                </span>
                <span className="text-[9px] font-semibold text-neutral-500 dark:text-neutral-400 block mt-1">
                  Sequência
                </span>
              </div>
            </button>
          );
        })}
        {positiveHabits.length === 0 && (
          <p className="text-xs text-neutral-600 italic">
            Nenhum hábito positivo ativo
          </p>
        )}
      </div>
    </BaseWidget>
  );
}
