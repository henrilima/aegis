"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface TaskTimerState {
  /** Id da tarefa com cronômetro ativo. Null = nenhuma ativa. */
  activeTimerTaskId: number | null;
  /** Segundos acumulados na sessão atual (não persistidos ainda) */
  sessionSeconds: number;
  /** Inicia o cronômetro para uma tarefa. Para a anterior automaticamente. */
  startTimer: (
    taskId: number,
    opts?: {
      onStatusChange?: (
        taskId: number,
        status: "todo" | "doing" | "done",
      ) => void;
      taskStatus?: string;
    },
  ) => Promise<void>;
  /** Para o cronômetro da tarefa ativa e persiste o tempo acumulado. */
  pauseTimer: (opts?: {
    onTimeSaved?: (taskId: number, newTotal: number) => void;
    currentSavedSeconds?: number;
  }) => Promise<void>;
  /** Retorna o tempo formatado de uma tarefa (base salva + sessão corrente). */
  getDisplayTime: (taskId: number, savedSeconds: number) => string;
}

const TaskTimerContext = createContext<TaskTimerState | null>(null);

/** Formata segundos em "Xh Ymin" ou "Zs" */
export function formatTime(totalSeconds: number): string {
  if (totalSeconds <= 0) return "";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m > 0 ? `${m}min` : ""}`.trim();
  if (m > 0) return `${m}min ${s > 0 ? `${s}s` : ""}`.trim();
  return `${s}s`;
}

export function TaskTimerProvider({ children }: { children: React.ReactNode }) {
  const [activeTimerTaskId, setActiveTimerTaskId] = useState<number | null>(
    null,
  );
  const [sessionSeconds, setSessionSeconds] = useState(0);

  // Refs para evitar closure stale em callbacks assíncronos
  const sessionSecondsRef = useRef(0);
  const activeTimerTaskIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Mantém refs sincronizados com os states
  useEffect(() => {
    sessionSecondsRef.current = sessionSeconds;
  }, [sessionSeconds]);

  useEffect(() => {
    activeTimerTaskIdRef.current = activeTimerTaskId;
  }, [activeTimerTaskId]);

  // Inicia/para o intervalo global conforme activeTimerTaskId muda
  useEffect(() => {
    if (activeTimerTaskId !== null) {
      intervalRef.current = setInterval(() => {
        setSessionSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setSessionSeconds(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [activeTimerTaskId]);

  /** Persiste os segundos de sessão ao banco e reseta o contador */
  const persistSession = useCallback(
    async (
      taskId: number,
      seconds: number,
      opts?: {
        onTimeSaved?: (taskId: number, newTotal: number) => void;
        currentSavedSeconds?: number;
      },
    ) => {
      if (seconds <= 0) return;
      try {
        await invoke("tasks_add_time", { id: taskId, seconds });
        const newTotal = (opts?.currentSavedSeconds ?? 0) + seconds;
        opts?.onTimeSaved?.(taskId, newTotal);
      } catch {
        // Falha silenciosa
      }
    },
    [],
  );

  const startTimer = useCallback(
    async (
      taskId: number,
      opts?: {
        onStatusChange?: (
          taskId: number,
          status: "todo" | "doing" | "done",
        ) => void;
        taskStatus?: string;
      },
    ) => {
      // Se havia outra tarefa ativa, persiste o tempo dela antes de trocar
      const prevId = activeTimerTaskIdRef.current;
      if (prevId !== null && prevId !== taskId) {
        const secs = sessionSecondsRef.current;
        if (secs > 0) {
          await persistSession(prevId, secs);
        }
      }

      // Move para "doing" se a tarefa estiver em "todo"
      const currentStatus = opts?.taskStatus ?? "todo";
      if (currentStatus === "todo") {
        try {
          await invoke("tasks_update_status", { id: taskId, status: "doing" });
          opts?.onStatusChange?.(taskId, "doing");
        } catch {
          // Falha silenciosa
        }
      }

      setSessionSeconds(0);
      sessionSecondsRef.current = 0;
      setActiveTimerTaskId(taskId);
    },
    [persistSession],
  );

  const pauseTimer = useCallback(
    async (opts?: {
      onTimeSaved?: (taskId: number, newTotal: number) => void;
      currentSavedSeconds?: number;
    }) => {
      const taskId = activeTimerTaskIdRef.current;
      if (taskId === null) return;

      const secs = sessionSecondsRef.current;
      await persistSession(taskId, secs, opts);
      setActiveTimerTaskId(null);
    },
    [persistSession],
  );

  const getDisplayTime = useCallback(
    (taskId: number, savedSeconds: number): string => {
      const extra = activeTimerTaskId === taskId ? sessionSeconds : 0;
      return formatTime(savedSeconds + extra);
    },
    [activeTimerTaskId, sessionSeconds],
  );

  return (
    <TaskTimerContext.Provider
      value={{
        activeTimerTaskId,
        sessionSeconds,
        startTimer,
        pauseTimer,
        getDisplayTime,
      }}
    >
      {children}
    </TaskTimerContext.Provider>
  );
}

/** Hook para acessar o contexto global do temporizador de tarefas */
export function useTaskTimerContext() {
  const ctx = useContext(TaskTimerContext);
  if (!ctx) {
    throw new Error(
      "useTaskTimerContext deve ser usado dentro de TaskTimerProvider",
    );
  }
  return ctx;
}
