"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  BookOpen,
  Calendar,
  Copy,
  Flame,
  HelpCircle,
  Layers,
  LayoutDashboard,
  Plus,
  Settings,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ModuleHeader } from "@/components/global/ModuleHeader";
import { StudyGuidePanel } from "@/components/modules/studies/components/modals/StudyInfoModal";
import { CONFIRM_PRESETS, ConfirmModal } from "@/components/ui/ConfirmModal";
import { useAuth } from "@/context/AuthContext";
import { useTime } from "@/context/TimeContext";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import { GradesModal } from "../grades";
import type { StudyGrade, SubjectMeta } from "../grades/types";
import type { AppConfig } from "../settings/useSettingsLogic";
import { HistoryTab } from "./components/historyTab";
import { MateriasTab } from "./components/materiasTab";
import { MetasTab } from "./components/metasTab";
import { OverviewTab } from "./components/overviewTab";
import { RelatorioTab } from "./components/reportTab";
import { SessionModal } from "./components/studiesModals";
import { StudiesHeatmap } from "./heatmap";
import type { StudyGoal, StudySession, TabId } from "./types";
import {
  computeStats,
  computeSubjectMap,
  isoDate,
  startOfMonth,
  startOfWeek,
} from "./utils";

/**
 * Módulo de Estudos: Gerencia sessões de estudo, metas e análise de performance
 */
