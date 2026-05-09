"use client";

import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";

interface SleepGoalTabProps {
  goalHours: string;
  setGoalHours: (h: string) => void;
  goalBedtime: string;
  setGoalBedtime: (t: string) => void;
  reminderEnabled: boolean;
  setReminderEnabled: (r: boolean) => void;
  onSave: () => Promise<void>;
}

/**
 * Painel de Ajuste de Metas: Define objetivos de duração e horários de repouso
 */
export function SleepGoalTab({
  goalHours,
  setGoalHours,
  goalBedtime,
  setGoalBedtime,
  reminderEnabled,
  setReminderEnabled,
}: SleepGoalTabProps) {
  const theme = getColorTheme(getModuleColor("sleep"));

  const inputClass = cn(
    "flex-1 bg-background/50 border border-border rounded-xl px-4 py-2.5 text-sm font-bold text-foreground placeholder:text-neutral-700 focus:outline-none transition-all",
    theme.borderHover.replace("hover:", "focus:").replace("500", "500/50"),
    theme.textSub
      .replace("text-", "focus:ring-1 focus:ring-")
      .replace("400", "500/20"),
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
        {/* Meta de Duração Total */}
        <div className="group flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold text-muted-foreground">
              Duração Alvo (Horas)
            </span>
          </div>
          <div className="flex items-center gap-3 relative">
            <input
              type="number"
              min="1"
              max="14"
              step="0.5"
              className={inputClass}
              value={goalHours}
              onChange={(e) => setGoalHours(e.target.value)}
              placeholder="8"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
              <div className="w-px h-4 bg-border mx-1" />
              <span className={cn("text-xs font-bold", theme.text)}>h</span>
            </div>
          </div>
        </div>

        {/* Meta de Horário de Recolhimento */}
        <div className="group flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold text-muted-foreground">
              Ponto de Recolhimento
            </span>
          </div>
          <div className="flex items-center gap-3 relative">
            <input
              type="time"
              className={cn(inputClass, "appearance-none")}
              value={goalBedtime}
              onChange={(e) => setGoalBedtime(e.target.value)}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
              <div className="w-px h-4 bg-border mx-1" />
              <span className={cn("text-xs font-bold", theme.text)}>24h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lembrete Opcional */}
      <div className="p-5 bg-muted/30 border border-border/50 rounded-2xl flex items-center justify-between transition-all hover:bg-muted/40">
        <div>
          <p className="text-sm font-bold text-foreground">
            Notificação de Sono
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Avisa quando seu horário de repouso chegar
          </p>
        </div>
        <button
          type="button"
          onClick={() => setReminderEnabled(!reminderEnabled)}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 ease-in-out focus:outline-none",
            reminderEnabled ? theme.solid : "bg-muted/50",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white ring-0 transition duration-300 ease-in-out",
              reminderEnabled ? "translate-x-5" : "translate-x-0",
            )}
          />
        </button>
      </div>
    </div>
  );
}
