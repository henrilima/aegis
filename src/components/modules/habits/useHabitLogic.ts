"use client";

import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useTime } from "@/context/TimeContext";
import type { Habit } from "./types";

export function useHabitLogic(habit: Habit, onRefresh?: () => void) {
  const { now: simulatedNow } = useTime();
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [chargeTimeLeft, setChargeTimeLeft] = useState<string>("");
  const [isActionPending, setIsActionPending] = useState(false);
  const [canUse, setCanUse] = useState(true);

  const id = habit.id;
  const name = habit.name;
  const type = habit.habitType;

  const isNegative = useMemo(
    () => type === "Bad" || type === "Negative",
    [type],
  );

  const currentStreak = useMemo(() => {
    if (!isNegative) return habit.currentStreak || 0;

    if (!habit.lastSlip) return 0;
    const slip = new Date(habit.lastSlip);

    const slipDate = new Date(
      slip.getFullYear(),
      slip.getMonth(),
      slip.getDate(),
    );
    const nowDate = new Date(
      simulatedNow.getFullYear(),
      simulatedNow.getMonth(),
      simulatedNow.getDate(),
    );

    const diff = nowDate.getTime() - slipDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }, [habit.currentStreak, habit.lastSlip, isNegative, simulatedNow]);

  const diaAtual = currentStreak;

  const tempoDeCriacao = useMemo(() => {
    const created = new Date(habit.createdAt);
    const diff = simulatedNow.getTime() - created.getTime();

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    let text = "";
    if (days > 0) text += `${days}d `;
    if (hours > 0 || days > 0) text += `${hours}h `;
    text += `${mins}m`;
    return text;
  }, [habit.createdAt, simulatedNow]);

  const recorde = habit.maxStreak;
  const totalContagem = habit.chargesUsed;
  const intervalo = habit.cooldownDays;
  const currentCharges = habit.currentCharges;
  const maxCharges = habit.chargesAmount;

  const todayStr = useMemo(() => {
    const y = simulatedNow.getFullYear();
    const m = String(simulatedNow.getMonth() + 1).padStart(2, "0");
    const d = String(simulatedNow.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [simulatedNow]);

  const markDone = useCallback(async () => {
    if (isActionPending) return;
    try {
      setIsActionPending(true);
      const nowStr = simulatedNow.toISOString();
      await invoke("habit_mark_habit_done", { id, timestamp: nowStr });
      onRefresh?.();
      toast.success("Hábito concluído com sucesso!");
    } catch (e) {
      toast.error(`Erro ao registrar progresso: ${e}`);
    } finally {
      setIsActionPending(false);
    }
  }, [id, onRefresh, simulatedNow, isActionPending]);

  const toggleDate = useCallback(
    async (dateStr: string, completed: boolean) => {
      if (isActionPending) return;
      try {
        setIsActionPending(true);
        await invoke("habit_toggle_date", { id, date: dateStr, completed });
        onRefresh?.();
      } catch (e) {
        toast.error(`Erro ao atualizar hábito: ${e}`);
      } finally {
        setIsActionPending(false);
      }
    },
    [id, onRefresh, isActionPending],
  );

  const handleUseCharge = useCallback(async () => {
    if (currentCharges <= 0) {
      toast.error("Sem cargas de proteção disponíveis!");
      return;
    }
    try {
      await invoke("habit_use_habit_charge", { id });
      onRefresh?.();
      toast.success("Carga utilizada!");
    } catch {
      toast.error("Falha ao utilizar carga");
    }
  }, [id, onRefresh, currentCharges]);

  const resetStreak = useCallback(async () => {
    try {
      await invoke("habit_reset_habit", {
        id,
        timestamp: simulatedNow.toISOString(),
      });
      onRefresh?.();
      toast.error(
        isNegative
          ? "Reiniciado. Continue firme na próxima!"
          : "Sequência zerada. Tente novamente!",
      );
    } catch {
      toast.error("Erro ao processar reinício");
    }
  }, [id, isNegative, onRefresh, simulatedNow]);

  const hardReset = useCallback(async () => {
    try {
      await invoke("habit_hard_reset_habit", {
        id,
        timestamp: simulatedNow.toISOString(),
      });
      onRefresh?.();
      toast.info("Histórico do hábito resetado.");
    } catch {
      toast.error("Erro no reset total");
    }
  }, [id, onRefresh, simulatedNow]);

  const deleteHabit = useCallback(async () => {
    try {
      await invoke("habit_delete_habit", { id });
      onRefresh?.();
      toast.success("Registro removido");
    } catch {
      toast.error("Erro ao excluir registro");
    }
  }, [id, onRefresh]);

  useEffect(() => {
    const formatMS = (diff: number) => {
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      let text = "";
      if (d > 0) text += `${d}d `;
      if (h > 0 || d > 0) text += `${h}h `;
      if (m > 0 || h > 0 || d > 0) text += `${m}m `;
      text += `${s}s`;
      return text;
    };

    const updateTimer = () => {
      if (isNegative || !habit.lastDone) {
        setCanUse(true);
        setTimeLeft("");
      } else {
        const lastDate = new Date(habit.lastDone);
        const effectiveInterval = Math.max(1, intervalo);
        const nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + effectiveInterval);
        nextDate.setHours(0, 0, 0, 0);

        const nextAvailable = nextDate.getTime();
        const nowMs = simulatedNow.getTime();
        const diff = nextAvailable - nowMs;

        if (diff <= 0) {
          setCanUse(true);
          setTimeLeft("");
        } else {
          setCanUse(false);
          setTimeLeft(formatMS(diff));
        }
      }

      if (habit.chargesAmount > 0 && habit.chargesIntervalDays > 0) {
        const lastRefill = new Date(habit.lastChargeRefill).getTime();
        const intervalMs = habit.chargesIntervalDays * 24 * 60 * 60 * 1000;
        const nextRefill = lastRefill + intervalMs;
        const nowMs = simulatedNow.getTime();
        const diffCharge = nextRefill - nowMs;

        if (diffCharge <= 0) {
          setChargeTimeLeft("");
        } else {
          setChargeTimeLeft(formatMS(diffCharge));
        }
      } else {
        setChargeTimeLeft("");
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [
    habit.lastDone,
    habit.lastChargeRefill,
    habit.chargesAmount,
    habit.chargesIntervalDays,
    intervalo,
    isNegative,
    simulatedNow,
  ]);

  return {
    id,
    name,
    type,
    isNegative,
    diaAtual,
    currentStreak,
    recorde,
    tempoDeCriacao,
    canUse,
    timeLeft,
    chargeTimeLeft,
    totalContagem,
    intervalo,
    currentCharges,
    maxCharges,
    isActionPending,
    todayStr,

    actions: {
      markDone,
      toggleDate,
      handleUseCharge,
      resetStreak,
      hardReset,
      deleteHabit,
    },
  };
}
