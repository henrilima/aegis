"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  CheckCheck,
  CheckCircle,
  Circle,
  Clock,
  Pin,
  PinOff,
  Plus,
  StickyNote,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CONFIRM_PRESETS, ConfirmModal } from "@/components/ui/ConfirmModal";
import { useAuth } from "@/context/AuthContext";
import { NoteCreateModal } from "./note-create-modal";
import type { Note } from "./types";

const MAX_PINS = 3;
type TabId = "pending" | "done";

export default function NotesPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [tab, setTab] = useState<TabId>("pending");

  const fetchNotes = useCallback(async () => {
    if (!user) return;
    try {
      const res = await invoke<Note[]>("list_notes", {
        userId: String(user.id),
      });
      setNotes(res);
    } catch (err) {
      console.error("[NOTES] Erro ao carregar notas:", err);
      toast.error("Erro ao carregar notas");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleAdd = async (title: string, content: string) => {
    if (!user) return;
    try {
      await invoke("add_note", {
        note: {
          user_id: String(user.id),
          title: title.trim(),
          content: content.trim(),
          created_at: new Date().toISOString(),
          status: "pending",
          pinned: false,
        } satisfies Omit<Note, "id">,
      });
      setIsNoteModalOpen(false);
      fetchNotes();
      toast.success("Nota salva!");
    } catch (err) {
      console.error("[NOTES] Erro ao salvar nota:", err);
      toast.error("Erro ao salvar nota");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await invoke("delete_note", { id });
      fetchNotes();
      toast.success("Nota removida");
    } catch (err) {
      console.error("[NOTES] Erro ao remover nota:", err);
      toast.error("Erro ao remover");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (note: Note) => {
    if (!note.id) return;
    const newStatus = note.status === "done" ? "pending" : "done";
    try {
      // Alterna o status da nota entre pendente e concluída
      await invoke("update_note_status", { id: note.id, status: newStatus });
      fetchNotes();
    } catch (err) {
      console.error("[NOTES] Erro ao atualizar status:", err);
      toast.error("Erro ao atualizar status");
    }
  };

  const handleTogglePin = async (note: Note) => {
    if (!note.id) return;
    const pinnedCount = notes.filter((n) => n.pinned).length;
    if (!note.pinned && pinnedCount >= MAX_PINS) {
      toast.warning(`Máximo de ${MAX_PINS} notas fixadas.`);
      return;
    }
    try {
      // Alterna o estado de fixação da nota no topo da página
      await invoke("update_note_pinned", { id: note.id, pinned: !note.pinned });
      fetchNotes();
    } catch (err) {
      console.error("[NOTES] Erro ao fixar nota:", err);
      toast.error("Erro ao fixar nota");
    }
  };

  const pinnedNotes = notes.filter((n) => n.pinned);
  const pendingNotes = notes.filter((n) => !n.pinned && n.status === "pending");
  const doneNotes = notes.filter((n) => !n.pinned && n.status === "done");

  if (loading)
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-neutral-500 animate-pulse">
          <StickyNote className="w-4 h-4" /> Carregando notas...
        </div>
      </div>
    );

  const TABS: {
    id: TabId;
    label: string;
    icon: typeof Clock;
    count: number;
  }[] = [
    {
      id: "pending",
      label: "Pendentes",
      icon: Clock,
      count: pendingNotes.length,
    },
    {
      id: "done",
      label: "Concluídas",
      icon: CheckCheck,
      count: doneNotes.length,
    },
  ];

  const currentList = tab === "pending" ? pendingNotes : doneNotes;

  return (
    <>
      <div className="w-full h-full flex flex-col gap-6 overflow-auto pb-10 animate-in fade-in duration-500">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <StickyNote className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-none">Notas</h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                {notes.length} nota{notes.length !== 1 ? "s" : ""} ·{" "}
                {pinnedNotes.length}/{MAX_PINS} fixadas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsNoteModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-black text-sm font-bold transition-colors cursor-pointer shadow-lg shadow-orange-500/20"
          >
            <Plus className="w-4 h-4" /> Nova Nota
          </button>
        </div>

        {isNoteModalOpen && (
          <NoteCreateModal
            onAdd={handleAdd}
            onClose={() => setIsNoteModalOpen(false)}
          />
        )}

        {pinnedNotes.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-black uppercase  text-orange-500/70 flex items-center gap-1.5">
              <Pin className="w-3 h-3" /> Fixadas ({pinnedNotes.length}/
              {MAX_PINS})
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {pinnedNotes.map((n) => (
                <NoteCard
                  key={n.id}
                  note={n}
                  onToggleStatus={handleToggleStatus}
                  onTogglePin={handleTogglePin}
                  onDelete={(id) => setDeletingId(id)}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-2xl w-fit">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                tab === t.id
                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                  : "text-neutral-500 hover:text-neutral-200"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${tab === t.id ? "bg-neutral-900/60" : "bg-neutral-800 text-neutral-500"}`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {currentList.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-neutral-700">
            <StickyNote className="w-8 h-8 opacity-20" />
            <p className="text-sm">
              {tab === "pending"
                ? "Nenhuma nota pendente"
                : "Nenhuma nota concluída"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentList.map((n) => (
              <NoteCard
                key={n.id}
                note={n}
                onToggleStatus={handleToggleStatus}
                onTogglePin={handleTogglePin}
                onDelete={(id) => setDeletingId(id)}
              />
            ))}
          </div>
        )}
      </div>

      {deletingId !== null && (
        <ConfirmModal
          {...CONFIRM_PRESETS.deleteNote}
          onConfirm={() => handleDelete(deletingId)}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </>
  );
}

function NoteCard({
  note: n,
  onToggleStatus,
  onTogglePin,
  onDelete,
}: {
  note: Note;
  onToggleStatus: (n: Note) => void;
  onTogglePin: (n: Note) => void;
  onDelete: (id: number) => void;
}) {
  const isDone = n.status === "done";
  return (
    <div
      className={`group relative bg-neutral-900 border rounded-2xl p-4 flex flex-col gap-2 transition-all hover:border-neutral-700 ${n.pinned ? "border-orange-500/25 shadow-[0_0_15px_rgba(249,115,22,0.05)]" : "border-neutral-800"} ${isDone ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => onToggleStatus(n)}
          className="shrink-0 mt-0.5 text-neutral-600 hover:text-orange-400 transition-colors cursor-pointer"
          title={isDone ? "Marcar como pendente" : "Marcar como concluída"}
        >
          {isDone ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <Circle className="w-4 h-4" />
          )}
        </button>
        <p
          className={`font-bold text-sm leading-snug flex-1 ${isDone ? "line-through text-neutral-500" : ""}`}
        >
          {n.title}
        </p>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onTogglePin(n)}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${n.pinned ? "text-orange-400 hover:bg-orange-500/10" : "text-neutral-700 hover:text-orange-400 hover:bg-orange-500/10"}`}
            title={n.pinned ? "Desafixar" : "Fixar"}
          >
            {n.pinned ? (
              <PinOff className="w-3.5 h-3.5" />
            ) : (
              <Pin className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => n.id && onDelete(n.id)}
            className="p-1.5 rounded-lg text-neutral-700 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
            title="Excluir"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {n.content && (
        <p className="text-xs text-neutral-500 line-clamp-3 whitespace-pre-wrap leading-relaxed pl-6">
          {n.content}
        </p>
      )}
      <p className="text-[10px] text-neutral-700 font-bold uppercase  mt-auto pt-2 border-t border-neutral-800 pl-6">
        {new Date(n.created_at).toLocaleDateString("pt-BR")}
      </p>
    </div>
  );
}
