"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  BarChart3,
  Calendar,
  Clock,
  Moon,
  Pencil,
  Plus,
  Star,
  Target,
  Trash2,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  EntryForm,
  formatDuration,
  isoDate,
  parseDate,
  qualityColor,
  qualityLabel,
  Stars,
  weekRange,
} from "./entry-form";
import type { SleepEntry, SleepGoal } from "./types";

type TabId = "semana" | "historico" | "metas";

export default function SleepPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<SleepEntry[]>([]);
  const [goal, setGoal] = useState<SleepGoal>({
    user_id: "",
    target_hours: 8,
    target_bedtime: "23:00",
  });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("semana");
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState<SleepEntry | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [goalHours, setGoalHours] = useState("8");
  const [goalBedtime, setGoalBedtime] = useState("23:00");

  const uid = user ? String(user.id) : "";

  const load = useCallback(async () => {
    if (!uid) return;
    try {
      const results = await Promise.allSettled([
        invoke<SleepEntry[]>("sono_list_entries", {
          userId: uid,
          monthsBack: 3,
        }),
        invoke<SleepGoal>("sono_get_goal", { userId: uid }),
      ]);

      if (results[0].status === "fulfilled") {
        setEntries(results[0].value);
      } else {
        console.error("[sono] list_entries error:", results[0].reason);
        toast.error(`Erro ao carregar registros: ${results[0].reason}`);
      }

      if (results[1].status === "fulfilled") {
        const g = results[1].value;
        setGoal(g);
        setGoalHours(String(g.target_hours));
        setGoalBedtime(g.target_bedtime);
      } else {
        console.error("[sono] get_goal error:", results[1].reason);
      }
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (e: SleepEntry) => {
    try {
      await invoke<number>("sono_upsert_entry", { entry: e });
      toast.success(editEntry ? "Atualizado!" : "Sono registrado!");
      setShowForm(false);
      setEditEntry(undefined);
      await load();
    } catch (err) {
      console.error("[sono] upsert_entry error:", err);
      toast.error(`Erro ao salvar: ${err}`);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await invoke("sono_delete_entry", { id, userId: uid });
      toast.success("Registro removido");
      setDeleteConfirm(null);
      await load();
    } catch (err) {
      console.error("[sono] delete error:", err);
      toast.error(`Erro ao remover: ${err}`);
    }
  };

  const handleGoalSave = async () => {
    const h = parseFloat(goalHours);
    if (Number.isNaN(h) || h <= 0) {
      toast.error("Horas inválidas");
      return;
    }
    try {
      await invoke("sono_upsert_goal", {
        goal: { user_id: uid, target_hours: h, target_bedtime: goalBedtime },
      });
      toast.success("Meta salva!");
      await load();
    } catch {
      toast.error("Erro ao salvar meta");
    }
  };

  const { start: weekStart, end: weekEnd } = weekRange();
  const weekEntries = useMemo(
    () => entries.filter((e) => e.date >= weekStart && e.date <= weekEnd),
    [entries, weekStart, weekEnd],
  );

  const weekAvgDuration = useMemo(() => {
    if (!weekEntries.length) return 0;
    return Math.round(
      weekEntries.reduce((a, e) => a + e.duration_minutes, 0) /
        weekEntries.length,
    );
  }, [weekEntries]);

  const weekAvgQuality = useMemo(() => {
    if (!weekEntries.length) return 0;
    return +(
      weekEntries.reduce((a, e) => a + e.quality, 0) / weekEntries.length
    ).toFixed(1);
  }, [weekEntries]);

  const consistency = useMemo(
    () => Math.round((weekEntries.length / 7) * 100),
    [weekEntries],
  );

  const targetMinutes = goal.target_hours * 60;
  const avgVsTarget = weekAvgDuration - targetMinutes;

  const weekDays = useMemo(() => {
    const days: { date: string; label: string; entry?: SleepEntry }[] = [];
    const labels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    const startParts = weekStart.split("-").map(Number);
    const startDate = new Date(startParts[0], startParts[1] - 1, startParts[2]);
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const date = isoDate(d);
      days.push({
        date,
        label: labels[i],
        entry: weekEntries.find((e) => e.date === date),
      });
    }
    return days;
  }, [weekStart, weekEntries]);

  const TABS: { id: TabId; label: string; icon: typeof BarChart3 }[] = [
    { id: "semana", label: "Esta Semana", icon: BarChart3 },
    { id: "historico", label: "Histórico", icon: Calendar },
    { id: "metas", label: "Metas", icon: Target },
  ];

  if (loading)
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-neutral-500 animate-pulse">
          <Moon className="w-4 h-4" /> Carregando...
        </div>
      </div>
    );

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 pb-10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Moon className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-none">Análise de Sono</h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Monitore e otimize seu descanso
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditEntry(undefined);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Registrar Sono
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">
                {editEntry ? "Editar Registro" : "Registrar Sono"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditEntry(undefined);
                }}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <EntryForm
              userId={uid}
              initial={editEntry}
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false);
                setEditEntry(undefined);
              }}
            />
          </div>
        </div>
      )}

      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl text-center">
            <Trash2 className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-1">Remover registro?</h3>
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
                ? "bg-blue-600/20 text-blue-400 border border-blue-600/30"
                : "text-neutral-500 hover:text-neutral-200"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "semana" && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Média de sono",
                value: weekAvgDuration ? formatDuration(weekAvgDuration) : "—",
                icon: Clock,
                sub: `Meta: ${formatDuration(targetMinutes)}`,
                colorClass: "text-blue-400",
              },
              {
                label: "Qualidade média",
                value: weekAvgQuality ? `${weekAvgQuality}/5` : "—",
                icon: Star,
                sub: weekAvgQuality
                  ? qualityLabel(Math.round(weekAvgQuality))
                  : "Sem dados",
                colorClass: "text-yellow-400",
              },
              {
                label: "Consistência",
                value: `${consistency}%`,
                icon: TrendingUp,
                sub: `${weekEntries.length}/7 noites`,
                colorClass: "text-teal-400",
              },
              {
                label: "vs. Meta",
                value:
                  weekAvgDuration === 0
                    ? "—"
                    : `${avgVsTarget > 0 ? "+" : ""}${Math.round(avgVsTarget)}min`,
                icon: Zap,
                sub: avgVsTarget >= 0 ? "acima da meta" : "abaixo da meta",
                colorClass:
                  avgVsTarget >= 0 ? "text-green-400" : "text-red-400",
              },
            ].map((c) => (
              <div
                key={c.label}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase  text-neutral-500">
                    {c.label}
                  </span>
                  <c.icon className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <span
                  className={`text-2xl font-black leading-none ${c.colorClass}`}
                >
                  {c.value}
                </span>
                <span className="text-[10px] text-neutral-600">{c.sub}</span>
              </div>
            ))}
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            <h2 className="text-sm font-black uppercase  text-neutral-400 mb-4">
              Sono por Dia
            </h2>
            <div className="flex items-end gap-2 h-32">
              {weekDays.map(({ label, entry }) => {
                const dur = entry?.duration_minutes ?? 0;
                const maxH = Math.max(
                  targetMinutes * 1.5,
                  ...weekEntries.map((e) => e.duration_minutes),
                  1,
                );
                const pct = (dur / maxH) * 100;
                const targetPct = (targetMinutes / maxH) * 100;
                return (
                  <div
                    key={label}
                    className="flex-1 flex flex-col items-center gap-1 h-full justify-end"
                  >
                    <div
                      className="w-full flex flex-col justify-end relative"
                      style={{ height: "90%" }}
                    >
                      <div
                        className="absolute w-full border-t border-dashed border-blue-500/30"
                        style={{ bottom: `${targetPct}%` }}
                      />
                      {dur > 0 && entry ? (
                        <div
                          className={`w-full rounded-t-lg transition-all ${entry.quality >= 4 ? "bg-blue-500" : entry.quality === 3 ? "bg-blue-400/60" : "bg-blue-300/40"}`}
                          style={{ height: `${pct}%` }}
                          title={`${formatDuration(dur)} · ${qualityLabel(entry.quality)}`}
                        />
                      ) : (
                        <div className="w-full h-1 rounded-full bg-neutral-800" />
                      )}
                    </div>
                    <span className="text-[10px] text-neutral-600 font-bold">
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-4 border-t border-dashed border-blue-500/50" />
              <span className="text-[10px] text-blue-400/60">
                Meta ({formatDuration(targetMinutes)})
              </span>
            </div>
          </div>

          {weekEntries.length > 0 && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
              <h2 className="text-sm font-black uppercase  text-neutral-400 mb-3">
                Registros desta semana
              </h2>
              <div className="flex flex-col gap-2">
                {weekEntries.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center gap-3 py-2 border-b border-neutral-800 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">
                          {parseDate(e.date).toLocaleDateString("pt-BR", {
                            weekday: "short",
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          {e.bedtime} → {e.wake_time}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-blue-400 font-bold">
                          {formatDuration(e.duration_minutes)}
                        </span>
                        <Stars q={e.quality} />
                        {e.note && (
                          <span className="text-[11px] text-neutral-600 truncate">
                            {e.note}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditEntry(e);
                        setShowForm(true);
                      }}
                      className="p-1.5 rounded-lg text-neutral-600 hover:text-blue-400 hover:bg-blue-500/10 transition-all cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "historico" && (
        <div className="flex flex-col gap-3">
          {entries.length === 0 ? (
            <div className="text-center py-16 text-neutral-600">
              <Moon className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum registro de sono ainda</p>
            </div>
          ) : (
            entries.map((e) => (
              <div
                key={e.id}
                className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-4 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-1 self-stretch rounded-full ${e.duration_minutes >= targetMinutes ? "bg-blue-500" : "bg-orange-500"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white">
                        {parseDate(e.date).toLocaleDateString("pt-BR", {
                          weekday: "long",
                          day: "2-digit",
                          month: "long",
                        })}
                      </span>
                      <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                        {formatDuration(e.duration_minutes)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-xs text-neutral-500">
                        {e.bedtime} → {e.wake_time}
                      </span>
                      <Stars q={e.quality} />
                      <span
                        className={`text-xs font-semibold ${qualityColor(e.quality)}`}
                      >
                        {qualityLabel(e.quality)}
                      </span>
                    </div>
                    {e.note && (
                      <p className="text-[11px] text-neutral-500 mt-1.5">
                        {e.note}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditEntry(e);
                        setShowForm(true);
                      }}
                      className="p-1.5 rounded-lg text-neutral-600 hover:text-blue-400 hover:bg-blue-500/10 transition-all cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(e.id ?? null)}
                      className="p-1.5 rounded-lg text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "metas" && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Target className="w-4 h-4 text-blue-400" />
            <h2 className="font-bold text-white">Metas de Sono</h2>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="sg-hours"
                className="text-[10px] font-black uppercase  text-neutral-500"
              >
                Horas por noite (meta)
              </label>
              <input
                id="sg-hours"
                type="number"
                min="1"
                max="14"
                step="0.5"
                className="w-full bg-neutral-800/60 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                value={goalHours}
                onChange={(e) => setGoalHours(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="sg-bedtime"
                className="text-[10px] font-black uppercase  text-neutral-500"
              >
                Horário ideal para dormir
              </label>
              <input
                id="sg-bedtime"
                type="time"
                className="w-full bg-neutral-800/60 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                value={goalBedtime}
                onChange={(e) => setGoalBedtime(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={handleGoalSave}
              className="py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors cursor-pointer"
            >
              Salvar Meta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
