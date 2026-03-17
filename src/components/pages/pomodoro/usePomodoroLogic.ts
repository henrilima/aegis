import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useTime } from "@/context/TimeContext";
import type { PomodoroHistory, PomodoroState } from "./types";

export function usePomodoroLogic() {
  const { user } = useAuth();
  const { now: simulatedNow } = useTime();
  const [state, setState] = useState<PomodoroState | null>(null);
  const [history, setHistory] = useState<PomodoroHistory[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    try {
      const res = await invoke<PomodoroHistory[]>("get_pomodoro_history", {
        userId: String(user.id),
      });
      setHistory(res);
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  const updateDisplayTime = useCallback(
    (pState: PomodoroState) => {
      const duration =
        pState.cycle_type === "Work"
          ? pState.work_minutes
          : pState.break_minutes;
      const totalSeconds = duration * 60;

      let elapsed = pState.accumulated_seconds;
      // Soma o tempo acumulado com o tempo que passou desde o início do timer
      if (pState.is_running && pState.start_time) {
        const startTime = new Date(pState.start_time).getTime();
        const nowMs = simulatedNow.getTime();
        elapsed += Math.floor((nowMs - startTime) / 1000);
      }

      // Calcula o tempo restante garantindo que não seja negativo
      const left = Math.max(0, totalSeconds - elapsed);
      setTimeLeft(left);
    },
    [simulatedNow],
  );

  const fetchState = useCallback(async () => {
    if (!user) return;
    try {
      const res = await invoke<PomodoroState>("get_pomodoro_state", {
        userId: String(user.id),
      });
      setState(res);
      updateDisplayTime(res);
      fetchHistory();
    } catch {
      toast.error("Erro ao carregar Pomodoro");
    } finally {
      setLoading(false);
    }
  }, [user, updateDisplayTime, fetchHistory]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  useEffect(() => {
    // Escuta o evento do backend para sincronizar o timer em tempo real
    const unlisten = listen("pomo-tick", () => {
      fetchState();
    });
    return () => {
      unlisten.then((u) => u());
    };
  }, [fetchState]);

  const toggleTimer = useCallback(async () => {
    if (!state || !user) return;
    const isStarting = !state.is_running;
    const nowIso = simulatedNow.toISOString();

    let newAccumulated = state.accumulated_seconds;
    // Registra os segundos decorridos antes de pausar ou alternar o timer
    if (!isStarting && state.start_time) {
      const startTime = new Date(state.start_time).getTime();
      const elapsed = Math.floor((simulatedNow.getTime() - startTime) / 1000);
      newAccumulated += elapsed;
    }

    const newState = {
      ...state,
      is_running: isStarting,
      start_time: isStarting ? nowIso : null,
      accumulated_seconds: newAccumulated,
      cycle_type:
        isStarting && state.cycles_completed === 0 ? "Work" : state.cycle_type,
    };
    try {
      await invoke("save_pomodoro_state", {
        userId: String(user.id),
        pomoState: newState,
      });
      setState(newState);
      updateDisplayTime(newState);
    } catch {
      toast.error("Erro ao salvar");
    }
  }, [state, user, updateDisplayTime, simulatedNow]);

  const stopTimer = useCallback(async () => {
    if (!user || !state) return;
    if (state.cycles_completed > 0) {
      const historyEntry: PomodoroHistory = {
        user_id: String(user.id),
        work_minutes: state.work_minutes,
        break_minutes: state.break_minutes,
        cycles_done: state.cycles_completed,
        start_time: simulatedNow.toISOString(),
        end_time: simulatedNow.toISOString(),
      };
      try {
        await invoke("record_pomodoro_session", { session: historyEntry });
        toast.success("Log salvo!");
      } catch (e) {
        console.error(e);
      }
    }
    const newState: PomodoroState = {
      ...state,
      is_running: false,
      start_time: null,
      cycles_completed: 0,
      accumulated_seconds: 0,
      cycle_type: "Work",
    };
    await invoke("save_pomodoro_state", {
      userId: String(user.id),
      pomoState: newState,
    });
    setState(newState);
    updateDisplayTime(newState);
    fetchHistory();
  }, [user, state, updateDisplayTime, fetchHistory, simulatedNow]);

  const clearHistory = useCallback(async () => {
    if (!user) return;
    try {
      await invoke("clear_pomodoro_history", { userId: String(user.id) });
      setHistory([]);
      toast.info("Histórico limpo");
    } catch {
      toast.error("Erro ao limpar");
    }
  }, [user]);

  const updateConfig = useCallback(
    async (key: "work_minutes" | "break_minutes", val: string) => {
      if (!state || !user) return;
      const num = Math.max(1, parseInt(val, 10) || 1);
      const newState = { ...state, [key]: num };
      await invoke("save_pomodoro_state", {
        userId: String(user.id),
        pomoState: newState,
      });
      setState(newState);
      updateDisplayTime(newState);
    },
    [state, user, updateDisplayTime],
  );

  const formattedTime = useMemo(() => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    // Formata os segundos em MM:SS com preenchimento de zeros
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, [timeLeft]);

  return {
    state,
    history,
    timeLeft,
    formattedTime,
    loading,
    actions: {
      toggleTimer,
      stopTimer,
      clearHistory,
      updateConfig,
      fetchState,
    },
  };
}
