"use client";

import { invoke } from "@tauri-apps/api/core";
import { Flag, Pause, Play, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import { PomodoroTaskSelector } from "./PomodoroTaskSelector";
import type { PomodoroHistory } from "./types";

interface StopwatchUnitProps {
  linkedTaskId: number | null;
  onSelectTask: (taskId: number | null) => void;
  onSessionRecorded?: () => void;
}

interface Lap {
  id: number;
  timeMs: number;
  splitMs: number;
}

export function StopwatchUnit({
  linkedTaskId,
  onSelectTask,
  onSessionRecorded,
}: StopwatchUnitProps) {
  const { user } = useAuth();
  const color = getModuleColor("pomodoro");
  const theme = getColorTheme(color);

  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [laps, setLaps] = useState<Lap[]>([]);

  const startTimestampRef = useRef<number | null>(null);
  const accumulatedMsRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const pendingTaskSecondsRef = useRef<number>(0);

  // Sincroniza tempo com a tarefa vinculada
  const syncTaskSeconds = useCallback(
    async (seconds: number) => {
      if (!linkedTaskId || seconds <= 0) return;
      try {
        await invoke("tasks_add_time", {
          id: linkedTaskId,
          seconds,
        });
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("task-time-updated", {
              detail: { taskId: linkedTaskId, seconds },
            }),
          );
        }
      } catch (err) {
        console.error("Erro ao creditar tempo da tarefa no cronômetro:", err);
      }
    },
    [linkedTaskId],
  );

  // Loop de alta precisão do cronômetro
  useEffect(() => {
    if (isRunning) {
      startTimestampRef.current = performance.now();

      const loop = (now: number) => {
        if (startTimestampRef.current !== null) {
          const delta = now - startTimestampRef.current;
          const currentTotal = accumulatedMsRef.current + delta;
          setElapsedMs(currentTotal);
        }
        animFrameRef.current = requestAnimationFrame(loop);
      };

      animFrameRef.current = requestAnimationFrame(loop);
    } else {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isRunning]);

  // Persistência periódica para a tarefa vinculada a cada 5 segundos
  useEffect(() => {
    if (!isRunning || !linkedTaskId) return;

    const interval = setInterval(() => {
      pendingTaskSecondsRef.current += 1;
      if (pendingTaskSecondsRef.current >= 5) {
        const toSync = pendingTaskSecondsRef.current;
        pendingTaskSecondsRef.current = 0;
        syncTaskSeconds(toSync);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, linkedTaskId, syncTaskSeconds]);

  const handleToggle = () => {
    if (isRunning) {
      // Pausando
      if (startTimestampRef.current !== null) {
        accumulatedMsRef.current +=
          performance.now() - startTimestampRef.current;
      }
      setIsRunning(false);

      if (pendingTaskSecondsRef.current > 0) {
        const toSync = pendingTaskSecondsRef.current;
        pendingTaskSecondsRef.current = 0;
        syncTaskSeconds(toSync);
      }
    } else {
      // Iniciando
      setIsRunning(true);
    }
  };

  const handleReset = async () => {
    const totalSeconds = Math.floor(elapsedMs / 1000);

    // Se correu por pelo menos 30 segundos, registra no histórico
    if (totalSeconds >= 30 && user?.id) {
      const effectiveMinutes = Math.max(1, Math.round(totalSeconds / 60));
      const nowIso = new Date().toISOString();
      const historyEntry: PomodoroHistory = {
        userId: String(user.id),
        workMinutes: effectiveMinutes,
        breakMinutes: 0,
        cyclesDone: 0,
        startTime: nowIso,
        endTime: nowIso,
      };

      try {
        await invoke("pomodoro_record_pomodoro_session", {
          history: historyEntry,
        });
        toast.success(`Sessão de cronômetro salva: ${effectiveMinutes} min`);
        if (onSessionRecorded) onSessionRecorded();
      } catch (err) {
        console.error("Erro ao registrar histórico do cronômetro:", err);
      }

      if (pendingTaskSecondsRef.current > 0) {
        const toSync = pendingTaskSecondsRef.current;
        pendingTaskSecondsRef.current = 0;
        await syncTaskSeconds(toSync);
      }
    }

    setIsRunning(false);
    setElapsedMs(0);
    accumulatedMsRef.current = 0;
    startTimestampRef.current = null;
    setLaps([]);
  };

  const handleAddLap = () => {
    if (!isRunning && elapsedMs === 0) return;
    const previousTotal = laps.length > 0 ? laps[0].timeMs : 0;
    const splitMs = elapsedMs - previousTotal;

    const newLap: Lap = {
      id: laps.length + 1,
      timeMs: elapsedMs,
      splitMs,
    };

    setLaps([newLap, ...laps]);
  };

  // Formatação de Horas, Minutos, Segundos e Centésimos
  const formatStopwatch = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);

    const pad = (n: number) => n.toString().padStart(2, "0");

    return {
      main: `${hours > 0 ? `${pad(hours)}:` : ""}${pad(minutes)}:${pad(seconds)}`,
      cs: pad(centiseconds),
    };
  };

  const timeFormatted = formatStopwatch(elapsedMs);

  return (
    <div className="w-full flex flex-col items-center gap-10">
      {/* Display do Cronômetro */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-baseline">
          <span
            className={cn(
              "text-7xl sm:text-8xl font-black font-outfit tabular-nums transition-all",
              theme.text,
            )}
          >
            {timeFormatted.main}
          </span>
          <span className="text-3xl sm:text-4xl font-bold font-outfit text-muted-foreground ml-1.5 tabular-nums">
            .{timeFormatted.cs}
          </span>
        </div>
        <span
          className={cn(
            "text-[10px] font-bold px-4 py-1.5 rounded-full border transition-all",
            isRunning
              ? cn(theme.bg, theme.border, theme.text)
              : "bg-muted border-border text-muted-foreground",
          )}
        >
          {isRunning
            ? "Cronômetro em Andamento"
            : elapsedMs > 0
              ? "Cronômetro Pausado"
              : "Cronômetro Pronto"}
        </span>
      </div>

      {/* Botões de Controle */}
      <div className="flex items-center gap-4">
        <Button
          size="lg"
          onClick={handleToggle}
          className={cn(
            "px-7 h-11 font-black transition-all rounded-xl text-sm font-outfit cursor-pointer",
            cn(theme.solid, theme.solidHover, "text-white"),
          )}
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5 mr-2 stroke-3" /> Pausar
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-2 stroke-3" /> Iniciar
            </>
          )}
        </Button>

        <Button
          variant="ghost"
          size="lg"
          onClick={handleAddLap}
          disabled={!isRunning}
          className="h-11 border border-border hover:bg-accent/50 font-bold px-5 rounded-xl transition-all text-muted-foreground disabled:opacity-30 text-sm cursor-pointer"
        >
          <Flag className="w-4 h-4 mr-2" /> Volta
        </Button>

        <Button
          variant="ghost"
          size="lg"
          onClick={handleReset}
          disabled={isRunning || elapsedMs === 0}
          className="h-11 border border-border hover:bg-accent/50 font-bold px-5 rounded-xl transition-all text-muted-foreground disabled:opacity-30 text-sm cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 mr-2" /> Zerar
        </Button>
      </div>

      {/* Tarefa Vinculada */}
      <PomodoroTaskSelector
        linkedTaskId={linkedTaskId}
        onSelectTask={(task) => onSelectTask(task?.id ?? null)}
        isTimerRunning={isRunning}
        isWorkCycle={true}
      />

      {/* Lista de Voltas (Laps) */}
      {laps.length > 0 && (
        <div className="w-full max-w-md bg-card/60 border border-border/70 rounded-2xl p-4 flex flex-col gap-2 max-h-52 overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground border-b border-border/40 pb-2">
            <span>Volta</span>
            <span>Tempo parcial</span>
            <span>Tempo total</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {laps.map((lap) => {
              const splitTime = formatStopwatch(lap.splitMs);
              const totalTime = formatStopwatch(lap.timeMs);
              return (
                <div
                  key={lap.id}
                  className="flex justify-between items-center text-xs font-mono py-1 border-b border-border/20 last:border-none"
                >
                  <span className="font-bold text-muted-foreground">
                    #{lap.id.toString().padStart(2, "0")}
                  </span>
                  <span className="text-foreground">
                    +{splitTime.main}.{splitTime.cs}
                  </span>
                  <span className="text-foreground font-bold">
                    {totalTime.main}.{totalTime.cs}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
