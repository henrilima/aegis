"use client";

import { BookOpen, Download, Plus, Settings, Upload } from "lucide-react";

interface StudiesHeaderProps {
  onImportCSV: () => void;
  onExportCSV: () => void;
  onNewSession: () => void;
  onOpenSettings: () => void;
}

export function StudiesHeader({
  onImportCSV,
  onExportCSV,
  onNewSession,
  onOpenSettings,
}: StudiesHeaderProps) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
          <BookOpen className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold leading-none">
            Estudos &amp; Desempenho
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Centro de comando acadêmico
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onImportCSV}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-violet-400 border border-neutral-700 transition-all cursor-pointer text-xs font-bold"
        >
          <Download className="w-4 h-4" />
          Importar
        </button>
        <button
          type="button"
          onClick={onExportCSV}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-violet-400 border border-neutral-700 transition-all cursor-pointer text-xs font-bold"
        >
          <Upload className="w-4 h-4" />
          Exportar
        </button>
        <button
          type="button"
          onClick={onNewSession}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white  font-bold transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Nova Sessão
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