export default function StudiesPage() {
  const { user } = useAuth();
  const color = getModuleColor("studies");
  const theme = getColorTheme(color);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("visao-geral");
  const [showForm, setShowForm] = useState(false);
  const [editSession, setEditSession] = useState<StudySession | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState("all");
  const [isSaving, setIsSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [weekStartDay, setWeekStartDay] = useState(1);
  const [showGrades, setShowGrades] = useState(false);
  const [subjectMetas, setSubjectMetas] = useState<SubjectMeta[]>([]);
  const [filterSubject, setFilterSubject] = useState("all");
  const [grades, setGrades] = useState<StudyGrade[]>([]);

  useEffect(() => {
    const handleOpenGrades = () => setShowGrades(true);
    const handleSidebarNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail === "studies") {
        setShowGrades(false);
        setTab("visao-geral");
      }
    };

    window.addEventListener("open-grades-module", handleOpenGrades);
    window.addEventListener("aegis-route-click", handleSidebarNavigate);

    return () => {
      window.removeEventListener("open-grades-module", handleOpenGrades);
      window.removeEventListener("aegis-route-click", handleSidebarNavigate);
    };
  }, []);

  const uid = user ? String(user.id) : "";

  // Carregamento inicial
  const load = useCallback(async () => {
    if (!uid) return;
    try {
      const results = await Promise.allSettled([
        invoke<StudySession[]>("estudos_list_sessions", {
          userId: uid,
          monthsBack: 5,
        }),
        invoke<StudyGoal[]>("estudos_list_goals", { userId: uid }),
        invoke<SubjectMeta[]>("subjects_list", { userId: uid }),
        invoke<StudyGrade[]>("grades_list", { userId: uid }),
      ]);

      if (results[0].status === "fulfilled") {
        setSessions(results[0].value);
      } else {
        toast.error(`Erro ao carregar sessões.`);
      }

      if (results[1].status === "fulfilled") {
        setGoals(results[1].value);
      }

      if (results[2].status === "fulfilled") {
        setSubjectMetas(results[2].value);
      }

      if (results[3].status === "fulfilled") {
        setGrades(results[3].value);
      }

      const config = await invoke<{ weekStartDay: number }>(
        "global_get_app_config",
      );
      setWeekStartDay(config.weekStartDay);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (s: StudySession) => {
    if (isSaving) return;
    try {
      setIsSaving(true);
      if (s.id) {
        await invoke("estudos_update_session", { session: s });
        toast.success("Sessão atualizada!");
      } else {
        await invoke("estudos_add_session", { session: s });
        toast.success("Sessão registrada!");
      }
      setShowForm(false);
      setEditSession(undefined);
      await load();
    } catch (err) {
      toast.error(`Erro ao salvar: ${err}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoalSave = async (gs: StudyGoal[]) => {
    try {
      await Promise.all(
        gs.map((g) => invoke("estudos_upsert_goal", { goal: g })),
      );
      await load();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await invoke("estudos_delete_session", { id, userId: uid });
      toast.success("Sessão removida");
      setDeleteConfirm(null);
      await load();
    } catch {
      toast.error("Erro ao remover");
    }
  };

  // Estatísticas e janelas temporais
  const { now: simulatedNow } = useTime();
  const weekStart = isoDate(startOfWeek(simulatedNow, weekStartDay));
  const monthStart = isoDate(startOfMonth(simulatedNow));

  const weekSessions = useMemo(
    () => sessions.filter((s) => s.date >= weekStart),
    [sessions, weekStart],
  );
  const monthSessions = useMemo(
    () => sessions.filter((s) => s.date >= monthStart),
    [sessions, monthStart],
  );

  const weekStats = useMemo(() => computeStats(weekSessions), [weekSessions]);
  const monthStats = useMemo(
    () => computeStats(monthSessions),
    [monthSessions],
  );
  const allStats = useMemo(() => computeStats(sessions), [sessions]);

  const goalValue = useCallback(
    (type: string) => goals.find((g) => g.goalType === type)?.targetValue ?? 0,
    [goals],
  );

  const goalProgress = useCallback(
    (current: number, type: string) => {
      const target = goalValue(type);
      if (!target) return 0;
      return Math.min(100, Math.round((current / target) * 100));
    },
    [goalValue],
  );

  const subjectMap = useMemo(() => computeSubjectMap(sessions), [sessions]);

  const existingSubjects = useMemo(() => {
    const set = new Set<string>();
    for (const s of sessions) set.add(s.subject);
    for (const m of subjectMetas) set.add(m.name);
    return Array.from(set).sort();
  }, [sessions, subjectMetas]);

  const months = useMemo(() => {
    const set = new Set<string>();
    for (const s of sessions) set.add(s.date.slice(0, 7));
    return Array.from(set).sort().reverse();
  }, [sessions]);

  const filteredSessions = useMemo(
    () =>
      sessions.filter((s) => {
        const matchSearch =
          search === "" ||
          s.subject.toLowerCase().includes(search.toLowerCase()) ||
          s.date.includes(search) ||
          (s.note ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (s.topic ?? "").toLowerCase().includes(search.toLowerCase());
        const matchMonth =
          filterMonth === "all" || s.date.startsWith(filterMonth);
        const matchSubject =
          filterSubject === "all" || s.subject === filterSubject;
        return matchSearch && matchMonth && matchSubject;
      }),
    [sessions, search, filterMonth, filterSubject],
  );

  if (loading)
    return (
      <div className="h-full flex items-center justify-center">
        <div
          className={cn("flex items-center gap-2 animate-pulse", theme.text)}
        >
          <BookOpen className="w-4 h-4" />
          <span className="font-bold">Sincronizando estudos...</span>
        </div>
      </div>
    );

  const STUDIES_TABS = [
    { id: "visao-geral", label: "Visão Geral", icon: LayoutDashboard },
    { id: "materias", label: "Matérias", icon: Layers },
    { id: "historico", label: "Histórico", icon: Calendar },
    { id: "heatmap", label: "Constância", icon: Flame },
    { id: "relatorio", label: "Relatório", icon: Copy },
    { id: "guia", label: "Guia", icon: HelpCircle },
  ];

  if (showGrades) {
    return (
      <GradesModal
        existingSubjects={existingSubjects}
        onClose={() => {
          setShowGrades(false);
          load();
        }}
        onRefresh={load}
      />
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 pb-10">
      <ModuleHeader
        color={getModuleColor("studies")}
        title="Estudos & Desempenho"
        subtitle="Centro de comando acadêmico"
        icon={BookOpen}
        tabs={STUDIES_TABS}
        activeTab={tab}
        onTabChange={(id) => setTab(id as TabId)}
        integrations={["dictionary", "pomodoro", "grades"]}
        actions={[
          {
            id: "settings",
            label: "Metas",
            icon: Settings,
            tooltip: "Configurações e Metas",
            onClick: () => setShowSettings(true),
          },
          {
            id: "new",
            label: "Nova sessão",
            icon: Plus,
            tooltip: "Registrar nova sessão de estudo",
            primary: true,
            onClick: () => {
              setEditSession(undefined);
              setShowForm(true);
            },
          },
        ]}
      />

      <SessionModal
        show={showForm}
        userId={uid}
        editSession={editSession}
        existingSubjects={existingSubjects}
        onSave={handleSave}
        onClose={() => {
          setShowForm(false);
          setEditSession(undefined);
        }}
        isSaving={isSaving}
      />

      {deleteConfirm !== null && (
        <ConfirmModal
          {...CONFIRM_PRESETS.deleteSession}
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {/* Conteúdo das abas */}
      {tab === "visao-geral" && (
        <OverviewTab
          weekStats={weekStats}
          monthStats={monthStats}
          allStats={allStats}
          goalValue={goalValue}
          goalProgress={goalProgress}
          subjectMap={subjectMap}
          grades={grades}
          onOpenGrades={() => setShowGrades(true)}
        />
      )}

      {tab === "historico" && (
        <HistoryTab
          sessions={filteredSessions}
          search={search}
          onSearchChange={setSearch}
          filterMonth={filterMonth}
          onFilterMonthChange={setFilterMonth}
          filterSubject={filterSubject}
          onFilterSubjectChange={setFilterSubject}
          subjects={existingSubjects}
          months={months}
          onEdit={(s) => {
            setEditSession(s);
            setShowForm(true);
          }}
          onDelete={setDeleteConfirm}
        />
      )}

      {tab === "heatmap" && <StudiesHeatmap sessions={sessions} />}

      {tab === "relatorio" && (
        <RelatorioTab
          sessions={sessions}
          allStats={allStats}
          goalValue={goalValue}
          weekStartDay={weekStartDay}
        />
      )}

      {tab === "guia" && <StudyGuidePanel />}

      {tab === "materias" && (
        <MateriasTab
          studySubjects={existingSubjects}
          userId={uid}
          onRefresh={load}
        />
      )}

      {/* Configurações e Metas */}
      {showSettings && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card/90 backdrop-blur-xl border border-border/60 rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-border/50 flex items-center justify-between bg-card/50">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-2xl bg-muted/50", theme.text)}>
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground">
                    Metas e Preferências
                  </h2>
                  <p className="text-xs text-muted-foreground font-medium">
                    Configure seu ambiente de estudos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="p-3 hover:bg-red-500/10 rounded-2xl transition-all text-muted-foreground hover:text-red-500 cursor-pointer group"
              >
                <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-1 custom-scrollbar">
              <div className="p-7">
                <MetasTab
                  goals={goals}
                  userId={uid}
                  onSave={handleGoalSave}
                  weekStartDay={weekStartDay}
                  onWeekStartChange={async (val: number) => {
                    setWeekStartDay(val);
                    const config = await invoke<AppConfig>(
                      "global_get_app_config",
                    );
                    await invoke("global_set_app_config", {
                      config: { ...config, weekStartDay: val },
                    });
                    toast.success("Início da semana atualizado!");
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
