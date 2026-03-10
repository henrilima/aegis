"use client";

import { invoke } from "@tauri-apps/api/core";
import { open as openDialog, save } from "@tauri-apps/plugin-dialog";
import { BookOpen, Plus, Settings } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { HistoryTab } from "./components/historyTab";
import { MetasTab } from "./components/metasTab";
import { OverviewTab } from "./components/overviewTab";
import { DesempenhoTab, RelatorioTab } from "./components/reportTab";
import { StudiesHeader } from "./components/studiesHeader";
import { DeleteModal, SessionModal } from "./components/studiesModals";
import { StudiesTabs } from "./components/studiesTabs";
import { StudiesHeatmap } from "./heatmap";
import type { StudyGoal, StudySession, TabId } from "./types";
import {
  computeStats,
  computeSubjectMap,
  generateReport,
  isoDate,
  startOfMonth,
  startOfWeek,
} from "./utils";

/**
 * Módulo de Estudos: Gerencia sessões de estudo, metas e análise de performance
 */
export default function StudiesPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("visao-geral");
  const [showForm, setShowForm] = useState(false);
  const [editSession, setEditSession] = useState<StudySession | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState("all");
  const [showSettings, setShowSettings] = useState(false);

  const uid = user ? String(user.id) : "";

  // Carregamento inicial de dados brutos e configurações
  const load = useCallback(async () => {
    if (!uid) return;
    try {
      const results = await Promise.allSettled([
        invoke<StudySession[]>("estudos_list_sessions", {
          userId: uid,
          monthsBack: 5,
        }),
        invoke<StudyGoal[]>("estudos_list_goals", { userId: uid }),
      ]);

      if (results[0].status === "fulfilled") {
        setSessions(results[0].value);
      } else {
        toast.error(`Erro ao carregar sessões.`);
      }

      if (results[1].status === "fulfilled") {
        setGoals(results[1].value);
      }
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (s: StudySession) => {
    try {
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

  const handleGoalSave = async (g: StudyGoal) => {
    try {
      await invoke("estudos_upsert_goal", { goal: g });
      toast.success("Meta salva!");
      await load();
    } catch {
      toast.error("Erro ao salvar meta");
    }
  };

  const handleExportCSV = async () => {
    try {
      const path = await save({
        filters: [{ name: "CSV", extensions: ["csv"] }],
        defaultPath: "meus_estudos.csv",
      });
      if (path) {
        await invoke("estudos_export_csv", { userId: uid, destPath: path });
        toast.success("CSV exportado!");
      }
    } catch {
      toast.error("Erro ao exportar");
    }
  };

  const handleImportCSV = async () => {
    try {
      const path = await openDialog({
        multiple: false,
        filters: [{ name: "CSV", extensions: ["csv"] }],
      });
      if (path && typeof path === "string") {
        const count = await invoke<number>("estudos_import_csv", {
          userId: uid,
          filePath: path,
        });
        toast.success(`${count} sessões importadas!`);
        await load();
      }
    } catch {
      toast.error("Erro ao importar CSV");
    }
  };

  // Cálculo de janelas temporais e estatísticas agregadas
  const now = new Date();
  const weekStart = isoDate(startOfWeek(now));
  const monthStart = isoDate(startOfMonth(now));

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
    (type: string) =>
      goals.find((g) => g.goal_type === type)?.target_value ?? 0,
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
    return Array.from(set).sort();
  }, [sessions]);

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
          (s.note ?? "").toLowerCase().includes(search.toLowerCase());
        const matchMonth =
          filterMonth === "all" || s.date.startsWith(filterMonth);
        return matchSearch && matchMonth;
      }),
    [sessions, search, filterMonth],
  );

  const copyReport = async () => {
    try {
      const text = generateReport({
        weekStats,
        monthStats,
        allStats,
        goalValue,
      });
      await navigator.clipboard.writeText(text);
      toast.success("Relatório copiado!");
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  if (loading)
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-neutral-500 animate-pulse">
          <BookOpen className="w-4 h-4" />
          <span className="font-bold">Sincronizando estudos...</span>
        </div>
      </div>
    );

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 pb-10 animate-in fade-in duration-500 text-white">
      <StudiesHeader
        onImportCSV={handleImportCSV}
        onExportCSV={handleExportCSV}
        onOpenSettings={() => setShowSettings(true)}
        onNewSession={() => {
          setEditSession(undefined);
          setShowForm(true);
        }}
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
      />

      <DeleteModal
        id={deleteConfirm}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />

      <StudiesTabs activeTab={tab} onTabChange={setTab} />

      {/* Renderização condicional das abas */}
      {tab === "visao-geral" && (
        <OverviewTab
          weekStats={weekStats}
          monthStats={monthStats}
          allStats={allStats}
          goalValue={goalValue}
          goalProgress={goalProgress}
          subjectMap={subjectMap}
        />
      )}

      {tab === "historico" && (
        <HistoryTab
          sessions={filteredSessions}
          search={search}
          onSearchChange={setSearch}
          filterMonth={filterMonth}
          onFilterMonthChange={setFilterMonth}
          months={months}
          onEdit={(s) => {
            setEditSession(s);
            setShowForm(true);
          }}
          onDelete={setDeleteConfirm}
        />
      )}

      {tab === "heatmap" && <StudiesHeatmap sessions={sessions} />}

      {tab === "desempenho" && (
        <DesempenhoTab allStats={allStats} subjectMap={subjectMap} />
      )}

      {tab === "relatorio" && (
        <RelatorioTab
          reportText={generateReport({
            weekStats,
            monthStats,
            allStats,
            goalValue,
          })}
          onCopy={copyReport}
          weekStats={weekStats}
          allStats={allStats}
        />
      )}

      {/* Interface flutuante para configurações do módulo */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-neutral-800 flex items-center justify-between sticky top-0 bg-neutral-900 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-violet-600/10 border border-violet-600/20">
                  <Settings className="w-5 h-5 text-violet-400" />
                </div>
                <h2 className="text-xl font-bold">Metas e Preferências</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-neutral-800 rounded-xl transition-colors text-neutral-500 hover:text-white cursor-pointer"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <div className="p-6">
              <MetasTab goals={goals} userId={uid} onSave={handleGoalSave} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
