"use client";

import { invoke } from "@tauri-apps/api/core";
import { CheckCheck, Clock, Pin, StickyNote } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CONFIRM_PRESETS, ConfirmModal } from "@/components/ui/ConfirmModal";
import { useAuth } from "@/context/AuthContext";
import { NoteCard } from "./components/noteCard";
import { NotesHeader } from "./components/notesHeader";
import { NoteCreateModal } from "./noteCreateModal";
import { NoteExpandModal } from "./noteExpandModal";
import type { Note } from "./types";

const MAX_PINS = 3;
type TabId = "pending" | "done";

/**
 * Módulo de Notas: Gestão de anotações com suporte a markdown, fixação e status
 */
export default function NotesPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [expandedNote, setExpandedNote] = useState<Note | null>(null);
  const [tab, setTab] = useState<TabId>("pending");

  const uid = user ? String(user.id) : "";

  const fetchNotes = useCallback(async () => {
    if (!uid) return;
    try {
      const res = await invoke<Note[]>("list_notes", { userId: uid });
      setNotes(res);
    } catch {
      toast.error("Erro ao sincronizar notas");
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleAdd = async (title: string, content: string) => {
    if (!uid) return;
    try {
      await invoke("add_note", {
        note: {
          user_id: uid,
          title: title.trim(),
          content: content.trim(),
          created_at: new Date().toISOString(),
          status: "pending",
          pinned: false,
        } satisfies Omit<Note, "id">,
      });
      setIsNoteModalOpen(false);
      fetchNotes();
      toast.success("Nota salva com sucesso!");
    } catch {
      toast.error("Falha ao salvar nota");
    }
  };

  const handleUpdate = async (note: Note) => {
    try {
      await invoke("update_note", { note });
      fetchNotes();
      toast.success("Nota atualizada!");
      setExpandedNote(null);
    } catch {
      toast.error("Erro na atualização");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await invoke("delete_note", { id });
      fetchNotes();
      toast.success("Nota removida");
      if (expandedNote?.id === id) setExpandedNote(null);
    } catch {
      toast.error("Erro ao remover");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (note: Note) => {
    if (!note.id) return;
    const newStatus = note.status === "done" ? "pending" : "done";
    try {
      await invoke("update_note_status", { id: note.id, status: newStatus });
      fetchNotes();
    } catch {
      toast.error("Erro ao atualizar status");
    }
  };

  const handleTogglePin = async (note: Note) => {
    if (!note.id) return;
    const pinnedCount = notes.filter((n) => n.pinned).length;
    if (!note.pinned && pinnedCount >= MAX_PINS) {
      toast.warning(`Limite de ${MAX_PINS} notas fixadas atingido.`);
      return;
    }
    try {
      await invoke("update_note_pinned", { id: note.id, pinned: !note.pinned });
      fetchNotes();
    } catch {
      toast.error("Erro ao fixar nota");
    }
  };

  const pinnedNotes = notes.filter((n) => n.pinned);
  const pendingNotes = notes.filter((n) => !n.pinned && n.status === "pending");
  const doneNotes = notes.filter((n) => !n.pinned && n.status === "done");

  const TABS = [
    {
      id: "pending" as const,
      label: "Pendentes",
      icon: Clock,
      count: pendingNotes.length,
    },
    {
      id: "done" as const,
      label: "Concluídas",
      icon: CheckCheck,
      count: doneNotes.length,
    },
  ];

  const currentList = tab === "pending" ? pendingNotes : doneNotes;

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-neutral-500 animate-pulse">
          <StickyNote className="w-4 h-4" />
          <span className="font-bold">Sincronizando notas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col gap-6 overflow-auto pb-10 animate-in fade-in duration-500 text-white">
      <NotesHeader
        totalNotes={notes.length}
        pinnedCount={pinnedNotes.length}
        maxPins={MAX_PINS}
        onNewNote={() => setIsNoteModalOpen(true)}
        onOpenFolder={() => invoke("open_notes_folder")}
      />

      {isNoteModalOpen && (
        <NoteCreateModal
          onAdd={handleAdd}
          onClose={() => setIsNoteModalOpen(false)}
        />
      )}

      {expandedNote && (
        <NoteExpandModal
          note={expandedNote}
          onSave={handleUpdate}
          onClose={() => setExpandedNote(null)}
        />
      )}

      {/* Seção de Notas Fixadas */}
      {pinnedNotes.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-black uppercase text-orange-500 flex items-center gap-2">
            <Pin className="w-3 h-3" /> Fixadas ({pinnedNotes.length}/{MAX_PINS}
            )
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinnedNotes.map((n) => (
              <NoteCard
                key={n.id}
                note={n}
                onClick={() => setExpandedNote(n)}
                onToggleStatus={handleToggleStatus}
                onTogglePin={handleTogglePin}
                onDelete={(id) => setDeletingId(id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Navegação por Status */}
      <div className="flex gap-1 p-1.5 bg-neutral-950 border border-neutral-700/60 rounded-2xl w-fit shadow-lg shadow-black/30">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              tab === t.id
                ? "bg-orange-500/25 text-orange-300 border border-orange-500/40 shadow-sm shadow-orange-500/10"
                : "text-neutral-500 hover:text-neutral-200 hover:bg-white/5"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md ${tab === t.id ? "bg-orange-500/20 text-orange-300" : "bg-neutral-800 text-neutral-600"}`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Listagem de Notas (Filtro Ativo) */}
      {currentList.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-neutral-800">
          <div className="p-4 rounded-full bg-neutral-900/50">
            <StickyNote className="w-10 h-10 opacity-10" />
          </div>
          <p className="text-sm font-bold uppercase opacity-30">
            {tab === "pending" ? "Nenhuma nota pendente" : "Histórico vazio"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentList.map((n) => (
            <NoteCard
              key={n.id}
              note={n}
              onClick={() => setExpandedNote(n)}
              onToggleStatus={handleToggleStatus}
              onTogglePin={handleTogglePin}
              onDelete={(id) => setDeletingId(id)}
            />
          ))}
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deletingId !== null && (
        <ConfirmModal
          {...CONFIRM_PRESETS.deleteNote}
          onConfirm={() => handleDelete(deletingId)}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  );
}
