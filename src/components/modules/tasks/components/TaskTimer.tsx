"use client";

import { Pause, Play } from "lucide-react";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { useTaskTimerContext } from "@/context/TaskTimerContext";
import { cn } from "@/lib/utils";
import type { Task } from "../types";

// Re-exporta formatTime do context para compatibilidade
export { formatTime } from "@/context/TaskTimerContext";

interface TaskTimerProps {
  task: Task;
  /** Callback para atualizar o tempo exibido localmente após persistência */
  onTimeSaved?: (taskId: number, newTotal: number) => void;
  /** Callback para mover a tarefa para "Fazendo" no kanban ao iniciar */
  onStatusChange?: (taskId: number, status: "todo" | "doing" | "done") => void;
  className?: string;
}

/**
 * Badge de temporizador — lê e controla o estado global via TaskTimerContext.
 * O cronômetro continua rodando mesmo ao sair do módulo de tarefas.
 * Ao iniciar, move tarefa "todo" → "doing".
 * Ao pausar, persiste o tempo acumulado via tasks_add_time.
 */
export function TaskTimer({
  task,
  onTimeSaved,
  onStatusChange,
  className,
}: TaskTimerProps) {
  const { activeTimerTaskId, startTimer, pauseTimer, getDisplayTime } =
    useTaskTimerContext();

  const taskId = task.id;
  if (taskId === undefined) return null;

  const isActive = activeTimerTaskId === taskId;
  const totalDisplay = getDisplayTime(taskId, task.timeSpentSeconds ?? 0);

  const handleToggle = async () => {
    if (isActive) {
      await pauseTimer({
        onTimeSaved,
      });
    } else {
      await startTimer(taskId, {
        onStatusChange,
        taskStatus: task.status ?? (task.completed ? "done" : "todo"),
        onTimeSaved,
      });
    }
  };

  return (
    <ToolTip
      content={isActive ? "Pausar temporizador" : "Iniciar temporizador"}
    >
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-all border shrink-0",
          isActive
            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
            : "bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted",
          className,
        )}
      >
        {isActive ? (
          <Pause className="w-2.5 h-2.5 shrink-0" />
        ) : (
          <Play className="w-2.5 h-2.5 shrink-0" />
        )}
        <span className="tabular-nums">{totalDisplay || "Timer"}</span>
      </button>
    </ToolTip>
  );
}

/**
 * Alias para o kanban — mesmo componente, sem className.
 */
export const TaskTimerBadge = TaskTimer;
