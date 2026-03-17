"use client";

import { FolderOpen, Plus, StickyNote } from "lucide-react";
import { ToolTip } from "@/components/ui/ToolTipHelper";

interface NotesHeaderProps {
  totalNotes: number;
  pinnedCount: number;
  maxPins: number;
  onNewNote: () => void;
  onOpenFolder: () => void;
}

/**
 * Cabeçalho do Bloco de Notas com ações primárias
 */
export function NotesHeader({
  totalNotes,
  pinnedCount,
  maxPins,
  onNewNote,
  onOpenFolder,
}: NotesHeaderProps) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
          <StickyNote className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold leading-none">Bloco de Notas</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            {totalNotes} {totalNotes === 1 ? "nota" : "notas"} · {pinnedCount}/
            {maxPins} fixadas
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <ToolTip content="Abrir pasta de notas">
          <button
            type="button"
            onClick={onOpenFolder}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-orange-400 border border-neutral-800 transition-all text-xs font-bold h-auto cursor-pointer"
          >
            <FolderOpen className="w-4 h-4" />
            Pasta
          </button>
        </ToolTip>

        <ToolTip content="Criar nova nota">
          <button
            type="button"
            onClick={onNewNote}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-bold transition-colors border-none h-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Nova Nota
          </button>
        </ToolTip>
      </div>
    </div>
  );
}
