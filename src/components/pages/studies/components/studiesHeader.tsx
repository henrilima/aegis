"use client";

import {
  BookOpen,
  DownloadCloud,
  HelpCircle,
  Plus,
  Settings,
  UploadCloud,
} from "lucide-react";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { cn, getColorTheme } from "@/lib/utils";

interface StudiesHeaderProps {
  onImportCSV: () => void;
  onExportCSV: () => void;
  onNewSession: () => void;
  onOpenSettings: () => void;
  onOpenInfo: () => void;
}

export function StudiesHeader({
  onImportCSV,
  onExportCSV,
  onNewSession,
  onOpenSettings,
  onOpenInfo,
}: StudiesHeaderProps) {
  const moduleColor = "violet";
  const m = getColorTheme(moduleColor);

  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3">
        <div
          className={cn("p-2 rounded-xl border transition-all", m.bg, m.border)}
        >
          <BookOpen className={cn("w-5 h-5", m.text)} />
        </div>
        <div>
          <h1 className="text-xl font-bold leading-none">
            Estudos &amp; Desempenho
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Centro de comando acadêmico
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
              "flex items-center gap-2 px-3 py-2 rounded-xl bg-card hover:bg-accent/50 transition-all cursor-pointer text-xs font-bold border border-border text-muted-foreground",
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
              "flex items-center gap-2 px-3 py-2 rounded-xl bg-card hover:bg-accent/50 transition-all cursor-pointer text-xs font-bold border border-border text-muted-foreground",
              `hover:${m.text}`,
            )}
          >
            <Settings className="w-4 h-4" />
            Metas
          </button>
        </ToolTip>

        <ToolTip content="Registrar nova sessão de estudo">
          <button
            type="button"
            onClick={onNewSession}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-white font-bold transition-all cursor-pointer active:scale-95",
              m.solid,
              m.solidHover,
            )}
          >
            <Plus className="w-4 h-4" /> Nova sessão
          </button>
        </ToolTip>
      </div>
    </div>
  );
}
