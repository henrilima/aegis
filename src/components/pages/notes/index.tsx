"use client";

import { invoke } from "@tauri-apps/api/core";
import { StickyNote } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { NoteCreateModal } from "@/components/forms/notes/noteCreateModal";
import { NoteExpandModal } from "@/components/forms/notes/noteExpandModal";
import { CONFIRM_PRESETS, ConfirmModal } from "@/components/ui/ConfirmModal";
import { useAuth } from "@/context/AuthContext";
import { FileManager } from "./components/FileManager";
import { NotesHeader } from "./components/notesHeader";
import type { Note } from "./types";

const MAX_PINS = 3;

/**
 * Módulo de Notas: Gestão de anotações com suporte a markdown, fixação e status
 */
export default function NotesPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [creationPath, setCreationPath] = useState("");
  const [expandedNote, setExpandedNote] = useState<Note | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Estados compartilhados com o Header e FileManager
  const [searchQuery, setSearchQuery] = useState("");
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);

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
          pinned: false,
          path: creationPath || undefined,
        },
      });
      setIsNoteModalOpen(false);
      setCreationPath("");
      setRefreshTrigger((prev) => prev + 1);
      fetchNotes();
      toast.success("Nota salva com sucesso!");
    } catch {
      toast.error("Falha ao salvar nota");
    }
  };

  const handleUpdate = async (note: Note) => {
    try {
      await invoke("update_note", { note });
      setRefreshTrigger((prev) => prev + 1);
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
      setRefreshTrigger((prev) => prev + 1);
      fetchNotes();
      toast.success("Nota removida");
      if (expandedNote?.id === id) setExpandedNote(null);
    } catch {
      toast.error("Erro ao remover");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
          <StickyNote className="w-4 h-4" />
          <span className="font-semibold text-muted-foreground">
            Sincronizando notas...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6  text-foreground">
      <NotesHeader
        totalNotes={notes.length}
        pinnedCount={notes.filter((n) => n.pinned).length}
        maxPins={MAX_PINS}
        onNewNote={() => {
          setCreationPath("");
          setIsNoteModalOpen(true);
        }}
        onOpenFolder={() => invoke("open_notes_folder")}
        onNewFolder={() => setIsFolderModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
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

      <FileManager
        onNoteClick={(note) => setExpandedNote(note)}
        onNewNote={(path) => {
          setCreationPath(path);
          setIsNoteModalOpen(true);
        }}
        refreshTrigger={refreshTrigger}
        searchQuery={searchQuery}
        externalFolderTrigger={isFolderModalOpen}
        onFolderModalClose={() => setIsFolderModalOpen(false)}
      />

      {/* Confirmação */}
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
