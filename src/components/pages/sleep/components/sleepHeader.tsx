"use client";

import { Moon, Plus, Settings } from "lucide-react";

interface SleepHeaderProps {
  onNew: () => void;
  onOpenSettings: () => void;
}

/**
 * Cabeçalho do módulo de sono com título e botão de novo registro
 */
export function SleepHeader({ onNew, onOpenSettings }: SleepHeaderProps) {
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
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white  font-bold transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Registrar Sono
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white border border-neutral-700 transition-all cursor-pointer"
          title="Configurações e Metas"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
