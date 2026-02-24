"use client";

import { invoke } from "@tauri-apps/api/core";
import { Activity, LayoutGrid, Plus, ShieldOff, Zap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CONFIRM_PRESETS, ConfirmModal } from "@/components/ui/ConfirmModal";
import { useAuth } from "@/context/AuthContext";
import { EditHabitDialog } from "./edit-dialog";
import { HabitCard } from "./habit-card";
import { HabitCreateModal } from "./habit-create-modal";
import type { Habit } from "./types";

type TabId = "all" | "positive" | "negative";

export default function HabitsPage() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [resetId, setResetId] = useState<number | null>(null);
  const [hardResetId, setHardResetId] = useState<number | null>(null);

  const fetchHabits = useCallback(async () => {
    if (!user) return;
    try {
      const res = await invoke<Habit[]>("list_habits", {
        userId: String(user.id),
      });
      setHabits(res);
    } catch {
      toast.error("Erro ao carregar hábitos");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const handleAdd = async (
    name: string,
    cooldown: number,
    type: "Positive" | "Negative",
  ) => {
    if (!user) return;
    const minCooldown = type === "Negative" ? 2 : 1;
    try {
      await invoke("add_habit", {
        habit: {
          user_id: String(user.id),
          name,
          habit_type: type,
          last_slip: new Date().toISOString(),
          created_at: new Date().toISOString(),
          max_streak: 0,
          cooldown_days: Math.max(minCooldown, cooldown),
          last_done: null,
          charges_used: 0,
        },
      });
      fetchHabits();
      setCreateOpen(false);
      toast.success("Novo hábito rastreado!");
    } catch {
      toast.error("Erro ao adicionar");
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
      toast.error("Erro ao atualizar");
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
      toast.error("Sequência reiniciada.");
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
      toast.info("Hábito reiniciado do zero.");
    } catch {
      toast.error("Erro ao reiniciar hábito");
    }
  };

  const positive = habits.filter((h) => h.habit_type === "Positive");
  const negative = habits.filter(
    (h) => h.habit_type === "Negative" || h.habit_type === "Bad",
  );

  if (loading)
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-neutral-500 animate-pulse">
          <Activity className="w-4 h-4" /> Sincronizando hábitos...
        </div>
      </div>
    );

  const TABS: {
    id: TabId;
    label: string;
    icon: typeof LayoutGrid;
    count: number;
    activeColor: string;
  }[] = [
    {
      id: "all",
      label: "Todos",
      icon: LayoutGrid,
      count: habits.length,
      activeColor: "bg-teal-600/20 text-teal-400 border-teal-600/30",
    },
    {
      id: "positive",
      label: "Positivos",
      icon: Zap,
      count: positive.length,
      activeColor: "bg-teal-600/20 text-teal-400 border-teal-600/30",
    },
    {
      id: "negative",
      label: "Vícios",
      icon: ShieldOff,
      count: negative.length,
      activeColor: "bg-red-600/20 text-red-400 border-red-600/30",
    },
  ];

  const listMap: Record<TabId, Habit[]> = { all: habits, positive, negative };
  const list = listMap[tab];

  return (
    <>
      <div className="w-full h-full flex flex-col gap-6 overflow-auto pb-10 animate-in fade-in duration-500">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20">
              <Activity className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-none">Hábitos</h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                {habits.length} hábito{habits.length !== 1 ? "s" : ""} ·{" "}
                {positive.length} positivo{positive.length !== 1 ? "s" : ""} ·{" "}
                {negative.length} vício{negative.length !== 1 ? "s" : ""}{" "}
                controlado{negative.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold transition-colors cursor-pointer shadow-lg shadow-teal-500/20"
          >
            <Plus className="w-4 h-4" /> Novo Hábito
          </button>
        </div>

        <div className="flex gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-2xl w-fit">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                tab === t.id
                  ? `${t.activeColor} border`
                  : "text-neutral-500 hover:text-neutral-200"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${tab === t.id ? "bg-neutral-900/60" : "bg-neutral-800 text-neutral-500"}`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-neutral-700">
            <Activity className="w-8 h-8 opacity-20" />
            <p className="text-sm">Nenhum hábito nesta categoria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((h) => (
              <HabitCard
                key={h.id}
                habit={h}
                onRefresh={fetchHabits}
                onEdit={setEditingHabit}
                onOpenResetDialog={setResetId}
                onOpenHardResetDialog={setHardResetId}
              />
            ))}
          </div>
        )}
      </div>

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
    </>
  );
}
