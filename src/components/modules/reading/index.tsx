"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  BarChart3,
  BookOpen,
  HelpCircle,
  HistoryIcon,
  LayoutDashboard,
  Library,
  Plus,
  Target,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ModuleHeader } from "@/components/global/ModuleHeader";
import {
  ConfirmModal,
  type ConfirmVariant,
} from "@/components/ui/ConfirmModal";
import { useAuth } from "@/context/AuthContext";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import { BookModal } from "./components/BookModal";
import { GoalsModal } from "./components/GoalsModal";
import { HistoryTab } from "./components/HistoryTab";
import { LibraryTab } from "./components/LibraryTab";
import { OverviewTab } from "./components/OverviewTab";
import { ReadingGuidePanel } from "./components/ReadingInfoModal";
import { ReportsTab } from "./components/ReportsTab";
import { SessionModal } from "./components/SessionModal";
import type { ReadingBook, ReadingGoal, ReadingSession, TabId } from "./types";

export default function ReadingPage() {
  const { user } = useAuth();
  const [books, setBooks] = useState<ReadingBook[]>([]);
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [goals, setGoals] = useState<ReadingGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedBook, setSelectedBook] = useState<ReadingBook | undefined>();
  const [selectedSession, setSelectedSession] = useState<
    ReadingSession | undefined
  >();

  interface AppConfig {
    week_starts_on_monday?: boolean;
    [key: string]: unknown;
  }
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [confirmState, setConfirmState] = useState<{
    show: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant: ConfirmVariant;
  } | null>(null);

  const uid = user ? String(user.id) : "";

  const fetchData = useCallback(async () => {
    if (!uid) return;
    try {
      const [booksData, sessionsData, goalsData, configData] =
        await Promise.all([
          invoke<ReadingBook[]>("reading_list_books", { userId: uid }),
          invoke<ReadingSession[]>("reading_list_sessions", {
            userId: uid,
            monthsBack: 12,
          }),
          invoke<ReadingGoal[]>("reading_list_goals", { userId: uid }),
          invoke<AppConfig>("global_get_app_config", { userId: uid }),
        ]);
      const sortedBooks = (booksData || []).sort((a, b) => {
        const priority: Record<string, number> = {
          Reading: 0,
          WantToRead: 1,
          Completed: 2,
          Dropped: 3,
        };
        return (priority[a.status] ?? 4) - (priority[b.status] ?? 4);
      });
      setBooks(sortedBooks);
      setSessions(sessionsData);
      setGoals(goalsData);
      setAppConfig(configData);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveBook = async (book: ReadingBook) => {
    if (isSaving) return;
    try {
      setIsSaving(true);
      await invoke("reading_upsert_book", { book: { ...book, userId: uid } });
      toast.success(book.id ? "Livro atualizado!" : "Livro adicionado!");
      setIsBookModalOpen(false);
      fetchData();
    } catch (_error) {
      toast.error("Erro ao salvar livro");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBook = (id: number) => {
    setConfirmState({
      show: true,
      title: "Remover Livro?",
      description:
        "Esta ação é irreversível e removerá permanentemente o livro e todo o seu histórico de leitura associado.",
      variant: "danger",
      onConfirm: async () => {
        try {
          await invoke("reading_delete_book", { id, userId: uid });
          toast.success("Livro removido da biblioteca");
          setConfirmState(null);
          fetchData();
        } catch (_error) {
          toast.error("Erro ao deletar livro");
        }
      },
    });
  };

  const handleDeleteSession = (id: number) => {
    setConfirmState({
      show: true,
      title: "Remover registro?",
      description:
        "Essa ação é irreversível e removerá permanentemente os dados desta sessão do seu histórico.",
      variant: "danger",
      onConfirm: async () => {
        try {
          await invoke("reading_delete_session", { id, userId: uid });
          toast.success("Sessão removida");
          setConfirmState(null);
          fetchData();
        } catch (_error) {
          toast.error("Erro ao deletar sessão");
        }
      },
    });
  };

  const handleSaveSession = async (session: ReadingSession) => {
    if (isSaving) return;
    try {
      setIsSaving(true);
      await invoke("reading_upsert_session", {
        session: { ...session, userId: uid },
      });
      toast.success(session.id ? "Sessão atualizada!" : "Sessão registrada!");
      setIsSessionModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Erro ao salvar sessão:", error);
      toast.error("Erro ao salvar sessão");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveGoals = async (
    newGoals: ReadingGoal[],
    weekStartsOnMonday: boolean,
  ) => {
    try {
      await Promise.all([
        ...newGoals.map((goal) => invoke("reading_upsert_goal", { goal })),
        invoke("global_set_app_config", {
          config: { ...appConfig, week_starts_on_monday: weekStartsOnMonday },
        }),
      ]);
      toast.success("Metas e preferências atualizadas!");
      setIsGoalsModalOpen(false);
      fetchData();
    } catch (_error) {
      toast.error("Erro ao salvar metas");
    }
  };

  const stats = useMemo(() => {
    const totalPages = sessions.reduce((acc, s) => acc + s.pagesRead, 0);
    const totalMinutes = sessions.reduce(
      (acc, s) => acc + s.durationMinutes,
      0,
    );
    const booksCompleted = books.filter((b) => b.status === "Completed").length;
    const booksReading = books.filter((b) => b.status === "Reading").length;
    const avgPpm = totalMinutes > 0 ? totalPages / totalMinutes : 0;

    return {
      totalPages,
      totalMinutes,
      booksCompleted,
      booksReading,
      sessionsCount: sessions.length,
      avgPpm,
    };
  }, [books, sessions]);

  const categories = useMemo(() => {
    const cats = books
      .map((b) => b.category)
      .filter((cat): cat is string => !!cat && cat !== "Geral");
    return Array.from(new Set(cats));
  }, [books]);

  if (loading) {
    const color = getModuleColor("reading");
    return (
      <div className="h-full flex items-center justify-center">
        <div
          className={cn(
            "flex items-center gap-2 animate-pulse",
            getColorTheme(color).text,
          )}
        >
          <BookOpen className="w-4 h-4" />
          <span className="text-sm font-medium">Carregando biblioteca...</span>
        </div>
      </div>
    );
  }

  const READING_TABS = [
    { id: "overview", label: "Visão Geral", icon: LayoutDashboard },
    { id: "history", label: "Histórico", icon: HistoryIcon },
    { id: "library", label: "Biblioteca", icon: Library },
    { id: "reports", label: "Relatórios", icon: BarChart3 },
    { id: "guia", label: "Guia", icon: HelpCircle },
  ];

  return (
    <div className="w-full h-full flex flex-col gap-6 overflow-auto pb-10">
      <ModuleHeader
        color={getModuleColor("reading")}
        title="Biblioteca & Progresso"
        subtitle="Gestão literária e metas de leitura"
        icon={BookOpen}
        tabs={READING_TABS}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
        integrations={["dictionary"]}
        actions={[
          {
            id: "goals",
            label: "Metas",
            icon: Target,
            tooltip: "Configurações e Metas",
            onClick: () => setIsGoalsModalOpen(true),
          },
          {
            id: "new",
            label: "Novo Livro",
            icon: Plus,
            tooltip: "Adicionar novo livro à biblioteca",
            primary: true,
            onClick: () => {
              setSelectedBook(undefined);
              setIsBookModalOpen(true);
            },
          },
        ]}
      />

      <div className="flex-1 min-h-0 min-w-0">
        {activeTab === "overview" && (
          <OverviewTab
            stats={stats}
            books={books || []}
            sessions={sessions || []}
            goals={goals || []}
            onNewSession={() => {
              setSelectedSession(undefined);
              setIsSessionModalOpen(true);
            }}
            onConfigGoals={() => setIsGoalsModalOpen(true)}
            onNewBook={() => {
              setSelectedBook(undefined);
              setIsBookModalOpen(true);
            }}
            onStartBook={async (book) => {
              try {
                await invoke("reading_upsert_book", {
                  book: { ...book, status: "Reading", userId: uid },
                });
                toast.success(`Iniciou a leitura de "${book.title}"!`);
                fetchData();
              } catch {
                toast.error("Erro ao iniciar leitura");
              }
            }}
          />
        )}
        {activeTab === "library" && (
          <LibraryTab
            books={books}
            avgPpm={stats.avgPpm}
            uid={uid}
            onRefresh={fetchData}
            onEdit={(book) => {
              setSelectedBook(book);
              setIsBookModalOpen(true);
            }}
            onDelete={handleDeleteBook}
          />
        )}
        {activeTab === "history" && (
          <HistoryTab
            sessions={sessions}
            books={books}
            onDelete={handleDeleteSession}
            onEdit={(session) => {
              setSelectedSession(session);
              setIsSessionModalOpen(true);
            }}
          />
        )}
        {activeTab === "reports" && (
          <ReportsTab sessions={sessions} books={books} goals={goals} />
        )}
        {activeTab === "guia" && <ReadingGuidePanel />}
      </div>

      <BookModal
        key={selectedBook?.id || "new-book"}
        show={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onSave={handleSaveBook}
        editBook={selectedBook}
        existingCategories={categories}
        isSaving={isSaving}
      />

      <SessionModal
        key={selectedSession?.id || "new-session"}
        show={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        onSave={handleSaveSession}
        books={books || []}
        editSession={selectedSession}
        isSaving={isSaving}
      />

      <GoalsModal
        show={isGoalsModalOpen}
        onClose={() => setIsGoalsModalOpen(false)}
        onSave={handleSaveGoals}
        goals={goals}
        uid={uid}
        weekStartsOnMondayInitial={appConfig?.week_starts_on_monday}
      />

      {confirmState?.show && (
        <ConfirmModal
          title={confirmState.title}
          description={confirmState.description}
          variant={confirmState.variant}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  );
}
