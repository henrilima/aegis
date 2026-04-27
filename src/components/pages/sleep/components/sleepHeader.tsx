"use client";

import {
  DownloadCloud,
  HelpCircle,
  Moon,
  Plus,
  Settings,
  UploadCloud,
} from "lucide-react";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { cn, getColorTheme } from "@/lib/utils";

interface SleepHeaderProps {
  onNew: () => void;
  onOpenSettings: () => void;
  onOpenInfo: () => void;
  onImportCSV: () => void;
  onExportCSV: () => void;
}

/**
 * Cabeçalho do módulo de sono com título e botão de novo registro
 */
export function SleepHeader({
  onNew,
  onOpenSettings,
  onOpenInfo,
  onImportCSV,
  onExportCSV,
}: SleepHeaderProps) {
  const moduleColor = "blue";
  const m = getColorTheme(moduleColor);

  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3">
        <div
          className={cn("p-2 rounded-xl border transition-all", m.bg, m.border)}
        >
          <Moon className={cn("w-5 h-5", m.text)} />
        </div>
        <div>
          <h1 className="text-xl font-bold leading-none">Análise de Sono</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitore e otimize seu descanso
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <ToolTip content="Importar Dados (CSV)">
          <button
            type="button"
            onClick={onImportCSV}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl bg-card hover:bg-accent/50 transition-all cursor-pointer text-xs font-bold border border-border text-muted-foreground",
              `hover:${m.text}`,
            )}
          >
            <UploadCloud className="w-4 h-4" />
            Importar
          </button>
        </ToolTip>
        <ToolTip content="Exportar Dados (CSV)">
          <button
            type="button"
            onClick={onExportCSV}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl bg-card hover:bg-accent/50 transition-all cursor-pointer text-xs font-bold border border-border text-muted-foreground",
              `hover:${m.text}`,
            )}
          >
            <DownloadCloud className="w-4 h-4" />
            Exportar
          </button>
        </ToolTip>
        <ToolTip content="Guia do Módulo">
          <button
            type="button"
            onClick={onOpenInfo}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl bg-card hover:bg-accent transition-all cursor-pointer text-xs font-bold border border-border text-muted-foreground",
              `hover:${m.text}`,
            )}
          >
            <HelpCircle className="w-4 h-4" />
            Guia
          </button>
        </ToolTip>
        <ToolTip content="Configurações e Metas">
          <button
            type="button"
            onClick={onOpenSettings}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl bg-card hover:bg-accent transition-all cursor-pointer text-xs font-bold border border-border text-muted-foreground",
              `hover:${m.text}`,
            )}
          >
            <Settings className="w-4 h-4" />
            Metas
          </button>
        </ToolTip>

        <button
          type="button"
          onClick={onNew}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-white font-bold transition-all cursor-pointer active:scale-95",
            m.solid,
            m.solidHover,
          )}
        >
          <Plus className="w-4 h-4" /> Registrar Sono
        </button>
      </div>
    </div>
  );
}
