"use client";

import { CheckCircle, Circle, Pin, PinOff, Trash2 } from "lucide-react";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import type { Note } from "../types";

/**
 * Utilitário para limpar markdown do conteúdo para preview
 */
const stripMarkdown = (text: string) => {
  if (!text) return "";
  return text
    .replace(/^#+\s+/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/`{1,3}([^`\n]+)`{1,3}/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
};

interface NoteCardProps {
  note: Note;
  onClick: () => void;
  onToggleStatus: (n: Note) => void;
  onTogglePin: (n: Note) => void;
  onDelete: (id: number) => void;
}

/**
 * Card individual de nota: Suporta preview limpo, fixação e marcação de conclusão
 */
export function NoteCard({
  note: n,
  onClick,
  onToggleStatus,
  onTogglePin,
  onDelete,
}: NoteCardProps) {
  const isDone = n.status === "done";

  return (
    <div
      className={`group relative bg-neutral-900 border rounded-xl p-4 flex flex-col gap-2 transition-all hover:border-neutral-700 text-left ${
        n.pinned ? "border-orange-500/50" : "border-neutral-800"
      } ${isDone ? "opacity-60" : ""}`}
    >
      {/* Clique na área do card */}
      <button
        type="button"
        onClick={onClick}
        className="absolute inset-0 w-full h-full cursor-pointer rounded-xl z-0"
        aria-label={`Ver nota: ${n.title}`}
      />

      <div className="flex items-start justify-between gap-2 relative z-10 pointer-events-none">
        {/* Toggle de Conclusão */}
        <ToolTip
          content={isDone ? "Marcar como pendente" : "Marcar como concluída"}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus(n);
            }}
            className="shrink-0 mt-0.5 text-neutral-600 hover:text-orange-400 transition-colors cursor-pointer pointer-events-auto"
          >
            {isDone ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <Circle className="w-4 h-4" />
            )}
          </button>
        </ToolTip>

        <p
          className={`font-bold leading-snug flex-1 text-left ${isDone ? "line-through text-neutral-500" : "text-neutral-200"}`}
        >
          {n.title}
        </p>

        {/* Ações Rápidas (Hover) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
          <ToolTip content={n.pinned ? "Desafixar" : "Fixar nota"}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(n);
              }}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                n.pinned
                  ? "text-orange-400 hover:bg-orange-500/10"
                  : "text-neutral-700 hover:text-orange-400 hover:bg-orange-500/10"
              }`}
            >
              {n.pinned ? (
                <PinOff className="w-3.5 h-3.5" />
              ) : (
                <Pin className="w-3.5 h-3.5" />
              )}
            </button>
          </ToolTip>
          <ToolTip content="Excluir nota">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (n.id) onDelete(n.id);
              }}
              className="p-1.5 rounded-lg text-neutral-700 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </ToolTip>
        </div>
      </div>

      {/* Preview do conteúdo truncado */}
      {n.content && (
        <div className="relative z-10 text-xs text-neutral-500 line-clamp-3 whitespace-pre-wrap leading-relaxed pl-6 pointer-events-none">
          {stripMarkdown(n.content)}
        </div>
      )}

      {/* Rodapé do Card */}
      <p className="relative z-10 text-[10px] text-neutral-700 font-bold uppercase mt-auto pt-2 border-t border-neutral-800 pl-6 pointer-events-none">
        {new Date(n.created_at).toLocaleDateString("pt-BR")}
      </p>
    </div>
  );
}
