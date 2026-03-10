"use client";

import { Moon, Plus } from "lucide-react";

interface SleepHeaderProps {
  onNew: () => void;
}

/**
 * Cabeçalho do módulo de sono com título e botão de novo registro
 */
export function SleepHeader({ onNew }: SleepHeaderProps) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <Moon className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold leading-none">Análise de Sono</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Monitore e otimize seu descanso
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onNew}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors cursor-pointer"
      >
        <Plus className="w-4 h-4" /> Registrar Sono
      </button>
    </div>
  );
}
