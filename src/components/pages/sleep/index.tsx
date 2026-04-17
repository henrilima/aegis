"use client";

import { invoke } from "@tauri-apps/api/core";
import { open as openDialog, save } from "@tauri-apps/plugin-dialog";
import { BarChart3, Calendar, Moon, Plus, Settings } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { SleepInfoModal } from "@/components/forms/sleep/SleepInfoModal";
import { SleepEntryModal } from "@/components/forms/sleep/sleepModals";
import { CONFIRM_PRESETS, ConfirmModal } from "@/components/ui/ConfirmModal";
import { useAuth } from "@/context/AuthContext";
import { useTime } from "@/context/TimeContext";
import { SleepChart } from "./components/sleepChart";
import { SleepGoalTab } from "./components/sleepGoalTab";
import { SleepHeader } from "./components/sleepHeader";
import { SleepHistory } from "./components/sleepHistory";
import { SleepStatsBanner } from "./components/sleepStatsBanner";
import { isoDate, rollingRange } from "./sleepUtils";
import type { SleepEntry, SleepGoal } from "./types";

type TabId = "semana" | "historico";

/**
 * Módulo de Sono: Monitoramento de ciclos de descanso, qualidade e metas de repouso
 */
export default function SleepPage() {
  const { user } = useAuth();
  const uid = user ? String(user.id) : "";
  const [entries, setEntries] = useState<SleepEntry[]>([]);
  const [goal, setGoal] = useState<SleepGoal>({
    user_id: "",
    target_hours: 8,
    target_bedtime: "23:00",
    reminder_enabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("semana");
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState<SleepEntry | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [goalHours, setGoalHours] = useState("8");
  const [goalBedtime, setGoalBedtime] = useState("23:00");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Busca registros e metas
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
        setReminderEnabled(g.reminder_enabled);
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
        goal: {
          user_id: uid,
          target_hours: h,
          target_bedtime: goalBedtime,
          reminder_enabled: reminderEnabled,
        },
      });
      toast.success("Novas metas estabelecidas!");
      await loadData();
    } catch {
      toast.error("Falha ao atualizar metas.");
    }
  };

  const handleExportCSV = async () => {
    try {
      const path = await save({
        filters: [{ name: "CSV", extensions: ["csv"] }],
        defaultPath: "meu_sono.csv",
      });
      if (path) {
        await invoke("sono_export_csv", { userId: uid, destPath: path });
        toast.success("CSV exportado com sucesso!");
      }
    } catch {
      toast.error("Erro ao exportar dados do sono.");
    }
  };

  const handleImportCSV = async () => {
    try {
      const path = await openDialog({
        multiple: false,
        filters: [{ name: "CSV", extensions: ["csv"] }],
      });
      if (path && typeof path === "string") {
        const count = await invoke<number>("sono_import_csv", {
          userId: uid,
          filePath: path,
        });
        toast.success(`${count} ciclos de sono importados!`);
        await loadData();
      }
    } catch {
      toast.error("Erro ao importar CSV.");
    }
  };

  // Processamento de métricas
  const { now: simulatedNow } = useTime();
  const { start: weekStart, end: weekEnd } = rollingRange(simulatedNow);

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
    const labels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const startParts = weekStart.split("-").map(Number);
    const startDate = new Date(startParts[0], startParts[1] - 1, startParts[2]);
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const date = isoDate(d);
      days.push({
        date,
        label: labels[d.getDay()],
        entry: weekEntries.find((e) => e.date === date),
      });
    }
    return days;
  }, [weekStart, weekEntries]);

  const TABS = [
    { id: "semana", label: "Visão Semanal", icon: BarChart3 },
    { id: "historico", label: "Relatórios", icon: Calendar },
  ];

  if (loading)
    return (
      <div className="h-full flex items-center justify-center font-bold">
        <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
          <Moon className="w-5 h-5 text-blue-400" />
          <span>Sincronizando ciclos de sono...</span>
        </div>
      </div>
    );

  return (
    <div className="w-full flex flex-col gap-6 pb-12 animate-in fade-in duration-700">
      {/* Cabeçalho */}
      <SleepHeader
        onNew={() => {
          setEditEntry(undefined);
          setShowForm(true);
        }}
        onOpenSettings={() => setShowSettings(true)}
        onOpenInfo={() => setShowInfo(true)}
        onExportCSV={handleExportCSV}
        onImportCSV={handleImportCSV}
      />

      {/* Modais */}
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

      <SleepInfoModal show={showInfo} onClose={() => setShowInfo(false)} />

      {deleteConfirm !== null && (
        <ConfirmModal
          {...CONFIRM_PRESETS.deleteSleep}
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {/* Abas */}
      <div className="flex gap-1 p-1.5 bg-background border border-border/60 rounded-xl w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as TabId)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              tab === t.id
                ? "bg-blue-500/25 text-blue-300 border border-blue-500/40"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
        <div className="">
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

      {/* Configurações */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm ">
          <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-600/10 border border-blue-600/20">
                  <Settings className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-xl font-bold">Objetivos de Sono</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-accent/50 rounded-xl transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <div className="p-6">
              <SleepGoalTab
                goalHours={goalHours}
                setGoalHours={setGoalHours}
                goalBedtime={goalBedtime}
                setGoalBedtime={setGoalBedtime}
                reminderEnabled={reminderEnabled}
                setReminderEnabled={setReminderEnabled}
                onSave={async () => {
                  await handleGoalSave();
                  setShowSettings(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
