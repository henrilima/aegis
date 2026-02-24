"use client";

import { invoke } from "@tauri-apps/api/core";
import { open as openDialog, save } from "@tauri-apps/plugin-dialog";
import {
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronDown,
  Clock,
  Copy,
  Download,
  Flame,
  Pencil,
  Plus,
  Search,
  Target,
  Trash2,
  TrendingUp,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { GOAL_LABELS, GoalPanel } from "./goal-panel";
import {
  formatHours,
  hitRate,
  isoDate,
  parseDate,
  SessionForm,
  startOfMonth,
  startOfWeek,
} from "./session-form";
import type { StudyGoal, StudySession } from "./types";

type TabId = "visao-geral" | "historico" | "metas" | "relatorio";

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

  const uid = user ? String(user.id) : "";

  const load = useCallback(async () => {
    if (!uid) return;
    try {
      const results = await Promise.allSettled([
        invoke<StudySession[]>("estudos_list_sessions", {
          userId: uid,
          monthsBack: 3,
        }),
        invoke<StudyGoal[]>("estudos_list_goals", { userId: uid }),
      ]);

      if (results[0].status === "fulfilled") {
        setSessions(results[0].value);
      } else {
        console.error("[estudos] list_sessions error:", results[0].reason);
        toast.error(`Erro ao carregar sessões: ${results[0].reason}`);
      }

      if (results[1].status === "fulfilled") {
        setGoals(results[1].value);
      } else {
        console.error("[estudos] list_goals error:", results[1].reason);
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
      console.error("[estudos] save error:", err);
      toast.error(`Erro ao salvar sessão: ${err}`);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await invoke("estudos_delete_session", { id, userId: uid });
      toast.success("Sessão removida");
      setDeleteConfirm(null);
      await load();
    } catch (err) {
      console.error("[estudos] delete error:", err);
      toast.error(`Erro ao remover: ${err}`);
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
        toast.success("CSV exportado com sucesso!");
      }
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
      toast.error("Erro ao importar CSV");
    }
  };

  const now = new Date();
  const weekStart = isoDate(startOfWeek(now));
  const monthStart = isoDate(startOfMonth(now));

  const computeStats = useCallback(
    (arr: StudySession[]) => ({
      hours: arr.reduce((a, s) => a + s.hours, 0),
      questions: arr.reduce(
        (a, s) => a + s.questions_new + s.questions_review,
        0,
      ),
      questionsNew: arr.reduce((a, s) => a + s.questions_new, 0),
      correctNew: arr.reduce((a, s) => a + s.correct_new, 0),
      questionsReview: arr.reduce((a, s) => a + s.questions_review, 0),
      correctReview: arr.reduce((a, s) => a + s.correct_review, 0),
    }),
    [],
  );

  const weekSessions = useMemo(
    () => sessions.filter((s) => s.date >= weekStart),
    [sessions, weekStart],
  );
  const monthSessions = useMemo(
    () => sessions.filter((s) => s.date >= monthStart),
    [sessions, monthStart],
  );

  const weekStats = useMemo(
    () => computeStats(weekSessions),
    [weekSessions, computeStats],
  );
  const monthStats = useMemo(
    () => computeStats(monthSessions),
    [monthSessions, computeStats],
  );
  const allStats = useMemo(
    () => computeStats(sessions),
    [sessions, computeStats],
  );

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

  const subjectMap = useMemo(() => {
    const m: Record<
      string,
      { hours: number; qNew: number; cNew: number; qRev: number; cRev: number }
    > = {};
    for (const s of sessions) {
      if (!m[s.subject])
        m[s.subject] = { hours: 0, qNew: 0, cNew: 0, qRev: 0, cRev: 0 };
      m[s.subject].hours += s.hours;
      m[s.subject].qNew += s.questions_new;
      m[s.subject].cNew += s.correct_new;
      m[s.subject].qRev += s.questions_review;
      m[s.subject].cRev += s.correct_review;
    }
    return m;
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

  const generateReport = useCallback(() => {
    const lines = [
      `📊 RELATÓRIO DE ESTUDOS — ${new Date().toLocaleDateString("pt-BR")}`,
      ``,
      `📅 SEMANA ATUAL`,
      `  ⏱ Horas: ${formatHours(weekStats.hours)} / ${goalValue("weekly_hours") ? formatHours(goalValue("weekly_hours")) : "—"}`,
      `  📝 Questões: ${weekStats.questions} / ${goalValue("weekly_questions") || "—"}`,
      `  ✅ Acerto Inéditas: ${hitRate(weekStats.correctNew, weekStats.questionsNew)}%`,
      `  🔄 Acerto Refeitas: ${hitRate(weekStats.correctReview, weekStats.questionsReview)}%`,
      ``,
      `📆 MÊS ATUAL`,
      `  ⏱ Horas: ${formatHours(monthStats.hours)} / ${goalValue("monthly_hours") ? formatHours(goalValue("monthly_hours")) : "—"}`,
      `  📝 Questões: ${monthStats.questions} / ${goalValue("monthly_questions") || "—"}`,
    ];
    return lines.join("\n");
  }, [weekStats, monthStats, goalValue]);

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(generateReport());
      toast.success("Relatório copiado!");
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const TABS: { id: TabId; label: string; icon: typeof BarChart3 }[] = [
    { id: "visao-geral", label: "Visão Geral", icon: BarChart3 },
    { id: "historico", label: "Histórico", icon: Calendar },
    { id: "metas", label: "Metas", icon: Target },
    { id: "relatorio", label: "Relatório", icon: Copy },
  ];

  if (loading)
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-neutral-500 animate-pulse">
          <BookOpen className="w-4 h-4" /> Carregando...
        </div>
      </div>
    );

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 pb-10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <BookOpen className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-none">
              Estudos &amp; Desempenho
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Centro de comando acadêmico
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-violet-400 border border-neutral-700 transition-all cursor-pointer text-xs font-bold"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
          <button
            type="button"
            onClick={handleImportCSV}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-violet-400 border border-neutral-700 transition-all cursor-pointer text-xs font-bold"
          >
            <Upload className="w-4 h-4" />
            Importar
          </button>
          <button
            type="button"
            onClick={() => {
              setEditSession(undefined);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Nova Sessão
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">
                {editSession ? "Editar Sessão" : "Nova Sessão de Estudo"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditSession(undefined);
                }}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <SessionForm
              userId={uid}
              initial={editSession}
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false);
                setEditSession(undefined);
              }}
            />
          </div>
        </div>
      )}

      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl text-center">
            <Trash2 className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-1">Remover sessão?</h3>
            <p className="text-sm text-neutral-500 mb-5">
              Essa ação é irreversível.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  void handleDelete(deleteConfirm);
                }}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-colors cursor-pointer"
              >
                Remover
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 text-sm font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
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
                ? "bg-violet-600/20 text-violet-400 border border-violet-600/30"
                : "text-neutral-500 hover:text-neutral-200"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "visao-geral" && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Horas esta semana",
                value: formatHours(weekStats.hours),
                icon: Clock,
                sub: `Meta: ${goalValue("weekly_hours") ? formatHours(goalValue("weekly_hours")) : "—"}`,
                progress: goalProgress(weekStats.hours, "weekly_hours"),
              },
              {
                label: "Questões esta semana",
                value: weekStats.questions,
                icon: CheckCircle,
                sub: `Meta: ${goalValue("weekly_questions") || "—"}`,
                progress: goalProgress(weekStats.questions, "weekly_questions"),
              },
              {
                label: "Acerto (inéditas)",
                value: `${hitRate(allStats.correctNew, allStats.questionsNew)}%`,
                icon: TrendingUp,
                sub: `${allStats.correctNew}/${allStats.questionsNew} certas`,
                progress: hitRate(allStats.correctNew, allStats.questionsNew),
              },
              {
                label: "Acerto (refeitas)",
                value: `${hitRate(allStats.correctReview, allStats.questionsReview)}%`,
                icon: Flame,
                sub: `${allStats.correctReview}/${allStats.questionsReview} certas`,
                progress: hitRate(
                  allStats.correctReview,
                  allStats.questionsReview,
                ),
              },
            ].map((c) => (
              <div
                key={c.label}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase  text-neutral-500">
                    {c.label}
                  </span>
                  <c.icon className="w-3.5 h-3.5 text-violet-500" />
                </div>
                <span className="text-2xl font-black text-white leading-none">
                  {c.value}
                </span>
                <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-500 rounded-full transition-all"
                    style={{ width: `${c.progress}%` }}
                  />
                </div>
                <span className="text-[10px] text-neutral-600">{c.sub}</span>
              </div>
            ))}
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            <h2 className="text-sm font-black uppercase  text-neutral-400 mb-4">
              Progresso das Metas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  type: "weekly_hours",
                  current: weekStats.hours,
                  fmt: (v: number) => formatHours(v),
                },
                {
                  type: "monthly_hours",
                  current: monthStats.hours,
                  fmt: (v: number) => formatHours(v),
                },
                {
                  type: "weekly_questions",
                  current: weekStats.questions,
                  fmt: (v: number) => String(v),
                },
                {
                  type: "monthly_questions",
                  current: monthStats.questions,
                  fmt: (v: number) => String(v),
                },
              ].map(({ type, current, fmt }) => {
                const target = goalValue(type);
                const pct = target
                  ? Math.min(100, Math.round((current / target) * 100))
                  : 0;
                return (
                  <div key={type} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-400">
                        {GOAL_LABELS[type]}
                      </span>
                      <span className="text-xs font-bold text-violet-400">
                        {fmt(current)} / {target ? fmt(target) : "—"}
                      </span>
                    </div>
                    <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-green-500" : "bg-violet-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-neutral-600">
                      {target ? `${pct}% concluído` : "Meta não definida"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            <h2 className="text-sm font-black uppercase  text-neutral-400 mb-4">
              Desempenho por Matéria (3 meses)
            </h2>
            {Object.keys(subjectMap).length === 0 ? (
              <p className="text-sm text-neutral-600 text-center py-6">
                Nenhuma sessão registrada ainda.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {Object.entries(subjectMap)
                  .sort((a, b) => b[1].hours - a[1].hours)
                  .map(([subj, d]) => {
                    const totalQ = d.qNew + d.qRev;
                    const totalC = d.cNew + d.cRev;
                    const rate = hitRate(totalC, totalQ);
                    return (
                      <div
                        key={subj}
                        className="flex items-center gap-4 py-2 border-b border-neutral-800 last:border-0"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-white truncate block">
                            {subj}
                          </span>
                          <span className="text-[11px] text-neutral-500">
                            {formatHours(d.hours)} · {totalQ} questões
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span
                            className={`text-sm font-black ${rate >= 70 ? "text-green-400" : rate >= 50 ? "text-yellow-400" : "text-red-400"}`}
                          >
                            {rate}%
                          </span>
                          <p className="text-[10px] text-neutral-600">acerto</p>
                        </div>
                        <div className="w-16">
                          <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${rate >= 70 ? "bg-green-500" : rate >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "historico" && (
        <div className="flex flex-col gap-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600" />
              <input
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-violet-500 transition-colors"
                placeholder="Buscar por matéria, data ou anotação..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="relative">
              <select
                className="appearance-none bg-neutral-900 border border-neutral-800 rounded-xl pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors cursor-pointer"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              >
                <option value="all">Todos os meses</option>
                {months.map((m) => (
                  <option key={m} value={m}>
                    {new Date(`${m}-01`).toLocaleDateString("pt-BR", {
                      month: "long",
                      year: "numeric",
                    })}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600 pointer-events-none" />
            </div>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="text-center py-16 text-neutral-600">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma sessão encontrada</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredSessions.map((s) => {
                const totalQ = s.questions_new + s.questions_review;
                const totalC = s.correct_new + s.correct_review;
                return (
                  <div
                    key={s.id}
                    className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-4 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-white">
                            {s.subject}
                          </span>
                          <span className="text-[10px] font-black uppercase  text-violet-500 bg-violet-500/10 px-2 py-0.5 rounded-full">
                            {parseDate(s.date).toLocaleDateString("pt-BR", {
                              weekday: "short",
                              day: "2-digit",
                              month: "short",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                          <span className="text-xs text-neutral-500">
                            <Clock className="inline w-3 h-3 mr-1" />
                            {formatHours(s.hours)}
                          </span>
                          {totalQ > 0 && (
                            <>
                              <span className="text-xs text-neutral-500">
                                {totalQ} questões
                              </span>
                              <span
                                className={`text-xs font-bold ${hitRate(totalC, totalQ) >= 70 ? "text-green-400" : hitRate(totalC, totalQ) >= 50 ? "text-yellow-400" : "text-red-400"}`}
                              >
                                {hitRate(totalC, totalQ)}% acerto
                              </span>
                            </>
                          )}
                        </div>
                        {s.note && (
                          <p className="text-[11px] text-neutral-500 mt-1.5 line-clamp-2">
                            {s.note}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditSession(s);
                            setShowForm(true);
                          }}
                          className="p-1.5 rounded-lg text-neutral-600 hover:text-violet-400 hover:bg-violet-500/10 transition-all cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(s.id ?? null)}
                          className="p-1.5 rounded-lg text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "metas" && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Target className="w-4 h-4 text-violet-400" />
            <h2 className="font-bold text-white">Definir Metas</h2>
          </div>
          <GoalPanel goals={goals} userId={uid} onSave={handleGoalSave} />
        </div>
      )}

      {tab === "relatorio" && (
        <div className="flex flex-col gap-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white">Relatório de Desempenho</h2>
              <button
                type="button"
                onClick={copyReport}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" /> Copiar
              </button>
            </div>
            <pre className="text-xs text-neutral-400 font-mono whitespace-pre-wrap bg-neutral-950 border border-neutral-800 rounded-xl p-4 leading-relaxed">
              {generateReport()}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
