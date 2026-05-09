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
}

export function NotesWidget({
  notes,
  onCreateNote,
  isEditMode,
  isInteractive,
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
        onToggleInteractive={() => {}}
      >
        <div className="flex flex-col gap-[4cqw] @sm:gap-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-[8cqw] @sm:gap-10">
              <div className="text-center">
                <p className="text-2xl @sm:text-3xl font-black text-foreground leading-none">
                  {notes.length}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">
                  Total
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl @sm:text-3xl font-black text-foreground leading-none">
                  {pinnedNotes.length}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">
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
              <div className="flex items-center gap-1 mb-1">
                <Pin className={cn("w-2.5 h-2.5 opacity-60", theme.text)} />
                <span
                  className={cn(
                    "text-[10px] font-bold opacity-60 uppercase",
                    theme.text,
                  )}
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
                  className="flex items-start gap-[2.5cqw] @sm:gap-3 p-[3cqw] @sm:p-3 rounded-xl bg-muted/50 border border-border/50 group/note"
                >
                  <StickyNote
                    className={cn(
                      "w-[3.5cqw] h-[3.5cqw] @sm:w-4 @sm:h-4 opacity-70 shrink-0 mt-0.5",
                      theme.text,
                    )}
                  />
                  <span className="text-[3.5cqw] @sm:text-sm font-medium text-muted-foreground truncate flex-1 group-hover/note:text-foreground transition-colors">
                    {n.title}
                  </span>
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
