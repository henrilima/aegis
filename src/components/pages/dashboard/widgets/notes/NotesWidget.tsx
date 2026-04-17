"use client";

import { Pin, Plus, StickyNote } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { NoteCreateModal } from "@/components/forms/notes/noteCreateModal";
import { Button } from "@/components/ui/button";
import type { Note } from "../../types";
import { BaseWidget } from "../BaseWidget";

interface NotesWidgetProps {
  notes: Note[];
  onCreateNote: (title: string, content: string) => void;
  isEditMode?: boolean;
}

export function NotesWidget({
  notes,
  onCreateNote,
  isEditMode,
}: NotesWidgetProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const regularNotes = notes.filter((n) => !n.pinned);
  const pinnedNotes = notes.filter((n) => n.pinned);

  return (
    <>
      <BaseWidget
        title="Anotações"
        icon={StickyNote}
        iconColor="text-orange-600 dark:text-orange-400"
        route="notes"
        isEditMode={isEditMode}
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

            <Button
              size="sm"
              variant="outline"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              className="h-7 px-2.5 text-xs bg-orange-600 hover:bg-orange-500 dark:bg-orange-500 dark:hover:bg-orange-400 text-white font-bold rounded-lg border-none gap-1"
            >
              <Plus className="w-3 h-3" />
              <span className="hidden @sm:inline">Nota rápida</span>
            </Button>
          </div>

          <div className="space-y-1.5">
            {pinnedNotes.length > 0 && (
              <div className="flex items-center gap-1 mb-1">
                <Pin className="w-2.5 h-2.5 text-orange-500/60" />
                <span className="text-[10px] font-bold text-orange-500/60 uppercase">
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
                  <StickyNote className="w-[3.5cqw] h-[3.5cqw] @sm:w-4 @sm:h-4 text-orange-500/70 shrink-0 mt-0.5" />
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
