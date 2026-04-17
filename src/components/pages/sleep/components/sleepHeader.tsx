"use client";

import { HelpCircle, Moon, Plus, Settings } from "lucide-react";
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
              "flex items-center gap-2 px-3 py-2 rounded-xl bg-card hover:bg-accent transition-all cursor-pointer text-xs font-bold border border-border text-muted-foreground",
              `hover:${m.text}`,
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-upload-cloud"
              role="img"
              aria-labelledby="upload-cloud-title"
            >
              <title id="upload-cloud-title">Importar arquivo</title>
              <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
              <path d="M12 12v9" />
              <path d="m16 16-4-4-4 4" />
            </svg>
            Importar
          </button>
        </ToolTip>
        <ToolTip content="Exportar Dados (CSV)">
          <button
            type="button"
            onClick={onExportCSV}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl bg-card hover:bg-accent transition-all cursor-pointer text-xs font-bold border border-border text-muted-foreground",
              `hover:${m.text}`,
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-download-cloud"
              role="img"
              aria-labelledby="download-cloud-title"
            >
              <title id="download-cloud-title">Exportar arquivo</title>
              <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
              <path d="M12 12v9" />
              <path d="m8 17 4 4 4-4" />
            </svg>
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
            "shadow-blue-500/20",
          )}
        >
          <Plus className="w-4 h-4" /> Registrar Sono
        </button>
      </div>
    </div>
  );
}
