"use client";

import { Bell, Droplet } from "lucide-react";
import type { HydrationReminder } from "../../types";
import { BaseWidget } from "../BaseWidget";

interface HydrationWidgetProps {
  reminders: HydrationReminder[];
  isEditMode?: boolean;
}

export function HydrationWidget({
  reminders,
  isEditMode,
}: HydrationWidgetProps) {
  const enabledCount = reminders.filter((r) => r.enabled).length;

  return (
    <BaseWidget
      title="Hidratação"
      icon={Droplet}
      iconColor="text-blue-400"
      route="hydration"
      isEditMode={isEditMode}
    >
      <div className="flex flex-col gap-[6cqw] @sm:gap-4">
        <div className="flex items-center gap-[6cqw] @sm:gap-5">
          <div className="flex-1 p-[5cqw] @sm:p-5 rounded-xl bg-blue-500/5 border border-blue-500/10 shadow-sm">
            <p className="text-[10cqw] @sm:text-2xl font-black text-white leading-none">
              {enabledCount}
            </p>
            <p className="text-[3.5cqw] @sm:text-sm font-bold text-neutral-500 mt-2">
              Alertas ativos
            </p>
          </div>
          <div className="flex-1 p-[5cqw] @sm:p-5 rounded-xl bg-neutral-800/20 border border-neutral-800/50 shadow-sm">
            <p className="text-[10cqw] @sm:text-2xl font-black text-white leading-none">
              {reminders.length}
            </p>
            <p className="text-[3.5cqw] @sm:text-sm font-bold text-neutral-500 mt-2">
              Total
            </p>
          </div>
        </div>

        <div className="space-y-[2cqw] @sm:space-y-2">
          {reminders.slice(0, 2).map((r) => (
            <div
              key={`h-key${r.id}`}
              className="flex items-center gap-[4cqw] @sm:gap-3 p-[3cqw] @sm:p-3 rounded-xl bg-neutral-800/20 border border-neutral-800/40"
            >
              <Bell className="w-[4cqw] h-[4cqw] @sm:w-4.5 @sm:h-4.5 text-blue-500/60" />
              <span className="text-[3.5cqw] @sm:text-sm font-medium text-neutral-400 truncate flex-1">
                {r.reminder_type === "Interval"
                  ? `Cada ${r.value} min`
                  : `Às ${r.value}`}
              </span>
              {!r.enabled && (
                <span className="text-[2.5cqw] @sm:text-[9px] font-black text-neutral-600 uppercase">
                  OFF
                </span>
              )}
            </div>
          ))}
          {reminders.length === 0 && (
            <p className="text-xs text-neutral-600 italic">
              Sem alertas configurados
            </p>
          )}
        </div>
      </div>
    </BaseWidget>
  );
}
