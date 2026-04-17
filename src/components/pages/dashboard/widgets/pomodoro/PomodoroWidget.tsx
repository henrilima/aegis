"use client";

import { Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { useTime } from "@/context/TimeContext";
import { fmtTime, pomodoroClock } from "../../helpers";
import type { PomodoroState } from "../../types";
import { BaseWidget } from "../BaseWidget";
import { Ring } from "../ui";

interface PomodoroWidgetProps {
  pomodoro: PomodoroState | null;
  isEditMode?: boolean;
}

export function PomodoroWidget({ pomodoro, isEditMode }: PomodoroWidgetProps) {
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
    if (!pomodoro.is_running) return;
    const id = setInterval(
      () => setRemainingSeconds(pomodoroClock(pomodoro, simulatedNow)),
      1000,
    );
    return () => clearInterval(id);
  }, [pomodoro, simulatedNow]);

  const durationSec = pomodoro
    ? (pomodoro.cycle_type === "Work"
        ? pomodoro.work_minutes
        : pomodoro.break_minutes) * 60
    : 1;

  const pct = pomodoro
    ? Math.round(((durationSec - remainingSeconds) / durationSec) * 100)
    : 0;
  const isRunning = pomodoro?.is_running ?? false;

  return (
    <BaseWidget
      title="Pomodoro"
      icon={Timer}
      iconColor="text-red-600 dark:text-red-400"
      route="pomodoro"
      isEditMode={isEditMode}
    >
      <div className="flex flex-col items-center justify-center gap-[4.5cqw] @sm:gap-4 py-2">
        <div className="relative w-[38cqw] h-[38cqw] min-w-[110px] min-h-[110px] max-w-[240px] max-h-[240px]">
          <Ring
            pct={pct}
            color={isRunning ? "#ef4444" : "#262626"}
            size={120}
            stroke={8}
            className="w-full h-full"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl @sm:text-3xl font-black text-foreground leading-none">
              {fmtTime(remainingSeconds)}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
              {pomodoro?.cycle_type === "Work" ? "Foco" : "Pausa"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-[7cqw] @sm:gap-6">
          <div className="text-center">
            <p className="text-xl @sm:text-2xl font-black text-foreground leading-none">
              {pomodoro?.cycles_completed ?? 0}
            </p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
              Ciclos hoje
            </p>
          </div>
          <div className="w-px h-6 bg-muted" />
          <div className="flex items-center gap-2">
            {isRunning ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-bold text-red-500">
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
        </div>
      </div>
    </BaseWidget>
  );
}
