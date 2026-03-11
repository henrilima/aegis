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
  onSave,
}: SleepGoalTabProps) {
  const inputStyle =
    "bg-neutral-950/40 border-neutral-800 h-12 rounded-2xl px-4  text-white focus:border-blue-500/40 transition-all font-bold shadow-inner";
  const labelStyle = "text-[10px] font-black uppercase text-neutral-600 ml-1";

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-xl animate-in zoom-in-95 duration-500">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-lg shadow-blue-500/5">
          <Target className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-black text-white leading-none">
            Arquitetura de Repouso
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
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
      </div>

      {/* Ação de Persistência */}
      <div className="mt-10 pt-8 border-t border-neutral-800/50">
        <Button
          type="button"
          onClick={onSave}
          className="w-full px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-xs font-bold border border-blue-600/30 transition-colors cursor-pointer"
        >
          Consolidar métricas
        </Button>
      </div>
    </div>
  );
}
