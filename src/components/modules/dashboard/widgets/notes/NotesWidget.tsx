"use client";

import { Pin, Plus, StickyNote } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { useNavigation } from "@/context/NavigationContext";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { Note } from "../../types";
import { BaseWidget } from "../BaseWidget";

interface NotesWidgetProps {
  notes: Note[];
  onCreateNote: (title: string, content: string) => void;
  isEditMode?: boolean;
  isInteractive?: boolean;
  onToggleInteractive?: () => void;
}

export function NotesWidget({
  notes,
  isEditMode,
  isInteractive,
  onToggleInteractive,
}: NotesWidgetProps) {
  const color = getModuleColor("notes");
  const theme = getColorTheme(color);
  const { navigate } = useNavigation();

  const regularNotes = notes.filter((n) => !n.pinned);
  const pinnedNotes = notes.filter((n) => n.pinned);
  const displayedNotes = [
    ...pinnedNotes,
    ...regularNotes.slice(0, Math.max(0, 3 - pinnedNotes.length)),
  ];

  return (
    <BaseWidget
      title="Anotações"
      icon={StickyNote}
      color={color}
      route="notes"
      isEditMode={isEditMode}
      isInteractive={isInteractive}
      onToggleInteractive={onToggleInteractive}
    >
      <div className="flex flex-col gap-[4cqw] @sm:gap-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-[8cqw] @sm:gap-10">
            <div className="text-left">
              <p className="text-2xl @sm:text-3xl font-bold text-foreground leading-none">
                {notes.length}
              </p>
              <p className="text-[10px] font-bold text-muted-foreground mt-1">
                Total
              </p>
            </div>
            <div className="text-left">
              <p className="text-2xl @sm:text-3xl font-bold text-foreground leading-none">
                {pinnedNotes.length}
              </p>
              <p className="text-[10px] font-bold text-muted-foreground mt-1">
                Fixadas
              </p>
            </div>
          </div>

          {isInteractive && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                navigate("notes", "?action=new");
              }}
              className={cn(
                "h-7 px-2.5 text-xs text-white font-bold rounded-lg border-none gap-1",
                theme.solid,
                theme.solidHover,
              )}
            >
              <Plus className="w-3 h-3" />
              <span className="hidden @sm:inline">Nota rápida</span>
            </Button>
          )}
        </div>

        <div className="space-y-1.5">
          {pinnedNotes.length > 0 && (
            <div className="flex items-center gap-1 mb-1 text-left">
              <Pin className={cn("w-2.5 h-2.5 opacity-60", theme.text)} />
              <span
                className={cn("text-[10px] font-bold opacity-60", theme.text)}
              >
                Fixadas
              </span>
            </div>
          )}
          {displayedNotes.map((n) => (
            <button
              key={n.id}
              type="button"
              tabIndex={isInteractive ? 0 : undefined}
              onClick={(e) => {
                if (isInteractive) {
                  e.stopPropagation();
                  navigate("notes", `?noteId=${n.id}`);
                }
              }}
              onKeyDown={(e) => {
                if (isInteractive && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  navigate("notes", `?noteId=${n.id}`);
                }
              }}
              className={cn(
                "flex w-full items-center justify-between p-3 rounded-xl border border-border bg-card transition-all hover:bg-muted/30 gap-4 group/note text-left outline-none focus-visible:ring-1 focus-visible:ring-ring/50",
                isInteractive && "cursor-pointer",
              )}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={cn(
                    "shrink-0 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20",
                    theme.text,
                  )}
                >
                  <StickyNote className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                  <span className="text-sm font-bold text-foreground truncate group-hover/note:text-foreground transition-colors">
                    {n.title}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {n.pinned ? "Nota fixada" : "Nota rápida"}
                  </span>
                </div>
              </div>

              <div className="shrink-0 flex items-center">
                {n.pinned && (
                  <div
                    className={cn(
                      "flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-bold capitalize shrink-0",
                      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                    )}
                  >
                    <Pin className="w-3 h-3 shrink-0" />
                    <span>Fixada</span>
                  </div>
                )}
              </div>
            </button>
          ))}
          {notes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <p className="text-xs text-neutral-600 font-bold">
                Mural de Notas Vazio
              </p>
              <p className="text-[10px] text-neutral-600 font-medium max-w-[180px] mt-1">
                Escreva lembretes rápidos ou anotações para visualizar aqui.
              </p>
            </div>
          )}
        </div>
      </div>
    </BaseWidget>
  );
}
