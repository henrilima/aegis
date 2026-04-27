import {
  FolderOpen,
  FolderPlus,
  HelpCircle,
  Plus,
  Search,
  StickyNote,
} from "lucide-react";
import { ToolTip } from "@/components/ui/ToolTipHelper";

interface NotesHeaderProps {
  totalNotes: number;
  pinnedCount: number;
  maxPins: number;
  onNewNote: () => void;
  onOpenFolder: () => void;
  onNewFolder: () => void;
  onOpenInfo: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

/**
 * Cabeçalho do Bloco de Notas com ações primárias e controles do gerenciador de arquivos
 */
export function NotesHeader({
  totalNotes,
  pinnedCount,
  maxPins,
  onNewNote,
  onOpenFolder,
  onNewFolder,
  onOpenInfo,
  searchQuery,
  onSearchChange,
}: NotesHeaderProps) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-4 p-1">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <StickyNote className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-none">Anotações</h1>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">
              {totalNotes} {totalNotes === 1 ? "item" : "itens"} · {pinnedCount}
              /{maxPins} fixadas
            </p>
          </div>
        </div>

        {/* Search Bar no Header */}
        <div className="hidden md:flex items-center gap-2 bg-card/50 border border-border rounded-xl px-4 py-2 w-64 focus-within:border-orange-500/50 transition-all focus-within:ring-1 focus-within:ring-orange-500/20">
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar..."
            className="bg-transparent border-none outline-none text-xs w-full text-foreground placeholder:text-muted-foreground/50"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ToolTip content="Abrir pasta de notas">
          <button
            type="button"
            onClick={onOpenFolder}
            className="p-2.5 rounded-xl bg-card/50 hover:bg-accent/50 text-muted-foreground hover:text-orange-600 dark:text-orange-400 border border-border transition-all cursor-pointer"
          >
            <FolderOpen className="w-4 h-4" />
          </button>
        </ToolTip>

        <ToolTip content="Guia do Módulo">
          <button
            type="button"
            onClick={onOpenInfo}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card/50 hover:bg-accent/50 text-muted-foreground hover:text-orange-600 dark:text-orange-400 border border-border transition-all cursor-pointer text-xs font-bold"
          >
            <HelpCircle className="w-4 h-4" />
            Guia
          </button>
        </ToolTip>

        <ToolTip content="Nova Pasta">
          <button
            type="button"
            onClick={onNewFolder}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border hover:bg-accent/50 text-muted-foreground transition-all text-sm font-bold cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            Pasta
          </button>
        </ToolTip>

        <button
          type="button"
          onClick={onNewNote}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 dark:bg-orange-500 dark:hover:bg-orange-400 text-white font-bold transition-all cursor-pointer text-sm active:scale-95"
        >
          <Plus className="w-4 h-4" /> Nova Nota
        </button>
      </div>
    </div>
  );
}
