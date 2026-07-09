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
import { NoteExpandModal } from "@/components/modules/notes/components/modals/noteExpandModal";
import { CONFIRM_PRESETS, ConfirmModal } from "@/components/ui/ConfirmModal";
import { useAuth } from "@/context/AuthContext";
import { useTime } from "@/context/TimeContext";
import { getModuleColor } from "@/modules.config";

// O gerenciador usa DnD e só é carregado ao abrir Notas.
const FileManager = lazy(() =>
  import("./components/FileManager").then((m) => ({ default: m.FileManager })),
);

import { NoteEditor } from "./components/NoteEditor";
import { NotesInfoModal } from "./components/NotesInfoModal";
import type { Note } from "./types";

export default function NotesPage() {
  const { user } = useAuth();
  const { now: simulatedNow } = useTime();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [expandedNote, setExpandedNote] = useState<Note | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [currentPath, setCurrentPath] = useState("");

  const uid = user ? String(user.id) : "";

  const fetchNotes = useCallback(async () => {
    if (!uid) return;
    try {
      const res = await invoke<Note[]>("note_list_notes", { userId: uid });
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

  const handleNoteClick = useCallback((note: Note, edit = false) => {
    setEditMode(edit);
    setExpandedNote(note);
  }, []);

  const handleCreateEmptyNote = useCallback(
    async (path?: string) => {
      if (!uid) return;
      try {
        const targetPath = path !== undefined ? path : currentPath;
        const newId = await invoke<number>("note_add_note", {
          note: {
            userId: uid,
            title: "",
            content: "",
            createdAt: simulatedNow.toISOString(),
            pinned: false,
            path: targetPath || undefined,
          },
        });

        setRefreshTrigger((prev) => prev + 1);
        await fetchNotes();

        const newNote: Note = {
          id: newId,
          userId: uid,
          title: "",
          content: "",
          createdAt: simulatedNow.toISOString(),
          pinned: false,
          path: targetPath || undefined,
        };
        setExpandedNote(newNote);
        setEditMode(true);
        toast.success("Nova nota criada!");
      } catch (err) {
        toast.error(typeof err === "string" ? err : "Falha ao criar nota");
      }
    },
    [uid, currentPath, simulatedNow, fetchNotes],
  );

  useEffect(() => {
    if (loading) return;

    const params = new URLSearchParams(window.location.search);
    const action = params.get("action");
    const noteId = params.get("noteId");

    if (action === "new") {
      window.history.replaceState(null, "", "/dashboard/notes");
      handleCreateEmptyNote();
    } else if (noteId && notes.length > 0) {
      const nid = Number(noteId);
      const note = notes.find((n) => n.id === nid);
      if (note) {
        window.history.replaceState(null, "", "/dashboard/notes");
        handleNoteClick(note, false);
      }
    }
  }, [loading, notes, handleCreateEmptyNote, handleNoteClick]);

  const handleUpdate = useCallback(
    async (note: Note) => {
      try {
        await invoke("note_update_note", { note });
        setRefreshTrigger((prev) => prev + 1);
        fetchNotes();
        toast.success("Nota atualizada!");
        setExpandedNote(null);
        setEditMode(false);
      } catch (err) {
        toast.error(typeof err === "string" ? err : "Erro na atualização");
      }
    },
    [fetchNotes],
  );

  const handleUpdateEditor = useCallback(
    async (note: Note) => {
      try {
        await invoke("note_update_note", { note });
        setRefreshTrigger((prev) => prev + 1);
        setExpandedNote(note);
        fetchNotes();
      } catch (err) {
        toast.error(typeof err === "string" ? err : "Erro na atualização");
        throw err;
      }
    },
    [fetchNotes],
  );

  const handleDelete = async (id: number) => {
    try {
      await invoke("note_delete_note", { id, userId: user?.id });
      setRefreshTrigger((prev) => prev + 1);
      fetchNotes();
      toast.success("Nota removida");
      if (expandedNote?.id === id) {
        setExpandedNote(null);
        setEditMode(false);
      }
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

  if (expandedNote) {
    return (
      <div className="w-full flex flex-col h-full text-foreground">
        <NoteEditor
          note={expandedNote}
          onSave={handleUpdateEditor}
          onClose={() => {
            setExpandedNote(null);
            setEditMode(false);
          }}
          onDelete={async (id) => {
            setDeletingId(id);
          }}
        />

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

  return (
    <div className="w-full flex flex-col gap-6  text-foreground">
      <ModuleHeader
        color={getModuleColor("notes")}
        title="Anotações"
        subtitle={`${notes.length} ${notes.length === 1 ? "item" : "itens"} · ${notes.filter((n) => n.pinned).length} fixadas`}
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
            onClick: () => invoke("note_open_notes_folder"),
          },
          {
            id: "info",
            icon: HelpCircle,
            tooltip: "Guia do Módulo",
            onClick: () => setShowInfo(true),
          },
          {
            id: "folder-new",
            label: "Nova Pasta",
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
              handleCreateEmptyNote(currentPath);
            },
          },
        ]}
      />

      <NotesInfoModal show={showInfo} onClose={() => setShowInfo(false)} />

      {expandedNote && (
        <NoteExpandModal
          note={expandedNote}
          initialEditMode={editMode}
          onSave={handleUpdate}
          onClose={() => {
            setExpandedNote(null);
            setEditMode(false);
          }}
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
          onNoteClick={handleNoteClick}
          onNewNote={(path) => {
            handleCreateEmptyNote(path);
          }}
          refreshTrigger={refreshTrigger}
          searchQuery={searchQuery}
          externalFolderTrigger={isFolderModalOpen}
          onFolderModalClose={() => setIsFolderModalOpen(false)}
          currentPath={currentPath}
          setCurrentPath={setCurrentPath}
        />
      </Suspense>

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
