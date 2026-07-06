declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useTime } from "@/context/TimeContext";
import type { PomodoroHistory, PomodoroState } from "./types";

/**
 * Sintetiza um sinal sonoro agradável usando a Web Audio API.
 * Reproduz um arpejo curto em Dó Maior (C5 → E5 → G5) com envelopes de ganho suaves.
 */
function playPomodoroChime() {
  try {
    const ctx = new AudioContext();
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.35;
    masterGain.connect(ctx.destination);

    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    const now = ctx.currentTime;

    for (let i = 0; i < frequencies.length; i++) {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = frequencies[i];

      // Envelope suave de ataque → sustentação → decaimento
      const noteStart = now + i * 0.15;
      noteGain.gain.setValueAtTime(0, noteStart);
      noteGain.gain.linearRampToValueAtTime(0.6, noteStart + 0.05);
      noteGain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.6);

      osc.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(noteStart);
      osc.stop(noteStart + 0.65);
    }

    // Limpa o contexto após a finalização de todas as notas
    setTimeout(() => ctx.close(), 1500);
  } catch {
    // AudioContext pode não estar disponível em todos os ambientes
  }
}

export function usePomodoroLogic() {
  const { user } = useAuth();
  const { now: simulatedNow } = useTime();
  const [state, setState] = useState<PomodoroState | null>(null);
  const [history, setHistory] = useState<PomodoroHistory[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const prevCycleTypeRef = useRef<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    try {
      const res = await invoke<PomodoroHistory[]>(
        "pomodoro_get_pomodoro_history",
        {
          userId: String(user.id),
        },
      );
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
      const res = await invoke<PomodoroState>("pomodoro_get_pomodoro_state", {
        userId: String(user.id),
      });

      // Detecta a transição de ciclo e toca o sinal sonoro
      if (
        prevCycleTypeRef.current !== null &&
        res.cycleType !== prevCycleTypeRef.current &&
        res.isRunning
      ) {
        playPomodoroChime();
      }
      prevCycleTypeRef.current = res.cycleType;

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
    if (typeof window === "undefined" || !window.__TAURI_INTERNALS__) return;
    fetchState();
  }, [fetchState]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.__TAURI_INTERNALS__) return;
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
      await invoke("pomodoro_save_pomodoro_state", {
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
        await invoke("pomodoro_record_pomodoro_session", {
          session: historyEntry,
        });
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
    await invoke("pomodoro_save_pomodoro_state", {
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
      await invoke("pomodoro_clear_pomodoro_history", {
        userId: String(user.id),
      });
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
      await invoke("pomodoro_save_pomodoro_state", {
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
