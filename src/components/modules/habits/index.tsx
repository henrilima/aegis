"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  Activity,
  HelpCircle,
  Image as ImageIcon,
  Plus,
  ShieldOff,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ModuleHeader } from "@/components/global/ModuleHeader";
import { HabitsReportsTab } from "@/components/modules/habits/components/HabitsReportsTab";
import { EditHabitDialog } from "@/components/modules/habits/components/modals/editDialog";
import { HabitCreateModal } from "@/components/modules/habits/components/modals/habitCreateModal";
import { LegacyHabitsMigrationModal } from "@/components/modules/habits/components/modals/LegacyHabitsMigrationModal";
import { CardSkeletonGrid } from "@/components/ui/CardSkeletonGrid";
import { CONFIRM_PRESETS, ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { useTime } from "@/context/TimeContext";
import { getModuleColor } from "@/modules.config";
import { HabitsGuidePanel } from "./components/HabitsInfoModal";
import { HabitsWeeklyBoard } from "./components/weeklyBoard";
import { HabitCard } from "./habitCard";
import type { Habit } from "./types";

type TabId = "positive" | "negative" | "report" | "guia";

/**
 * Módulo de Hábitos: Monitoramento de comportamentos positivos e controle de vícios
 */
export default function HabitsPage() {
  const { user } = useAuth();
  const { now: simulatedNow } = useTime();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("positive");

  const [createOpen, setCreateOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [resetId, setResetId] = useState<number | null>(null);
  const [hardResetId, setHardResetId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [migrationOpen, setMigrationOpen] = useState(false);

  const uid = user ? String(user.id) : "";

  // Busca lista de hábitos do usuário
  const fetchHabits = useCallback(async () => {
    if (!uid) return;
    try {
      const res = await invoke<Habit[]>("habit_list_habits", { userId: uid });
      setHabits(res);
    } catch {
      toast.error("Erro ao sincronizar hábitos");
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  // Abre o modal de migração se houver hábitos de versões anteriores com formato incompatível
  useEffect(() => {
    if (habits.length > 0) {
      const hasLegacy = habits.some(
        (h) =>
          h.habitType !== "Positive" &&
          h.habitType !== "Negative" &&
          h.habitType !== "Bad",
      );
      if (hasLegacy) {
        setMigrationOpen(true);
      }
    }
  }, [habits]);

  const handleAdd = async (
    name: string,
    cooldown: number,
    type: "Positive" | "Negative",
    chargesAmount: number,
    chargesInterval: number,
    goalDays: number,
    frequency?: "daily" | "weekdays",
    weekdays?: string,
  ) => {
    if (!uid || isAdding) return;
    setIsAdding(true);
    const now = simulatedNow.toISOString();
    try {
      await invoke("habit_add_habit", {
        habit: {
          userId: uid,
          name,
          habitType: type,
          lastSlip: now,
          createdAt: now,
          maxStreak: 0,
          cooldownDays: Math.max(1, cooldown),
          lastDone: null,
          chargesUsed: 0,
          chargesAmount: chargesAmount,
          chargesIntervalDays: chargesInterval,
          accumulates: false,
          lastChargeRefill: now,
          currentCharges: chargesAmount,
          currentStreak: 0,
          goalDays: goalDays > 0 ? goalDays : 0,
          frequency: frequency || "daily",
          weekdays: weekdays || null,
        },
      });
      fetchHabits();
      setCreateOpen(false);
      toast.success("Novo hábito rastreado!");
    } catch (e) {
      toast.error(`Não foi possível salvar o hábito: ${e}`);
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingHabit) return;
    try {
      await invoke("habit_update_habit", {
        habit: {
          ...editingHabit,
          cooldownDays: Math.max(1, editingHabit.cooldownDays),
        },
      });
      setEditingHabit(null);
      fetchHabits();
      toast.success("Hábito atualizado");
    } catch {
      toast.error("Erro na atualização");
    }
  };

  const confirmReset = async () => {
    if (!resetId) return;
    try {
      await invoke("habit_reset_habit", {
        id: resetId,
        timestamp: simulatedNow.toISOString(),
      });
      setResetId(null);
      fetchHabits();
      toast.error("Reiniciado! Começando de novo...");
    } catch {
      toast.error("Erro ao reiniciar");
    }
  };

  const confirmHardReset = async () => {
    if (!hardResetId) return;
    try {
      await invoke("habit_hard_reset_habit", {
        id: hardResetId,
        timestamp: simulatedNow.toISOString(),
      });
      setHardResetId(null);
      fetchHabits();
      toast.info("Dados limpos com sucesso.");
    } catch {
      toast.error("Erro ao limpar dados");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await invoke("habit_delete_habit", { id: deleteId });
      setDeleteId(null);
      fetchHabits();
      toast.success("Hábito removido da lista");
    } catch {
      toast.error("Erro ao excluir");
    }
  };

  // Filtragem de listas
  const positive = habits.filter((h) => h.habitType === "Positive");
  const negative = habits.filter(
    (h) => (h.habitType === "Negative" || h.habitType === "Bad") && !h.archived,
  );
  const legacyHabits = habits.filter(
    (h) =>
      h.habitType !== "Positive" &&
      h.habitType !== "Negative" &&
      h.habitType !== "Bad",
  );

  if (loading)
    return (
      <div className="w-full flex flex-col gap-6 px-1">
        <CardSkeletonGrid count={6} />
      </div>
    );

  const _currentList = tab === "positive" ? positive : negative;

  const HABIT_TABS = [
    { id: "positive", label: "Hábitos Diários", icon: Zap },
    { id: "negative", label: "Controle de Vício", icon: ShieldOff },
    { id: "report", label: "Relatório", icon: ImageIcon },
    { id: "guia", label: "Guia", icon: HelpCircle },
  ];

  return (
    <div className="w-full h-full flex flex-col gap-6 overflow-auto pb-12 text-foreground">
      <ModuleHeader
        color={getModuleColor("habits")}
        title="Hábitos & Disciplina"
        subtitle={`${habits.filter((h) => !h.archived).length} ativos · ${positive.filter((h) => !h.archived).length} hábitos · ${negative.filter((h) => !h.archived).length} vícios`}
        icon={Activity}
        tabs={HABIT_TABS}
        activeTab={tab}
        onTabChange={(id) => setTab(id as TabId)}
        actions={[
          {
            id: "add",
            label: "Novo Hábito",
            icon: Plus,
            tooltip: "Adicionar novo hábito",
            primary: true,
            onClick: () => setCreateOpen(true),
          },
        ]}
      />

      {/* Listagem / Relatório */}
      {tab === "guia" ? (
        <HabitsGuidePanel />
      ) : tab === "report" ? (
        <HabitsReportsTab habits={habits} />
      ) : tab === "positive" ? (
        <HabitsWeeklyBoard
          habits={positive}
          onRefresh={fetchHabits}
          onEdit={setEditingHabit}
          onOpenHardResetDialog={setHardResetId}
          onDelete={setDeleteId}
        />
      ) : negative.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="Nenhum vício rastreado"
          description="Cadastre um controle de vício (controle de danos) para monitorar sua sobriedade."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {negative.map((h, i) => (
            <div
              key={h.id}
              className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <HabitCard
                habit={h}
                onRefresh={fetchHabits}
                onEdit={setEditingHabit}
                onOpenResetDialog={setResetId}
                onOpenHardResetDialog={setHardResetId}
                onDelete={setDeleteId}
              />
            </div>
          ))}
        </div>
      )}

      {/* Modais */}
      {createOpen && (
        <HabitCreateModal
          onAdd={handleAdd}
          onClose={() => setCreateOpen(false)}
        />
      )}

      {editingHabit && (
        <EditHabitDialog
          habit={editingHabit}
          setHabit={setEditingHabit}
          onUpdate={handleUpdate}
        />
      )}

      {/* Confirmações */}
      {resetId !== null && (
        <ConfirmModal
          {...CONFIRM_PRESETS.resetStreak}
          onConfirm={confirmReset}
          onCancel={() => setResetId(null)}
        />
      )}
      {hardResetId !== null && (
        <ConfirmModal
          {...CONFIRM_PRESETS.hardReset}
          onConfirm={confirmHardReset}
          onCancel={() => setHardResetId(null)}
        />
      )}
      {deleteId !== null && (
        <ConfirmModal
          {...CONFIRM_PRESETS.deleteHabit}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {migrationOpen && legacyHabits.length > 0 && (
        <LegacyHabitsMigrationModal
          legacyHabits={legacyHabits}
          onClose={() => setMigrationOpen(false)}
          onRefresh={fetchHabits}
        />
      )}
    </div>
  );
}
