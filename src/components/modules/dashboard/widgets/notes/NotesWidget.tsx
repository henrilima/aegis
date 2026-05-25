"use client";

import { Pin, Plus, StickyNote } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { NoteCreateModal } from "@/components/modules/notes/components/modals/noteCreateModal";
import { Button } from "@/components/ui/button";
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
  onCreateNote,
  isEditMode,
  isInteractive,
  onToggleInteractive,
}: NotesWidgetProps) {
  const color = getModuleColor("notes");
  const theme = getColorTheme(color);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const regularNotes = notes.filter((n) => !n.pinned);
  const pinnedNotes = notes.filter((n) => n.pinned);

  return (
    <>
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
                  setIsModalOpen(true);
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
            {pinnedNotes
              .concat(regularNotes)
              .slice(0, 3)
              .map((n) => (
                <div
                  key={n.id}
                  className="flex items-center justify-between p-[2.5cqw] @sm:p-2.5 rounded-xl border border-border/40 bg-neutral-900/10 hover:bg-neutral-900/20 hover:border-border/60 transition-all gap-4 group/note cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={cn(
                        "shrink-0 p-2 rounded-xl bg-neutral-900/40 border border-border/30",
                        theme.text,
                      )}
                    >
                      <StickyNote className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm font-bold text-foreground truncate group-hover/note:text-foreground transition-colors">
                        {n.title}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-500/80 mt-0.5">
                        {n.pinned ? "Nota fixada" : "Nota rápida"}
                      </span>
                    </div>
                  </div>

                  {n.pinned && (
                    <div className="shrink-0 flex flex-col items-start justify-center px-3 py-1.5 rounded-xl bg-neutral-900/30 border border-border/30 min-w-[50px] text-left">
                      <Pin className={cn("w-3.5 h-3.5", theme.text)} />
                      <span className="text-[9px] font-semibold text-neutral-500 block mt-1">
                        Fixada
                      </span>
                    </div>
                  )}
                </div>
              ))}
            {notes.length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                Nenhuma nota registrada
              </p>
            )}
          </div>
        </div>
      </BaseWidget>

      {isModalOpen && (
        <NoteCreateModal
          onAdd={(title, content) => {
            onCreateNote(title, content);
            setIsModalOpen(false);
          }}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
