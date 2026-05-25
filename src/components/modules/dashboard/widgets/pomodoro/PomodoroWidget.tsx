"use client";

import { Pause, Play, Square, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { useTime } from "@/context/TimeContext";
import { cn, getColorTheme, HEX_COLORS, type ThemeColorKey } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import { fmtTime, pomodoroClock } from "../../helpers";
import type { PomodoroState } from "../../types";
import { BaseWidget } from "../BaseWidget";
import { Ring } from "../ui";

interface PomodoroWidgetProps {
  pomodoro: PomodoroState | null;
  isEditMode?: boolean;
  isInteractive?: boolean;
  onToggleInteractive?: () => void;
  onTogglePomo?: () => void;
  onStopPomo?: () => void;
}

export function PomodoroWidget({
  pomodoro,
  isEditMode,
  isInteractive,
  onToggleInteractive,
  onTogglePomo,
  onStopPomo,
}: PomodoroWidgetProps) {
  const color = getModuleColor("pomodoro");
  const theme = getColorTheme(color);
  const hexColor = HEX_COLORS[color as ThemeColorKey] || "#f97316";
  const { now: simulatedNow } = useTime();
  const [remainingSeconds, setRemainingSeconds] = useState(
    pomodoro ? pomodoroClock(pomodoro, simulatedNow) : 0,
  );

  useEffect(() => {
    if (!pomodoro) {
      setRemainingSeconds(0);
      return;
    }
    setRemainingSeconds(pomodoroClock(pomodoro, simulatedNow));
    if (!pomodoro.isRunning) return;
    const id = setInterval(
      () => setRemainingSeconds(pomodoroClock(pomodoro, simulatedNow)),
      1000,
    );
    return () => clearInterval(id);
  }, [pomodoro, simulatedNow]);

  const durationSec = pomodoro
    ? (pomodoro.cycleType === "Work"
        ? pomodoro.workMinutes
        : pomodoro.breakMinutes) * 60
    : 1;

  const pct = pomodoro
    ? Math.round(((durationSec - remainingSeconds) / durationSec) * 100)
    : 0;
  const isRunning = pomodoro?.isRunning ?? false;

  return (
    <BaseWidget
      title="Pomodoro"
      icon={Timer}
      color={color}
      route="pomodoro"
      isEditMode={isEditMode}
      isInteractive={isInteractive}
      onToggleInteractive={onToggleInteractive}
    >
      <div className="flex flex-col items-center justify-center gap-[4.5cqw] @sm:gap-4 py-2">
        <div className="relative w-[38cqw] h-[38cqw] min-w-[110px] min-h-[110px] max-w-[240px] max-h-[240px]">
          <Ring
            pct={pct}
            color={isRunning ? hexColor : "#262626"}
            size={120}
            stroke={8}
            className="w-full h-full"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl @sm:text-3xl font-bold text-foreground leading-none">
              {fmtTime(remainingSeconds)}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground mt-1">
              {pomodoro?.cycleType === "Work" ? "Foco" : "Pausa"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-[7cqw] @sm:gap-6">
          <div>
            <p className="text-xl @sm:text-2xl font-bold text-foreground leading-none">
              {pomodoro?.cyclesCompleted ?? 0}
            </p>
            <p className="text-[10px] font-bold text-muted-foreground mt-1">
              Ciclos hoje
            </p>
          </div>
          <div className="w-px h-6 bg-muted" />

          {isInteractive ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePomo?.();
                }}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  isRunning
                    ? cn(theme.bg, theme.text, theme.bgHover)
                    : "bg-primary/10 text-primary hover:bg-primary/20",
                )}
              >
                {isRunning ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
              </button>
              <button
                type="button"
                disabled={!isRunning && pomodoro?.cyclesCompleted === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  onStopPomo?.();
                }}
                className="p-2 rounded-xl bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-30 transition-all"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {isRunning ? (
                <div
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full border",
                    theme.bg,
                    theme.border,
                  )}
                >
                  <div
                    className={cn(
                      "w-1.5 h-1.5 rounded-full animate-pulse",
                      theme.solid,
                    )}
                  />
                  <span className={cn("text-[10px] font-bold", theme.text)}>
                    Ativo
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-800 border border-border">
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
                  <span className="text-[10px] font-bold text-muted-foreground">
                    Parado
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </BaseWidget>
  );
}
