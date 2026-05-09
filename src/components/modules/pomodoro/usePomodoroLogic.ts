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
        pState.cycleType === "Work" ? pState.workMinutes : pState.breakMinutes;
      const totalSeconds = duration * 60;

      let elapsed = pState.accumulatedSeconds;
      // Soma o tempo acumulado com o tempo que passou desde o início do timer
      if (pState.isRunning && pState.startTime) {
        const startTime = new Date(pState.startTime).getTime();
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
    const isStarting = !state.isRunning;
    const nowIso = simulatedNow.toISOString();

    let newAccumulated = state.accumulatedSeconds;
    // Registra os segundos decorridos antes de pausar ou alternar o timer
    if (!isStarting && state.startTime) {
      const startTime = new Date(state.startTime).getTime();
      const elapsed = Math.floor((simulatedNow.getTime() - startTime) / 1000);
      newAccumulated += elapsed;
    }

    const newState = {
      ...state,
      isRunning: isStarting,
      startTime: isStarting ? nowIso : null,
      accumulatedSeconds: newAccumulated,
      cycleType:
        isStarting && state.cyclesCompleted === 0 ? "Work" : state.cycleType,
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
    if (state.cyclesCompleted > 0) {
      const historyEntry: PomodoroHistory = {
        userId: String(user.id),
        workMinutes: state.workMinutes,
        breakMinutes: state.breakMinutes,
        cyclesDone: state.cyclesCompleted,
        startTime: simulatedNow.toISOString(),
        endTime: simulatedNow.toISOString(),
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
      isRunning: false,
      startTime: null,
      cyclesCompleted: 0,
      accumulatedSeconds: 0,
      cycleType: "Work",
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
    async (key: "workMinutes" | "breakMinutes", val: string) => {
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
