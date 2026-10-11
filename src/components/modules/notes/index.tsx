"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  BookLock,
  FolderOpen,
  FolderPlus,
  HelpCircle,
  Layout,
  Network,
  Plus,
  StickyNote,
} from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ModuleHeader } from "@/components/global/ModuleHeader";
import { DiaryUnlockModal } from "@/components/modules/notes/components/DiaryUnlockModal";
import { NoteExpandModal } from "@/components/modules/notes/components/modals/noteExpandModal";
import {
  NOTE_TEMPLATES,
  type NoteTemplate,
  NoteTemplateSelector,
} from "@/components/modules/notes/components/NoteTemplateSelector";
import { CONFIRM_PRESETS, ConfirmModal } from "@/components/ui/ConfirmModal";
import { useAuth } from "@/context/AuthContext";
import { useTime } from "@/context/TimeContext";
import { getModuleColor } from "@/modules.config";

// O gerenciador usa DnD e só é carregado ao abrir Notas.
const FileManager = lazy(() =>
  import("./components/FileManager").then((m) => ({ default: m.FileManager })),
);

import { DiaryJournalView } from "./components/DiaryJournalView";
import { NoteEditor } from "./components/NoteEditor";
import { NotesGraphView } from "./components/NotesGraphView";
import { NotesGuidePanel } from "./components/NotesInfoModal";
import type { Note } from "./types";

