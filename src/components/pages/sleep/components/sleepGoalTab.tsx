"use client";

import { Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  onSave,
}: SleepGoalTabProps) {
  const inputStyle =
    "bg-background/40 border-border h-12 rounded-xl px-4  text-foreground focus:border-blue-500/40 transition-all font-bold";
  const labelStyle = "text-[10px] font-black uppercase text-neutral-600 ml-1";

  return (
    <div className="bg-card border border-border rounded-xl p-8 animate-in zoom-in-95 duration-500">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
          <Target className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-black text-foreground leading-none">
            Arquitetura de Repouso
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Parametrização de objetivos biológicos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Meta de Duração Total */}
        <div className="space-y-2.5">
          <Label htmlFor="sg-hours" className={labelStyle}>
            Janela de Sono Alvo (Horas)
          </Label>
          <Input
            id="sg-hours"
            type="number"
            min="1"
            max="14"
            step="0.5"
            className={inputStyle}
            value={goalHours}
            onChange={(e) => setGoalHours(e.target.value)}
          />
        </div>

        {/* Meta de Horário de Recolhimento */}
        <div className="space-y-2.5">
          <Label htmlFor="sg-bedtime" className={labelStyle}>
            Ponto de Recolhimento Ideal
          </Label>
          <Input
            id="sg-bedtime"
            type="time"
            className={inputStyle}
            value={goalBedtime}
            onChange={(e) => setGoalBedtime(e.target.value)}
          />
        </div>
        {/* Lembrete Opcional */}
        <div className="col-span-1 md:col-span-2 mt-4 space-y-2.5">
          <div className="flex items-center justify-between p-4 bg-background/40 border border-border rounded-xl">
            <div>
              <p className="text-sm font-bold text-foreground">
                Lembrete de Sono
              </p>
              <p className="text-xs text-muted-foreground">
                Aviso para a hora de dormir. Notificar quando o seu horário de
                recolhimento chegar.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setReminderEnabled(!reminderEnabled)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                reminderEnabled ? "bg-blue-500" : "bg-muted"
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  reminderEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Ação de Persistência */}
      <div className="mt-10 border-border/50">
        <Button
          type="button"
          onClick={onSave}
          className="w-full px-3 py-4 rounded-xl bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-xs font-bold border border-blue-600/30 transition-colors cursor-pointer"
        >
          Consolidar métricas
        </Button>
      </div>
    </div>
  );
}
