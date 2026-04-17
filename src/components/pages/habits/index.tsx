"use client";

import { invoke } from "@tauri-apps/api/core";
import { Activity, LayoutGrid, Plus, ShieldOff, Zap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { EditHabitDialog } from "@/components/forms/habits/editDialog";
import { HabitCreateModal } from "@/components/forms/habits/habitCreateModal";
import { CONFIRM_PRESETS, ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { useTime } from "@/context/TimeContext";
import { cn } from "@/lib/utils";
import { HabitCard } from "./habitCard";
import type { Habit } from "./types";

type TabId = "all" | "positive" | "negative";

/**
 * Módulo de Hábitos: Monitoramento de comportamentos positivos e controle de vícios
 */
export default function HabitsPage() {
  const { user } = useAuth();
  const { now: simulatedNow } = useTime();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [resetId, setResetId] = useState<number | null>(null);
  const [hardResetId, setHardResetId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const uid = user ? String(user.id) : "";

  // Busca lista de hábitos do usuário
  const fetchHabits = useCallback(async () => {
    if (!uid) return;
    try {
      const res = await invoke<Habit[]>("list_habits", { userId: uid });
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

  const handleAdd = async (
    name: string,
    cooldown: number,
    type: "Positive" | "Negative",
    chargesAmount: number,
    chargesInterval: number,
  ) => {
    if (!uid) return;
    const now = simulatedNow.toISOString();
    try {
      await invoke("add_habit", {
        habit: {
          user_id: uid,
          name,
          habit_type: type,
          last_slip: now,
          created_at: now,
          max_streak: 0,
          cooldown_days: Math.max(1, cooldown),
          last_done: null,
          charges_used: 0,
          charges_amount: chargesAmount,
          charges_interval_days: chargesInterval,
          accumulates: false,
          last_charge_refill: now,
          current_charges: chargesAmount,
          current_streak: 0,
        },
      });
      fetchHabits();
      setCreateOpen(false);
      toast.success("Novo hábito rastreado!");
    } catch {
      toast.error("Não foi possível salvar o hábito");
    }
  };

  const handleUpdate = async () => {
    if (!editingHabit) return;
    try {
      await invoke("update_habit", {
        habit: {
          ...editingHabit,
          cooldown_days: Math.max(1, editingHabit.cooldown_days),
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
      await invoke("reset_habit", {
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
      await invoke("hard_reset_habit", {
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
      await invoke("delete_habit", { id: deleteId });
      setDeleteId(null);
      fetchHabits();
      toast.success("Hábito removido da lista");
    } catch {
      toast.error("Erro ao excluir");
    }
  };

  // Filtragem de listas
  const positive = habits.filter((h) => h.habit_type === "Positive");
  const negative = habits.filter(
    (h) => h.habit_type === "Negative" || h.habit_type === "Bad",
  );

  if (loading)
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground animate-pulse font-bold">
          <Activity className="w-4 h-4" /> Sincronizando hábitos...
        </div>
      </div>
    );

  const TABS = [
    {
      id: "all" as const,
      label: "Todos",
      icon: LayoutGrid,
      count: habits.length,
      color: "teal",
    },
    {
      id: "positive" as const,
      label: "Foco",
      icon: Zap,
      count: positive.length,
      color: "teal",
    },
    {
      id: "negative" as const,
      label: "Controle",
      icon: ShieldOff,
      count: negative.length,
      color: "red",
    },
  ];

  const sortedHabits = [...habits].sort((a, b) => {
    const priority: Record<string, number> = {
      Positive: 0,
      Negative: 1,
      Bad: 1,
    };
    return (priority[a.habit_type] ?? 2) - (priority[b.habit_type] ?? 2);
  });

  const currentList =
    tab === "all" ? sortedHabits : tab === "positive" ? positive : negative;

  return (
    <div className="w-full h-full flex flex-col gap-6 overflow-auto pb-12  text-foreground">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20">
            <Activity className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-none">
              Hábitos & Disciplina
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {habits.length} ativos · {positive.length} positivos ·{" "}
              {negative.length} controle
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-white font-bold transition-all cursor-pointer active:scale-95",
            "bg-teal-600 hover:bg-teal-500 dark:bg-teal-500 dark:hover:bg-teal-400",
          )}
        >
          <Plus className="w-4 h-4" /> Novo Hábito
        </button>
      </div>

      {/* Categorias */}
      <div className="flex gap-1 p-1.5 bg-card border border-border rounded-xl w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border",
              tab === t.id
                ? t.color === "teal"
                  ? "bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-500/30"
                  : "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30"
                : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted",
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-md",
                tab === t.id
                  ? t.color === "teal"
                    ? "bg-teal-500/20 text-teal-600 dark:text-teal-400"
                    : "bg-red-500/20 text-red-600 dark:text-red-400"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Listagem */}
      {currentList.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="Nenhum hábito rastreado"
          description="Você ainda não possui registros nesta categoria. Comece definindo uma nova meta de disciplina."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentList.map((h) => (
            <HabitCard
              key={h.id}
              habit={h}
              onRefresh={fetchHabits}
              onEdit={setEditingHabit}
              onOpenResetDialog={setResetId}
              onOpenHardResetDialog={setHardResetId}
              onDelete={setDeleteId}
            />
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
    </div>
  );
}
