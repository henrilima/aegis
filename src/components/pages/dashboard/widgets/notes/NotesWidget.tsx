"use client";

import { Circle, Pin, Plus, StickyNote } from "lucide-react";
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

  const pendingNotes = notes.filter((n) => n.status === "pending" && !n.pinned);
  const pinnedNotes = notes.filter((n) => n.pinned);

  return (
    <>
      <BaseWidget
        title="Notas"
        icon={StickyNote}
        iconColor="text-orange-400"
        route="notes"
        isEditMode={isEditMode}
      >
        <div className="flex flex-col gap-[4cqw] @sm:gap-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-[8cqw] @sm:gap-10">
              <div className="text-center">
                <p className="text-[5cqw] @sm:text-2xl font-black text-white leading-none">
                  {pendingNotes.length}
                </p>
                <p className="text-[3.5cqw] @sm:text-sm font-bold text-neutral-500 mt-1 uppercase">
                  Pendentes
                </p>
              </div>
              <div className="text-center">
                <p className="text-[5cqw] @sm:text-2xl font-black text-white leading-none">
                  {pinnedNotes.length}
                </p>
                <p className="text-[3.5cqw] @sm:text-sm font-bold text-neutral-500 mt-1 uppercase">
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
              className="bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20 hover:text-orange-300 rounded-xl"
            >
              <Plus className="w-3.5 h-3.5" />
              Nota rápida
            </Button>
          </div>

          <div className="space-y-1.5">
            {pinnedNotes.length > 0 && (
              <div className="flex items-center gap-1 mb-1">
                <Pin className="w-2.5 h-2.5 text-orange-500/60" />
                <span className="text-[10px] font-bold text-orange-500/60 uppercaseer">
                  Fixadas
                </span>
              </div>
            )}
            {(pinnedNotes.length > 0 ? pinnedNotes : pendingNotes)
              .slice(0, 3)
              .map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-[2.5cqw] @sm:gap-3 p-[3cqw] @sm:p-3 rounded-xl bg-neutral-800/30 border border-neutral-800/50 group/note"
                >
                  <Circle className="w-[3.5cqw] h-[3.5cqw] @sm:w-4 @sm:h-4 text-neutral-700 shrink-0 mt-0.5" />
                  <span className="text-[3.5cqw] @sm:text-sm font-medium text-neutral-400 truncate flex-1 group-hover/note:text-neutral-200 transition-colors">
                    {n.title}
                  </span>
                </div>
              ))}
            {notes.length === 0 && (
              <p className="text-xs text-neutral-600 italic">
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
