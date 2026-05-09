"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  FolderOpen,
  FolderPlus,
  HelpCircle,
  Plus,
  StickyNote,
} from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ModuleHeader } from "@/components/global/ModuleHeader";
import { NoteCreateModal } from "@/components/modules/notes/components/modals/noteCreateModal";
import { NoteExpandModal } from "@/components/modules/notes/components/modals/noteExpandModal";
import { CONFIRM_PRESETS, ConfirmModal } from "@/components/ui/ConfirmModal";
import { useAuth } from "@/context/AuthContext";
import { getModuleColor } from "@/modules.config";

// Lazy import: @dnd-kit só carrega quando o módulo de Notas for aberto
const FileManager = lazy(() =>
  import("./components/FileManager").then((m) => ({ default: m.FileManager })),
);

import { NotesInfoModal } from "./components/NotesInfoModal";
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
  const [showInfo, setShowInfo] = useState(false);

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

  const handleAdd = async (title: string, content: string, color?: string) => {
    if (!uid) return;
    try {
      await invoke("add_note", {
        note: {
          userId: uid,
          title: title.trim(),
          content: content.trim(),
          createdAt: new Date().toISOString(),
          pinned: false,
          path: creationPath || undefined,
          color,
        },
      });
      setIsNoteModalOpen(false);
      setCreationPath("");
      setRefreshTrigger((prev) => prev + 1);
      fetchNotes();
      toast.success("Nota salva com sucesso!");
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Falha ao salvar nota");
    }
  };

  const handleUpdate = async (note: Note) => {
    try {
      await invoke("update_note", { note });
      setRefreshTrigger((prev) => prev + 1);
      fetchNotes();
      toast.success("Nota atualizada!");
      setExpandedNote(null);
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Erro na atualização");
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
      <ModuleHeader
        color={getModuleColor("notes")}
        title="Anotações"
        subtitle={`${notes.length} ${notes.length === 1 ? "item" : "itens"} · ${notes.filter((n) => n.pinned).length}/${MAX_PINS} fixadas`}
        icon={StickyNote}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Buscar notas..."
        actions={[
          {
            id: "folder-open",
            label: "Abrir Pasta",
            icon: FolderOpen,
            tooltip: "Abrir pasta de notas",
            onClick: () => invoke("open_notes_folder"),
          },
          {
            id: "info",
            label: "Guia",
            icon: HelpCircle,
            tooltip: "Guia do Módulo",
            onClick: () => setShowInfo(true),
          },
          {
            id: "folder-new",
            label: "Pasta",
            icon: FolderPlus,
            tooltip: "Nova Pasta",
            onClick: () => setIsFolderModalOpen(true),
          },
          {
            id: "new",
            label: "Nova Nota",
            icon: Plus,
            tooltip: "Nova Nota",
            primary: true,
            onClick: () => {
              setCreationPath("");
              setIsNoteModalOpen(true);
            },
          },
        ]}
      />

      <NotesInfoModal show={showInfo} onClose={() => setShowInfo(false)} />

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

      <Suspense
        fallback={
          <div className="flex items-center gap-2 text-muted-foreground animate-pulse py-8">
            <StickyNote className="w-4 h-4" />
            <span className="text-sm font-medium">
              Carregando gerenciador...
            </span>
          </div>
        }
      >
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
      </Suspense>

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
