"use client";

import { Activity, CheckCircle2, Circle, Flame } from "lucide-react";
import type { Habit } from "@/components/modules/habits/types";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import { getHabitStreak } from "../../helpers";
import { BaseWidget } from "../BaseWidget";
import { Ring } from "../ui";

interface HabitsWidgetProps {
  habits: Habit[];
  isToday: (iso: string) => boolean;
  time: Date;
  isEditMode?: boolean;
  isInteractive?: boolean;
  onToggleInteractive?: () => void;
  onToggleHabit?: (id: number) => void;
}

export function HabitsWidget({
  habits,
  isToday,
  time,
  isEditMode,
  isInteractive,
  onToggleInteractive,
  onToggleHabit,
}: HabitsWidgetProps) {
  const color = getModuleColor("habits");
  const theme = getColorTheme(color);

  const positiveHabits = habits.filter((h) => h.habitType === "Positive");
  const doneToday = positiveHabits.filter(
    (h) => h.lastDone && isToday(h.lastDone),
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
            <span className="text-2xl @sm:text-3xl font-black text-foreground">
              {doneToday.length}
            </span>
            <span className="text-lg @sm:text-xl font-bold text-muted-foreground">
              / {positiveHabits.length}
            </span>
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
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

      <div className="space-y-2">
        {positiveHabits.slice(0, 3).map((h) => {
          const done = h.lastDone && isToday(h.lastDone);
          return (
            <div
              key={h.id}
              className={cn(
                "flex items-center justify-between p-[2cqw] @sm:p-2 rounded-xl bg-neutral-800/30 border border-border/50",
                isInteractive &&
                  !done &&
                  "hover:bg-neutral-800/50 transition-colors",
              )}
            >
              <div className="flex items-center gap-[2cqw] @sm:gap-2 min-w-0">
                {isInteractive ? (
                  <button
                    type="button"
                    disabled={!!done}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!done && onToggleHabit && h.id !== undefined)
                        onToggleHabit(h.id);
                    }}
                    className={cn(
                      "shrink-0 transition-transform",
                      !done && "hover:scale-110 active:scale-95",
                    )}
                  >
                    {done ? (
                      <CheckCircle2
                        className={cn(
                          "w-[4cqw] h-[4cqw] @sm:w-4 @sm:h-4",
                          theme.text,
                        )}
                      />
                    ) : (
                      <Circle
                        className={cn(
                          "w-[4cqw] h-[4cqw] @sm:w-4 @sm:h-4 text-neutral-600 transition-colors",
                          theme.textDarkHover.replace("hover:", "hover:"),
                        )}
                      />
                    )}
                  </button>
                ) : done ? (
                  <CheckCircle2
                    className={cn(
                      "w-[4cqw] h-[4cqw] @sm:w-4 @sm:h-4 shrink-0",
                      theme.text,
                    )}
                  />
                ) : (
                  <Circle className="w-[4cqw] h-[4cqw] @sm:w-4 @sm:h-4 text-neutral-600 shrink-0" />
                )}
                <span
                  className={cn(
                    "text-[3cqw] @sm:text-xs font-medium truncate",
                    done
                      ? "text-muted-foreground line-through"
                      : "text-muted-foreground",
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
