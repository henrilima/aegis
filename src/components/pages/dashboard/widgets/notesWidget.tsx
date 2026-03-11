"use client";

import { Circle, Pin, Plus, StickyNote } from "lucide-react";
import { useState } from "react";
import type { Note } from "@/components/pages/notes/types";
import { useNavigation } from "@/context/NavigationContext";
import { NoteCreateModal } from "@/components/forms/notes/noteCreateModal";

interface NotesWidgetProps {
  notes: Note[];
  pendingNotes: Note[];
  pinnedNotes: Note[];
  doneNotes: Note[];
  onCreateNote: (title: string, content: string) => void;
}

export function NotesWidget({
  notes,
  pendingNotes,
  pinnedNotes,
  doneNotes,
  onCreateNote,
}: NotesWidgetProps) {
  const { navigate } = useNavigation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: We cannot use a button here because it contains another button */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: We cannot use a button here because it contains another button */}
      <div
        onClick={() => navigate("notes")}
        className="relative group bg-neutral-900 border border-neutral-800 hover:border-orange-500/30 rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300 text-left w-full cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <StickyNote className="w-4 h-4 text-orange-400" />
            </div>
            <div className=" font-bold text-neutral-200">Notas</div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              // Impede que o clique no botão dispare o link do card pai
              e.stopPropagation();
              setIsModalOpen(true);
            }}
            className="relative z-1 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-[10px] font-bold border border-orange-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Nova
          </button>
        </div>

        <div className="relative z-1 grid grid-cols-3 gap-2">
          {[
            { label: "Pendentes", value: pendingNotes.length },
            { label: "Fixadas", value: pinnedNotes.length },
            { label: "Feitas", value: doneNotes.length },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center gap-0.5 p-2.5 bg-neutral-800/40 rounded-xl border border-neutral-800"
            >
              <span className="text-2xl font-black font-mono leading-none text-orange-400">
                {s.value}
              </span>
              <span className="text-[9px] font-black uppercase text-neutral-600">
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <div className="relative z-1 flex flex-col gap-1.5 flex-1">
          {pinnedNotes.length > 0 && (
            <p className="text-[10px] font-black uppercase text-orange-500/60 flex items-center gap-1">
              <Pin className="w-2.5 h-2.5" /> Fixadas
            </p>
          )}
          {/* Prioriza notas fixadas na visualização rápida do widget */}
          {(pinnedNotes.length > 0 ? pinnedNotes : pendingNotes)
            .slice(0, 4)
            .map((n) => (
              <div
                key={n.id}
                className="flex items-start gap-2 py-1.5 border-b border-neutral-800/60 last:border-0 hover:text-neutral-200 transition-colors group/note"
              >
                <Circle className="w-3 h-3 text-neutral-700 shrink-0 mt-0.5" />
                <span className="text-xs text-neutral-400 line-clamp-1 flex-1 group-hover/note:text-neutral-200">
                  {n.title}
                </span>
              </div>
            ))}
          {notes.length === 0 && (
            <p className="text-xs text-neutral-700">Nenhuma nota ainda</p>
          )}
        </div>
      </div>

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
