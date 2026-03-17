"use client";

import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useTime } from "@/context/TimeContext";
import type { Habit } from "./types";

/**
 * Hook de Lógica para Hábitos: Gerencia timers de cooldown, recarga de cargas e ações backend
 */
export function useHabitLogic(habit: Habit, onRefresh?: () => void) {
  const { now: simulatedNow } = useTime();
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [chargeTimeLeft, setChargeTimeLeft] = useState<string>("");
  const [canUse, setCanUse] = useState(true);

  const id = habit.id;
  const name = habit.name;
  const type = habit.habit_type;

  const isNegative = useMemo(
    () => type === "Bad" || type === "Negative",
    [type],
  );

  // Cálculo da sequência atual baseada no campo do banco para positivos ou tempo para negativos
  const currentStreak = useMemo(() => {
    if (!isNegative) return habit.current_streak || 0;

    if (!habit.last_slip) return 0;
    const slip = new Date(habit.last_slip);

    // Zera horas para contar dias de calendário (meia-noite a meia-noite)
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
  }, [habit.current_streak, habit.last_slip, isNegative, simulatedNow]);

  const diaAtual = currentStreak;

  // Tempo total desde o início do rastreamento deste hábito
  const tempoDeCriacao = useMemo(() => {
    const created = new Date(habit.created_at);
    const diff = simulatedNow.getTime() - created.getTime();

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    let text = "";
    if (days > 0) text += `${days}d `;
    if (hours > 0 || days > 0) text += `${hours}h `;
    text += `${mins}m`;
    return text;
  }, [habit.created_at, simulatedNow]);

  const recorde = habit.max_streak;
  const totalContagem = habit.charges_used;
  const intervalo = habit.cooldown_days;
  const currentCharges = habit.current_charges;
  const maxCharges = habit.charges_amount;

  // Registrar conclusão de hábito positivo
  const markDone = useCallback(async () => {
    try {
      const nowStr = simulatedNow.toISOString();
      await invoke("mark_habit_done", { id, timestamp: nowStr });
      onRefresh?.();
      toast.success("Hábito concluído com sucesso!");
    } catch {
      toast.error("Erro ao registrar progresso");
    }
  }, [id, onRefresh, simulatedNow]);

  // Utilizar carga de proteção (vícios)
  const handleUseCharge = useCallback(async () => {
    if (currentCharges <= 0) {
      toast.error("Sem cargas de proteção disponíveis!");
      return;
    }
    try {
      await invoke("use_habit_charge", { id });
      onRefresh?.();
      toast.success("Carga utilizada!");
    } catch {
      toast.error("Falha ao utilizar carga");
    }
  }, [id, onRefresh, currentCharges]);

  // Reiniciar sequência por falha ou deslize
  const resetStreak = useCallback(async () => {
    try {
      await invoke("reset_habit", {
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

  // Reset total (zerar todas as métricas)
  const hardReset = useCallback(async () => {
    try {
      await invoke("hard_reset_habit", {
        id,
        timestamp: simulatedNow.toISOString(),
      });
      onRefresh?.();
      toast.info("Histórico do hábito resetado.");
    } catch {
      toast.error("Erro no reset total");
    }
  }, [id, onRefresh, simulatedNow]);

  // Excluir hábito
  const deleteHabit = useCallback(async () => {
    try {
      await invoke("delete_habit", { id });
      onRefresh?.();
      toast.success("Registro removido");
    } catch {
      toast.error("Erro ao excluir registro");
    }
  }, [id, onRefresh]);

  // Loop de atualização de timers (segundo a segundo)
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
      // Cálculo do tempo para próxima ação disponível (Positivos)
      if (isNegative || !habit.last_done) {
        setCanUse(true);
        setTimeLeft("");
      } else {
        const lastDate = new Date(habit.last_done);
        const effectiveInterval = Math.max(1, intervalo);
        const nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + effectiveInterval);
        nextDate.setHours(0, 0, 0, 0); // Considera virada do dia

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

      // Cálculo do tempo para próxima carga (Vícios)
      if (habit.charges_amount > 0 && habit.charges_interval_days > 0) {
        const lastRefill = new Date(habit.last_charge_refill).getTime();
        const intervalMs = habit.charges_interval_days * 24 * 60 * 60 * 1000;
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
    habit.last_done,
    habit.last_charge_refill,
    habit.charges_amount,
    habit.charges_interval_days,
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

    actions: {
      markDone,
      handleUseCharge,
      resetStreak,
      hardReset,
      deleteHabit,
    },
  };
}
