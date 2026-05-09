"use client";

import { AlarmClock, Bell, Clock } from "lucide-react";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { AppAlarm } from "../../../alarms/types";
import { BaseWidget } from "../BaseWidget";

interface AlarmsWidgetProps {
  alarms: AppAlarm[];
  isEditMode?: boolean;
}

export function AlarmsWidget({ alarms, isEditMode }: AlarmsWidgetProps) {
  const color = getModuleColor("alarms");
  const theme = getColorTheme(color);

  const enabledCount = alarms.filter((a) => a.enabled).length;

  // Encontra o próximo alarme (simplificado: por horário HH:MM)
  const nextAlarm = alarms
    .filter((a) => a.enabled)
    .sort((a, b) => a.time.localeCompare(b.time))[0];

  return (
    <BaseWidget
      title="Alarmes"
      icon={AlarmClock}
      color={color}
      route="alarms"
      isEditMode={isEditMode}
    >
      <div className="flex flex-col gap-[6cqw] @sm:gap-4">
        <div className="flex items-center gap-[6cqw] @sm:gap-5">
          <div
            className={cn(
              "flex-1 p-[5cqw] @sm:p-5 rounded-xl border",
              theme.bg,
              theme.border,
            )}
          >
            <p className="text-[7cqw] @sm:text-xl font-black text-foreground leading-none">
              {enabledCount}
            </p>
            <p className="text-[3.5cqw] @sm:text-sm font-bold text-muted-foreground mt-2">
              Ativos
            </p>
          </div>
          <div className="flex-1 p-[5cqw] @sm:p-5 rounded-xl bg-neutral-800/20 border border-border/50">
            <p className="text-[7cqw] @sm:text-xl font-black text-foreground leading-none">
              {alarms.length}
            </p>
            <p className="text-[3.5cqw] @sm:text-sm font-bold text-muted-foreground mt-2">
              Total
            </p>
          </div>
        </div>

        <div className="space-y-[2cqw] @sm:space-y-2">
          {nextAlarm ? (
            <div
              className={cn(
                "p-4 rounded-xl border animate-pulse-subtle",
                theme.bg,
                theme.border,
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={cn("text-[10px] font-bold", theme.text)}>
                  Próximo alerta
                </span>
                <Clock className={cn("w-3 h-3 opacity-50", theme.text)} />
              </div>
              <p className="text-sm font-bold text-foreground truncate">
                {nextAlarm.title}
              </p>
              <p className={cn("text-lg font-black", theme.text)}>
                {nextAlarm.alarmType === "fixed"
                  ? nextAlarm.time
                  : `A cada ${nextAlarm.intervalMinutes}m`}
              </p>
            </div>
          ) : (
            <p className="text-xs text-neutral-600 italic px-1">
              Nenhum alarme ativo no momento
            </p>
          )}

          <div className="mt-2 space-y-1.5">
            {alarms
              .filter((a) => a.id !== nextAlarm?.id)
              .slice(0, 1)
              .map((a) => (
                <div
                  key={`a-key${a.id}`}
                  className={cn(
                    "flex items-center gap-3 p-2.5 rounded-lg bg-neutral-800/20 border border-border/40",
                    !a.enabled && "opacity-50",
                  )}
                >
                  <Bell className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-bold text-muted-foreground flex-1 truncate">
                    {a.title}
                  </span>
                  <span className="text-xs font-black text-foreground">
                    {a.alarmType === "fixed" ? a.time : `${a.intervalMinutes}m`}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </BaseWidget>
  );
}
