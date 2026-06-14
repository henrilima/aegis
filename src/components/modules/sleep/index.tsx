"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  BarChart3,
  Calendar,
  HelpCircle,
  Moon,
  Plus,
  Settings,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ModuleHeader } from "@/components/global/ModuleHeader";
import { SleepGuidePanel } from "@/components/modules/sleep/components/modals/SleepInfoModal";
import { SleepEntryModal } from "@/components/modules/sleep/components/modals/sleepModals";
import { CONFIRM_PRESETS, ConfirmModal } from "@/components/ui/ConfirmModal";
import { useAuth } from "@/context/AuthContext";
import { useTime } from "@/context/TimeContext";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { AppConfig } from "../settings/useSettingsLogic";
import { SleepChart } from "./components/sleepChart";
import { SleepGoalTab } from "./components/sleepGoalTab";
import { SleepHistory } from "./components/sleepHistory";
import { SleepStatsBanner } from "./components/sleepStatsBanner";
import { isoDate, rollingRange } from "./sleepUtils";
import type { SleepEntry, SleepGoal } from "./types";

type TabId = "semana" | "historico" | "guia";

/**
 * Módulo de Sono: Monitoramento de ciclos de descanso, qualidade e metas de repouso
 */
export default function SleepPage() {
  const { user } = useAuth();
  const uid = user ? String(user.id) : "";
  const color = getModuleColor("sleep");
  const theme = getColorTheme(color);
  const [entries, setEntries] = useState<SleepEntry[]>([]);
  const [goal, setGoal] = useState<SleepGoal>({
    userId: "",
    targetHours: 8,
    targetBedtime: "23:00",
    reminderEnabled: false,
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

  // Busca registros, metas e configuração de notificação
  const loadData = useCallback(async () => {
    if (!uid) return;
    try {
      const results = await Promise.allSettled([
        invoke<SleepEntry[]>("sono_list_entries", {
          userId: uid,
          monthsBack: 3,
        }),
        invoke<SleepGoal>("sono_get_goal", { userId: uid }),
        invoke<AppConfig>("global_get_app_config"),
      ]);

      if (results[0].status === "fulfilled") {
        setEntries(results[0].value);
      } else {
        toast.error("Erro ao sincronizar histórico de sono.");
      }

      if (results[1].status === "fulfilled") {
        const g = results[1].value;
        setGoal(g);
        setGoalHours(String(g.targetHours));

        // Preferência para a config global se disponível
        if (results[2].status === "fulfilled") {
          const cfg = results[2].value;
          setGoalBedtime(cfg.notifSleepBedtimeTime);
          setReminderEnabled(cfg.notifSleepBedtime);
        } else {
          setGoalBedtime(g.targetBedtime);
          setReminderEnabled(g.reminderEnabled);
        }
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
          userId: uid,
          targetHours: h,
          targetBedtime: goalBedtime,
          reminderEnabled: reminderEnabled,
        },
      });

      // Sincroniza com a configuração global de notificações
      try {
        const currentConfig = await invoke<AppConfig>("global_get_app_config");
        const newConfig: AppConfig = {
          ...currentConfig,
          notifSleepBedtime: reminderEnabled,
          notifSleepBedtimeTime: goalBedtime,
        };
        await invoke("global_set_app_config", { config: newConfig });
      } catch (e) {
        console.error("Erro ao sincronizar config global de sono:", e);
      }

      toast.success("Novas metas estabelecidas!");
      await loadData();
    } catch {
      toast.error("Falha ao atualizar metas.");
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
      weekEntries.reduce((a, e) => a + e.durationMinutes, 0) /
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

  const targetMinutes = (goal.targetHours || 8) * 60;
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

  const SLEEP_TABS = [
    { id: "semana", label: "Visão Semanal", icon: BarChart3 },
    { id: "historico", label: "Relatórios", icon: Calendar },
    { id: "guia", label: "Guia", icon: HelpCircle },
  ];

  if (loading)
    return (
      <div className="h-full flex items-center justify-center font-bold">
        <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
          <Moon className="w-5 h-5" />
          <span>Sincronizando ciclos de sono...</span>
        </div>
      </div>
    );

  return (
    <div className="w-full flex flex-col gap-6 pb-12 animate-in fade-in duration-700">
      <ModuleHeader
        color={getModuleColor("sleep")}
        title="Análise de Sono"
        subtitle="Monitore e otimize seu descanso"
        icon={Moon}
        tabs={SLEEP_TABS}
        activeTab={tab}
        onTabChange={(id) => setTab(id as TabId)}
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
            label: "Registrar Sono",
            icon: Plus,
            tooltip: "Novo registro de sono",
            primary: true,
            onClick: () => {
              setEditEntry(undefined);
              setShowForm(true);
            },
          },
        ]}
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

      {deleteConfirm !== null && (
        <ConfirmModal
          {...CONFIRM_PRESETS.deleteSleep}
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

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

      {tab === "guia" && <SleepGuidePanel />}

      {/* Configurações e Metas */}
      {showSettings && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card/90 backdrop-blur-xl border border-border/60 rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-border/50 flex items-center justify-between bg-card/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-2xl bg-muted/50", theme.text)}>
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground">
                    Metas de Descanso
                  </h2>
                  <p className="text-xs text-muted-foreground font-medium">
                    Configure seus ciclos de sono e alertas
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
                <SleepGoalTab
                  goalHours={goalHours}
                  setGoalHours={setGoalHours}
                  goalBedtime={goalBedtime}
                  setGoalBedtime={setGoalBedtime}
                  reminderEnabled={reminderEnabled}
                  setReminderEnabled={setReminderEnabled}
                  onSave={handleGoalSave}
                />
              </div>
            </div>
            <div className="p-8 border-t border-border/50 shrink-0 bg-card/50">
              <button
                type="button"
                onClick={async () => {
                  await handleGoalSave();
                  setShowSettings(false);
                }}
                className={cn(
                  "w-full p-4 rounded-2xl text-xs font-bold text-white transition-all active:scale-[0.98] cursor-pointer",
                  theme.solid,
                  theme.solidHover,
                )}
              >
                Salvar metas de descanso
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
