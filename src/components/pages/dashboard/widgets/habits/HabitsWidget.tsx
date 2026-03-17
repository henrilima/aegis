"use client";

import { Activity, CheckCircle2, Circle, Flame } from "lucide-react";
import type { Habit } from "@/components/pages/habits/types";
import { cn } from "@/lib/utils";
import { getHabitStreak } from "../../helpers";
import { BaseWidget } from "../BaseWidget";
import { Ring } from "../ui";

interface HabitsWidgetProps {
  habits: Habit[];
  isToday: (iso: string) => boolean;
  time: Date;
  isEditMode?: boolean;
}

export function HabitsWidget({
  habits,
  isToday,
  time,
  isEditMode,
}: HabitsWidgetProps) {
  const positiveHabits = habits.filter((h) => h.habit_type === "Positive");
  const doneToday = positiveHabits.filter(
    (h) => h.last_done && isToday(h.last_done),
  );

  const progressPct =
    positiveHabits.length > 0
      ? Math.round((doneToday.length / positiveHabits.length) * 100)
      : 0;

  const maxStreak = positiveHabits.reduce(
    (m, h) => Math.max(m, getHabitStreak(h, time)),
    0,
  );

  return (
    <BaseWidget
      title="Hábitos"
      icon={Activity}
      iconColor="text-teal-400"
      route="habits"
      isEditMode={isEditMode}
    >
      <div className="flex items-center gap-[5cqw] @sm:gap-7 mb-[5cqw] @sm:mb-5">
        <div className="relative shrink-0 w-[20cqw] h-[20cqw] min-w-[75px] min-h-[75px] max-w-[150px] max-h-[150px]">
          <Ring pct={progressPct} color="#2dd4bf" size={76} stroke={7} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[4cqw] @sm:text-xl font-bold text-teal-400 leading-none min-text-[13px]">
              {progressPct}%
            </span>
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1">
            <span className="text-[7.5cqw] @sm:text-4xl font-bold text-white min-text-[24px]">
              {doneToday.length}
            </span>
            <span className="text-[3.5cqw] @sm:text-lg font-medium text-neutral-500 min-text-[14px]">
              / {positiveHabits.length}
            </span>
          </div>
          <p className="text-[3cqw] @sm:text-xs font-medium text-neutral-500 min-text-[11px]">
            Concluídos hoje
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <Flame className="w-[4cqw] h-[4cqw] @sm:w-4 @sm:h-4 text-orange-400" />
            <span className="text-[3cqw] @sm:text-xs font-semibold text-neutral-400 min-text-[11px]">
              Recorde: <span className="text-orange-400">{maxStreak}d</span>
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {positiveHabits.slice(0, 3).map((h) => {
          const done = h.last_done && isToday(h.last_done);
          return (
            <div
              key={h.id}
              className="flex items-center justify-between p-[2cqw] @sm:p-2 rounded-xl bg-neutral-800/30 border border-neutral-800/50"
            >
              <div className="flex items-center gap-[2cqw] @sm:gap-2 min-w-0">
                {done ? (
                  <CheckCircle2 className="w-[4cqw] h-[4cqw] @sm:w-4 @sm:h-4 text-teal-400 shrink-0" />
                ) : (
                  <Circle className="w-[4cqw] h-[4cqw] @sm:w-4 @sm:h-4 text-neutral-600 shrink-0" />
                )}
                <span
                  className={cn(
                    "text-[3cqw] @sm:text-xs font-medium truncate",
                    done ? "text-neutral-500 line-through" : "text-neutral-300",
                  )}
                >
                  {h.name}
                </span>
              </div>
              <span className="text-[2.5cqw] @sm:text-[10px] font-bold text-neutral-600 ml-2">
                {getHabitStreak(h, time)}d
              </span>
            </div>
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
