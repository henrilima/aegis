import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Habit } from "./types";

export function useHabitLogic(habit: Habit, onRefresh?: () => void) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [canUse, setCanUse] = useState(true);

  const id = habit.id;
  const name = habit.name;
  const type = habit.habit_type;

  const isNegative = useMemo(
    () => type === "Bad" || type === "Negative",
    [type],
  );

  const diaAtual = useMemo(() => {
    // Calcula o dia atual ou streak baseado no tipo de hábito (positivo ou negativo)
    if (!isNegative) return habit.charges_used;

    if (!habit.last_slip) return 0;
    const slip = new Date(habit.last_slip);
    const now = new Date();
    const diff = now.getTime() - slip.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }, [habit.charges_used, habit.last_slip, isNegative]);

  const currentStreak = diaAtual;

  const tempoDeCriacao = useMemo(() => {
    const created = new Date(habit.created_at);
    const now = new Date();
    const diff = now.getTime() - created.getTime();

    // Converte a diferença de tempo em um formato legível (dias, horas, minutos)
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    let text = "";
    if (days > 0) text += `${days}d `;
    if (hours > 0 || days > 0) text += `${hours}h `;
    text += `${mins}m`;
    return text;
  }, [habit.created_at]);

  const recorde = habit.max_streak;
  const totalContagem = habit.charges_used;
  const intervalo = habit.cooldown_days;

  const markDone = useCallback(async () => {
    try {
      const now = new Date().toISOString();
      await invoke("mark_habit_done", { id, timestamp: now });
      onRefresh?.();
      toast.success("Progresso registrado!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao registrar");
    }
  }, [id, onRefresh]);

  const handleUseCharge = useCallback(async () => {
    try {
      await invoke("use_habit_charge", { id });
      onRefresh?.();
      toast.success("Carga utilizada!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao utilizar carga");
    }
  }, [id, onRefresh]);

  const resetStreak = useCallback(async () => {
    try {
      await invoke("reset_habit", {
        id,
        timestamp: new Date().toISOString(),
      });
      onRefresh?.();
      toast.error(
        isNegative
          ? "Deslize registrado. Sequência zerada."
          : "Sequência reiniciada.",
      );
    } catch (err) {
      console.error(err);
      toast.error("Erro ao reiniciar");
    }
  }, [id, isNegative, onRefresh]);

  const hardReset = useCallback(async () => {
    try {
      await invoke("hard_reset_habit", {
        id,
        timestamp: new Date().toISOString(),
      });
      onRefresh?.();
      toast.info("Hábito reiniciado do zero.");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao reiniciar hábito");
    }
  }, [id, onRefresh]);

  const deleteHabit = useCallback(async () => {
    try {
      await invoke("delete_habit", { id });
      onRefresh?.();
      toast.success("Deletado");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao deletar");
    }
  }, [id, onRefresh]);

  useEffect(() => {
    if (isNegative && intervalo === 0) {
      setCanUse(false);
      setTimeLeft("");
      return;
    }

    const updateTimer = () => {
      if (!habit.last_done) {
        setCanUse(true);
        setTimeLeft("");
        return;
      }

      const last = new Date(habit.last_done).getTime();
      const cooldownMs = intervalo * 24 * 60 * 60 * 1000;
      const nextAvailable = last + cooldownMs;
      const now = Date.now();
      const diff = nextAvailable - now;

      if (diff <= 0) {
        setCanUse(true);
        setTimeLeft("");
      } else {
        setCanUse(false);
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        let text = "";
        if (d > 0) text += `${d}d `;
        if (h > 0 || d > 0) text += `${h}h `;
        if (m > 0 || h > 0 || d > 0) text += `${m}m `;
        text += `${s}s`;
        setTimeLeft(text);
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [habit.last_done, intervalo, isNegative]);

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
    totalContagem,
    intervalo,

    labels: {
      total: isNegative ? "Deslizes totais" : "Conclusões totais",
      history: isNegative ? "deslizou" : "concluiu",
      action: isNegative ? "Usar Carga (Protegido)" : "Marcar Concluído",
      secondaryAction: isNegative
        ? "Registrar Deslize (Zera Sequência)"
        : "Falhei hoje (Zerar Sequência)",
    },

    actions: {
      markDone,
      handleUseCharge,
      resetStreak,
      hardReset,
      deleteHabit,
    },
  };
}
