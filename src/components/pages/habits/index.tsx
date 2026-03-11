"use client";

import { invoke } from "@tauri-apps/api/core";
import { Activity, LayoutGrid, Plus, ShieldOff, Zap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CONFIRM_PRESETS, ConfirmModal } from "@/components/ui/ConfirmModal";
import { useAuth } from "@/context/AuthContext";

import { EditHabitDialog } from "@/components/forms/habits/editDialog";
import { HabitCard } from "./habitCard";
import { HabitCreateModal } from "@/components/forms/habits/habitCreateModal";
import type { Habit } from "./types";

type TabId = "all" | "positive" | "negative";

/**
 * Módulo de Hábitos: Monitoramento de comportamentos positivos e controle de vícios
 */
export default function HabitsPage() {
  const { user } = useAuth();
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
    const now = new Date().toISOString();
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
        timestamp: new Date().toISOString(),
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
        timestamp: new Date().toISOString(),
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

  // Filtragem de listas para navegação inteligente
  const positive = habits.filter((h) => h.habit_type === "Positive");
  const negative = habits.filter(
    (h) => h.habit_type === "Negative" || h.habit_type === "Bad",
  );

  if (loading)
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-neutral-500 animate-pulse font-bold">
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

  const currentList =
    tab === "all" ? habits : tab === "positive" ? positive : negative;

  return (
    <div className="w-full h-full flex flex-col gap-6 overflow-auto pb-12 animate-in fade-in duration-500 text-white">
      {/* Cabeçalho do Módulo */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20">
            <Activity className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-none">
              Hábitos & Disciplina
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              {habits.length} ativos · {positive.length} positivos ·{" "}
              {negative.length} controle
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white  font-bold transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Novo Hábito
        </button>
      </div>

      {/* Navegação por Categoria */}
      <div className="flex gap-1 p-1.5 bg-neutral-950 border border-neutral-700/60 rounded-2xl w-fit shadow-lg shadow-black/30">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              tab === t.id
                ? t.color === "teal"
                  ? "bg-teal-500/25 text-teal-300 border border-teal-500/40 shadow-sm shadow-teal-500/10"
                  : "bg-red-500/25 text-red-300 border border-red-500/40 shadow-sm shadow-red-500/10"
                : "text-neutral-500 hover:text-neutral-200 hover:bg-white/5"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                tab === t.id
                  ? t.color === "teal"
                    ? "bg-teal-500/20 text-teal-300"
                    : "bg-red-500/20 text-red-300"
                  : "bg-neutral-800 text-neutral-600"
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Listagem de Hábitos */}
      {currentList.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-neutral-800">
          <div className="p-4 rounded-full bg-neutral-900/50">
            <Activity className="w-10 h-10 opacity-10" />
          </div>
          <p className=" font-bold uppercase opacity-30">
            Nenhum hábito rastreado aqui
          </p>
        </div>
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

      {/* Modais de Fluxo */}
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

      {/* Diálogos de Confirmação */}
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
