"use client";

import { HelpCircle, Moon, Plus, Settings } from "lucide-react";
import { ToolTip } from "@/components/ui/ToolTipHelper";

interface SleepHeaderProps {
  onNew: () => void;
  onOpenSettings: () => void;
  onOpenInfo: () => void;
}

/**
 * Cabeçalho do módulo de sono com título e botão de novo registro
 */
export function SleepHeader({
  onNew,
  onOpenSettings,
  onOpenInfo,
}: SleepHeaderProps) {
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
        <ToolTip content="Informações do Módulo">
          <button
            type="button"
            onClick={onOpenInfo}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-blue-400 border border-neutral-800 transition-all cursor-pointer text-xs font-bold"
          >
            <HelpCircle className="w-4 h-4" />
            Guia
          </button>
        </ToolTip>
        <ToolTip content="Configurações e Metas">
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-blue-400 border border-neutral-800 transition-all cursor-pointer text-xs font-bold"
          >
            <Settings className="w-4 h-4" />
            Metas
          </button>
        </ToolTip>

        <button
          type="button"
          onClick={onNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Registrar Sono
        </button>
      </div>
    </div>
  );
}
