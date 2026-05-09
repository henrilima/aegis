"use client";

import { Moon, Star } from "lucide-react";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import { formatDateShort, formatDurationMin } from "../../helpers";
import type { SleepEntry } from "../../types";
import { BaseWidget } from "../BaseWidget";

interface SonoWidgetProps {
  recentSleep: SleepEntry[];
  avgSleepMin: number;
  avgQuality: number;
  goalSleepMin: number | null;
  sleepPct: number;
  isEditMode?: boolean;
}

export function SonoWidget({
  recentSleep,
  avgSleepMin,
  avgQuality,
  goalSleepMin,
  sleepPct,
  isEditMode,
}: SonoWidgetProps) {
  const color = getModuleColor("sleep");
  const theme = getColorTheme(color);

  return (
    <BaseWidget
      title="Sono"
      icon={Moon}
      color={color}
      route="sleep"
      isEditMode={isEditMode}
    >
      <div className="flex flex-col gap-[4cqw] @sm:gap-4">
        <div className="flex items-center gap-[6cqw] @sm:gap-6">
          <div className="flex-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl @sm:text-3xl font-black text-foreground tabular-nums">
                {avgSleepMin > 0 ? formatDurationMin(avgSleepMin) : "-"}
              </span>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
              Duração média
            </p>
          </div>
          <div className="w-px h-8 bg-muted" />
          <div className="flex-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl @sm:text-3xl font-black text-foreground tabular-nums">
                {avgQuality}
              </span>
              <span className="text-xs font-bold text-muted-foreground">
                /5
              </span>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
              Qualidade
            </p>
          </div>
        </div>

        {goalSleepMin !== null && avgSleepMin > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px] font-medium">
              <span className="text-muted-foreground">
                <span className={theme.text}>
                  {formatDurationMin(avgSleepMin)}
                </span>{" "}
                de{" "}
                <span className={theme.text}>
                  {formatDurationMin(goalSleepMin)}
                </span>
              </span>
              <span className={theme.text}>{sleepPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  sleepPct >= 90
                    ? "bg-emerald-500"
                    : sleepPct >= 70
                      ? theme.text.replace("text-", "bg-")
                      : "bg-red-500",
                )}
                style={{ width: `${sleepPct}%` }}
              />
            </div>
          </div>
        )}

        <div className="space-y-[1.5cqw] @sm:space-y-1.5 mt-1">
          {recentSleep.slice(0, 3).map((e, i) => (
            <div
              key={e.id ?? i}
              className="flex items-center justify-between p-[2cqw] @sm:p-2 rounded-xl bg-neutral-800/30 border border-border/50"
            >
              <div className="flex items-center gap-[2cqw] @sm:gap-2 min-w-0">
                <div
                  className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    theme.bgHover
                      .replace("hover:bg", "bg")
                      .replace("/20", "/60"),
                  )}
                />
                <span className="text-[3cqw] @sm:text-xs font-medium text-muted-foreground truncate">
                  {formatDateShort(e.date)}
                </span>
              </div>
              <div className="flex items-center gap-[3cqw] @sm:gap-3">
                <span className="text-[2.5cqw] @sm:text-[10px] font-bold text-muted-foreground">
                  {formatDurationMin(e.durationMinutes)}
                </span>
                <div className="flex items-center gap-0.5">
                  <Star
                    className={cn(
                      "w-[2.5cqw] h-[2.5cqw] @sm:w-2.5 @sm:h-2.5 fill-current",
                      e.quality >= 4
                        ? "text-emerald-600 dark:text-emerald-400"
                        : e.quality >= 3
                          ? theme.text
                          : "text-rose-400",
                    )}
                  />
                  <span
                    className={cn(
                      "text-[2.5cqw] @sm:text-[10px] font-bold",
                      e.quality >= 4
                        ? "text-emerald-600 dark:text-emerald-400"
                        : e.quality >= 3
                          ? theme.text
                          : "text-rose-400",
                    )}
                  >
                    {e.quality}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {recentSleep.length === 0 && (
            <p className="text-xs text-neutral-600 italic">
              Sem registros recentes
            </p>
          )}
        </div>
      </div>
    </BaseWidget>
  );
}