type NotesTabId = "files" | "diary" | "graph" | "guia";

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
  const [activeTab, setActiveTab] = useState<NotesTabId>("files");
  const [_preGuideTab, _setPreGuideTab] = useState<NotesTabId>("files");

  // Estado para modal de modelos e desbloqueio do diário
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);
  const [isDiaryUnlocked, setIsDiaryUnlocked] = useState(false);
  const [isDiaryUnlockModalOpen, setIsDiaryUnlockModalOpen] = useState(false);

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
    if (typeof window !== "undefined") {
      const lastConfirmed = (window as unknown as Record<string, unknown>)
        .__AEGIS_JUST_CONFIRMED__ as number | undefined;
      if (lastConfirmed && Date.now() - lastConfirmed < 800) {
        return;
      }
    }
    setEditMode(edit);
    setExpandedNote(note);
  }, []);

  const handleCreateNoteFromTemplate = useCallback(
    async (tmpl: NoteTemplate, isDiary = false) => {
      if (!uid) return;
      try {
        const targetPath = currentPath;
        const newId = await invoke<number>("note_add_note", {
          note: {
            userId: uid,
            title: tmpl.title,
            content: tmpl.content,
            createdAt: simulatedNow.toISOString(),
            pinned: false,
            path: targetPath || undefined,
            isDiary: isDiary,
          },
        });

        setRefreshTrigger((prev) => prev + 1);
        await fetchNotes();

        const newNote: Note = {
          id: newId,
          userId: uid,
          title: tmpl.title,
          content: tmpl.content,
          createdAt: simulatedNow.toISOString(),
          pinned: false,
          path: targetPath || undefined,
          isDiary: isDiary,
        };
        setExpandedNote(newNote);
        setEditMode(true);
        toast.success(
          isDiary ? "Nova página do diário criada!" : "Nova nota criada!",
        );
      } catch (err) {
        toast.error(typeof err === "string" ? err : "Falha ao criar nota");
      }
    },
    [uid, currentPath, simulatedNow, fetchNotes],
  );

  const handleCreateEmptyNote = useCallback(
    async (path?: string) => {
      if (!uid) return;
      try {
        const targetPath = path !== undefined ? path : currentPath;
        const isDiary = activeTab === "diary";
        const newId = await invoke<number>("note_add_note", {
          note: {
            userId: uid,
            title: isDiary
              ? `Diário: ${new Date().toLocaleDateString("pt-BR")}`
              : "",
            content: "",
            createdAt: simulatedNow.toISOString(),
            pinned: false,
            path: targetPath || undefined,
            isDiary: isDiary,
          },
        });

        setRefreshTrigger((prev) => prev + 1);
        await fetchNotes();

        const newNote: Note = {
          id: newId,
          userId: uid,
          title: isDiary
            ? `Diário: ${new Date().toLocaleDateString("pt-BR")}`
            : "",
          content: "",
          createdAt: simulatedNow.toISOString(),
          pinned: false,
          path: targetPath || undefined,
          isDiary: isDiary,
        };
        setExpandedNote(newNote);
        setEditMode(true);
        toast.success(
          isDiary ? "Nova página do diário criada!" : "Nova nota criada!",
        );
      } catch (err) {
        toast.error(typeof err === "string" ? err : "Falha ao criar nota");
      }
    },
    [uid, currentPath, simulatedNow, fetchNotes, activeTab],
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
    setDeletingId(null); // Fecha o modal síncronamente para desarmar UI
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
    }
  };

  const handleNavigateWikiLink = useCallback(
    (targetTitle: string) => {
      const cleanTitle = targetTitle.trim().toLowerCase();
      const found = notes.find(
        (n) => n.title.trim().toLowerCase() === cleanTitle,
      );
      if (found) {
        setExpandedNote(found);
        setEditMode(false);
        toast.info(`Abrindo "${found.title}"`);
      } else {
        toast.error(`A nota "${targetTitle}" não foi encontrada.`);
      }
    },
    [notes],
  );

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
          allNotes={notes}
          onSave={handleUpdateEditor}
          onClose={() => {
            setExpandedNote(null);
            setEditMode(false);
          }}
          onDelete={async (id) => {
            setDeletingId(id);
          }}
          onNavigateWikiLink={handleNavigateWikiLink}
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

  if (showInfo) {
    return (
      <div className="w-full flex flex-col gap-6 text-foreground">
        <ModuleHeader
          moduleId="notes"
          color={getModuleColor("notes")}
          title="Anotações"
          subtitle={`${notes.length} ${notes.length === 1 ? "item" : "itens"} · ${notes.filter((n) => n.pinned).length} fixadas`}
          icon={StickyNote}
          onTitleClick={() => setShowInfo(true)}
          titleHoverIcon={HelpCircle}
          titleTooltip="Visualizar Guia de Anotações"
          actions={[]}
        />
        <NotesGuidePanel onBack={() => setShowInfo(false)} />
      </div>
    );
  }

  const NOTE_MODULE_TABS = [
    { id: "files" as NotesTabId, label: "Minhas Notas", icon: StickyNote },
    { id: "diary" as NotesTabId, label: "Diário Pessoal", icon: BookLock },
    { id: "graph" as NotesTabId, label: "Grafo de Conexões", icon: Network },
  ];

  const handleTabChange = (tabId: string) => {
    const t = tabId as NotesTabId;
    if (t === "diary" && !isDiaryUnlocked) {
      setIsDiaryUnlockModalOpen(true);
      return;
    }
    setActiveTab(t);
  };

  const _diaryNotes = notes.filter((n) => n.isDiary);
  const _regularNotes = notes.filter((n) => !n.isDiary);

  return (
    <div className="w-full flex flex-col gap-6 text-foreground">
      <ModuleHeader
        moduleId="notes"
        color={getModuleColor("notes")}
        title="Anotações"
        subtitle={`${notes.length} ${notes.length === 1 ? "item" : "itens"} · ${notes.filter((n) => n.pinned).length} fixadas`}
        icon={StickyNote}
        tabs={NOTE_MODULE_TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onTitleClick={() => setShowInfo(true)}
        titleHoverIcon={HelpCircle}
        titleTooltip="Visualizar Guia de Anotações"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Buscar notas..."
        actions={[
          {
            id: "templates",
            label: "Modelos",
            icon: Layout,
            tooltip: "Modelos de Anotações",
            onClick: () => setIsTemplateSelectorOpen(true),
          },
          {
            id: "folder-open",
            label: "Abrir Pasta",
            icon: FolderOpen,
            tooltip: "Abrir pasta de notas",
            onClick: () => invoke("note_open_notes_folder"),
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
            label: activeTab === "diary" ? "Nova Entrada" : "Nova Nota",
            icon: Plus,
            tooltip:
              activeTab === "diary" ? "Nova Entrada no Diário" : "Nova Nota",
            primary: true,
            onClick: () => {
              handleCreateEmptyNote(currentPath);
            },
          },
        ]}
      />

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

      {activeTab === "graph" ? (
        <NotesGraphView
          notes={notes}
          onSelectNote={(n) => {
            setExpandedNote(n);
            setEditMode(false);
          }}
        />
      ) : activeTab === "diary" ? (
        <DiaryJournalView
          notes={notes}
          onNoteClick={handleNoteClick}
          onCreateEntry={() => {
            handleCreateNoteFromTemplate(NOTE_TEMPLATES[3], true);
          }}
          onDeleteNote={(id) => setDeletingId(id)}
        />
      ) : (
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
      )}

      {/* Modais */}
      <NoteTemplateSelector
        isOpen={isTemplateSelectorOpen}
        onClose={() => setIsTemplateSelectorOpen(false)}
        onSelectTemplate={(tmpl) =>
          handleCreateNoteFromTemplate(tmpl, activeTab === "diary")
        }
      />

      <DiaryUnlockModal
        isOpen={isDiaryUnlockModalOpen}
        onClose={() => setIsDiaryUnlockModalOpen(false)}
        onUnlocked={() => {
          setIsDiaryUnlocked(true);
          setIsDiaryUnlockModalOpen(false);
          setActiveTab("diary");
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
