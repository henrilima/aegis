import { Pin, PinOff, Trash2 } from "lucide-react";
import { resolveTaskStyles } from "@/colors.config";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { cn } from "@/lib/utils";
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
  onTogglePin: (n: Note) => void;
  onDelete: (id: number) => void;
}

/**
 * Card individual de nota: Suporta preview limpo e fixação
 */
export function NoteCard({
  note: n,
  onClick,
  onTogglePin,
  onDelete,
}: NoteCardProps) {
  const styles = resolveTaskStyles(n.color);

  return (
    <div
      className={cn(
        "group relative bg-card border rounded-xl p-4 flex flex-col gap-2 transition-all text-left",
        n.pinned
          ? "border-orange-500/50 bg-orange-500/5"
          : "border-border hover:bg-muted/30",
      )}
      style={
        {
          borderColor: n.pinned ? undefined : styles.borderColor,
        } as React.CSSProperties
      }
    >
      {/* Clique na área do card */}
      <button
        type="button"
        onClick={onClick}
        className="absolute inset-0 w-full h-full cursor-pointer rounded-xl z-0"
        aria-label={`Ver nota: ${n.title}`}
      />

      <div className="flex items-start justify-between gap-2 relative z-10 pointer-events-none">
        <p
          className={cn(
            "font-bold leading-snug flex-1 text-left text-foreground",
            n.color && !n.pinned && "text-foreground/90",
          )}
          style={{ color: !n.pinned && n.color ? styles.iconColor : undefined }}
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
              className={cn(
                "p-1.5 rounded-lg transition-all cursor-pointer",
                n.pinned
                  ? "text-orange-600 dark:text-orange-400 hover:bg-orange-500/10"
                  : "text-muted-foreground hover:bg-accent",
              )}
              style={!n.pinned && n.color ? { color: styles.iconColor } : {}}
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
              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </ToolTip>
        </div>
      </div>

      {/* Preview do conteúdo truncado */}
      {n.content && (
        <div className="relative z-10 text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap leading-relaxed pl-6 pointer-events-none opacity-80">
          {stripMarkdown(n.content)}
        </div>
      )}

      {/* Rodapé do Card */}
      <div className="relative z-10 mt-auto pt-2 border-t border-border/50 pl-6 flex items-center justify-between pointer-events-none">
        <p className="text-[10px] text-muted-foreground/60 font-bold uppercase">
          {new Date(n.createdAt).toLocaleDateString("pt-BR")}
        </p>
        {n.color && !n.pinned && (
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: styles.iconColor }}
          />
        )}
      </div>
    </div>
  );
}
