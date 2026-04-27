"use client";

import { AlarmClock, Bell, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppAlarm } from "../../../alarms/index";
import { BaseWidget } from "../BaseWidget";

interface AlarmsWidgetProps {
  alarms: AppAlarm[];
  isEditMode?: boolean;
}

export function AlarmsWidget({ alarms, isEditMode }: AlarmsWidgetProps) {
  const enabledCount = alarms.filter((a) => a.enabled).length;

  // Encontra o próximo alarme (simplificado: por horário HH:MM)
  const nextAlarm = alarms
    .filter((a) => a.enabled)
    .sort((a, b) => a.time.localeCompare(b.time))[0];

  return (
    <BaseWidget
      title="Alarmes"
      icon={AlarmClock}
      iconColor="text-red-400"
      route="alarms"
      isEditMode={isEditMode}
    >
      <div className="flex flex-col gap-[6cqw] @sm:gap-4">
        <div className="flex items-center gap-[6cqw] @sm:gap-5">
          <div className="flex-1 p-[5cqw] @sm:p-5 rounded-xl bg-red-500/5 border border-red-500/10">
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
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 animate-pulse-subtle">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-red-500">
                  Próximo alerta
                </span>
                <Clock className="w-3 h-3 text-red-500/50" />
              </div>
              <p className="text-sm font-bold text-foreground truncate">
                {nextAlarm.title}
              </p>
              <p className="text-lg font-black text-red-500">
                {nextAlarm.alarm_type === "fixed"
                  ? nextAlarm.time
                  : `A cada ${nextAlarm.interval_minutes}m`}
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
                    {a.alarm_type === "fixed"
                      ? a.time
                      : `${a.interval_minutes}m`}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </BaseWidget>
  );
}
