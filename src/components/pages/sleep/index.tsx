"use client";

import { invoke } from "@tauri-apps/api/core";
import { BarChart3, Calendar, Moon, Target } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { SleepChart } from "./components/sleepChart";
import { SleepGoalTab } from "./components/sleepGoalTab";

import { SleepHeader } from "./components/sleepHeader";
import { SleepHistory } from "./components/sleepHistory";
import { SleepStatsBanner } from "./components/sleepStatsBanner";
import { DeleteSleepModal, SleepEntryModal } from "./modal/sleepModals";
import { isoDate, weekRange } from "./sleepUtils";
import type { SleepEntry, SleepGoal } from "./types";

type TabId = "semana" | "historico" | "metas";

/**
 * Módulo de Sono: Monitoramento de ciclos de descanso, qualidade e metas de repouso
 */
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

  // Carrega sincronizadamente os registros e as metas do usuário
  const loadData = useCallback(async () => {
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
        toast.error("Erro ao sincronizar histórico de sono.");
      }

      if (results[1].status === "fulfilled") {
        const g = results[1].value;
        setGoal(g);
        setGoalHours(String(g.target_hours));
        setGoalBedtime(g.target_bedtime);
      }
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (e: SleepEntry) => {
    try {
      await invoke<number>("sono_upsert_entry", { entry: e });
      toast.success(
        editEntry ? "Dados atualizados!" : "Ciclo registrado com sucesso!",
      );
      setShowForm(false);
      setEditEntry(undefined);
      await loadData();
    } catch {
      toast.error("Falha ao salvar registro de sono.");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await invoke("sono_delete_entry", { id, userId: uid });
      toast.success("Registro removido");
      setDeleteConfirm(null);
      await loadData();
    } catch {
      toast.error("Erro ao excluir registro.");
    }
  };

  const handleGoalSave = async () => {
    const h = parseFloat(goalHours);
    if (Number.isNaN(h) || h <= 0) {
      toast.error("Defina um valor de horas válido.");
      return;
    }
    try {
      await invoke("sono_upsert_goal", {
        goal: { user_id: uid, target_hours: h, target_bedtime: goalBedtime },
      });
      toast.success("Novas metas estabelecidas!");
      await loadData();
    } catch {
      toast.error("Falha ao atualizar metas.");
    }
  };

  // ─── Processamento de Métricas ───────────────────────────────────────────

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

  const targetMinutes = (goal.target_hours || 8) * 60;
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

  const TABS = [
    { id: "semana", label: "Visão Semanal", icon: BarChart3 },
    { id: "historico", label: "Relatórios", icon: Calendar },
    { id: "metas", label: "Objetivos", icon: Target },
  ];

  if (loading)
    return (
      <div className="h-full flex items-center justify-center font-bold">
        <div className="flex items-center gap-2 text-neutral-500 animate-pulse">
          <Moon className="w-5 h-5 text-blue-400" />
          <span>Sincronizando ciclos de sono...</span>
        </div>
      </div>
    );

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 pb-12 animate-in fade-in duration-700 text-white">
      {/* Cabeçalho de Ações Primárias */}
      <SleepHeader
        onNew={() => {
          setEditEntry(undefined);
          setShowForm(true);
        }}
      />

      {/* Camada de Modais */}
      <SleepEntryModal
        show={showForm}
        userId={uid}
        editEntry={editEntry}
        onSave={handleSave}
        onClose={() => {
          setShowForm(false);
          setEditEntry(undefined);
        }}
      />

      <DeleteSleepModal
        id={deleteConfirm}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* Navegação entre Visões */}
      <div className="flex gap-1 p-1.5 bg-neutral-950 border border-neutral-700/60 rounded-2xl w-fit shadow-lg shadow-black/30">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as TabId)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              tab === t.id
                ? "bg-blue-500/25 text-blue-300 border border-blue-500/40 shadow-sm shadow-blue-500/10"
                : "text-neutral-500 hover:text-neutral-200 hover:bg-white/5"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "semana" && (
        <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-2 duration-500">
          <SleepStatsBanner
            weekAvgDuration={weekAvgDuration}
            targetMinutes={targetMinutes}
            weekAvgQuality={weekAvgQuality}
            consistency={consistency}
            avgVsTarget={avgVsTarget}
          />

          <SleepChart weekDays={weekDays} targetMinutes={targetMinutes} />

          <SleepHistory
            title="Detalhamento da Semana"
            entries={weekEntries}
            targetMinutes={targetMinutes}
            onEdit={(e) => {
              setEditEntry(e);
              setShowForm(true);
            }}
            onDelete={(id) => setDeleteConfirm(id)}
          />
        </div>
      )}

      {tab === "historico" && (
        <div className="animate-in fade-in duration-500">
          <SleepHistory
            entries={entries}
            targetMinutes={targetMinutes}
            onEdit={(e) => {
              setEditEntry(e);
              setShowForm(true);
            }}
            onDelete={(id) => setDeleteConfirm(id)}
          />
        </div>
      )}

      {tab === "metas" && (
        <div className="animate-in zoom-in-95 duration-500">
          <SleepGoalTab
            goalHours={goalHours}
            setGoalHours={setGoalHours}
            goalBedtime={goalBedtime}
            setGoalBedtime={setGoalBedtime}
            onSave={handleGoalSave}
          />
        </div>
      )}
    </div>
  );
}
