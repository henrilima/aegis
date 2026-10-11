"use client";

import { invoke } from "@tauri-apps/api/core";
import { Check, ChevronRight, ListTodo, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Task } from "@/components/modules/tasks/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { formatTime } from "@/context/TaskTimerContext";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";

interface PomodoroTaskSelectorProps {
  linkedTaskId: number | null;
  onSelectTask: (task: Task | null) => void;
  isTimerRunning: boolean;
  isWorkCycle: boolean;
}

export function PomodoroTaskSelector({
  linkedTaskId,
  onSelectTask,
  isTimerRunning,
  isWorkCycle,
}: PomodoroTaskSelectorProps) {
  const { user } = useAuth();
  const uid = user ? String(user.id) : "";
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  // Referência ao timestamp de quando o timer de foco começou neste componente
  const timerStartRef = useRef<number | null>(null);
  const baseSecondsRef = useRef<number>(0);

  const color = getModuleColor("pomodoro");
  const _theme = getColorTheme(color);

  // Carrega tarefas pendentes do usuário
  const fetchTasks = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const res = await invoke<Task[]>("tasks_list", { userId: uid });
      const pending = res.filter((t) => !t.completed);
      setTasks(pending);

      if (linkedTaskId) {
        const found = res.find((t) => t.id === linkedTaskId);
        if (found) setCurrentTask(found);
      }
    } catch (e) {
      console.error("Erro ao buscar tarefas para o Pomodoro:", e);
    } finally {
      setLoading(false);
    }
  }, [uid, linkedTaskId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Quando o timer de foco inicia, salva o timestamp e o valor base de segundos
  useEffect(() => {
    if (isTimerRunning && isWorkCycle && currentTask) {
      timerStartRef.current = Date.now();
      baseSecondsRef.current = currentTask.timeSpentSeconds || 0;
    } else {
      timerStartRef.current = null;
    }
  }, [isTimerRunning, isWorkCycle, currentTask?.id, currentTask]);

  // Atualização em tempo real: incremento suave a cada segundo baseado no timestamp de início
  useEffect(() => {
    if (!isTimerRunning || !isWorkCycle || !currentTask) return;

    const interval = setInterval(() => {
      if (timerStartRef.current === null) return;
      const elapsed = Math.floor((Date.now() - timerStartRef.current) / 1000);
      setCurrentTask((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          timeSpentSeconds: baseSecondsRef.current + elapsed,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, isWorkCycle, currentTask?.id, currentTask]);

  // Escuta sincronizações com o backend
  useEffect(() => {
    // task-time-updated: realinha a base do contador local sem alterar o valor exibido
    // (o timer local já incrementou esses segundos, então apenas sincronizamos o ponto de referência)
    const handleTimeUpdated = (e: Event) => {
      const ev = e as CustomEvent<{ taskId?: number; seconds?: number }>;
      if (ev.detail?.taskId && ev.detail.taskId === linkedTaskId) {
        // Realinha o timestamp de referência sem alterar timeSpentSeconds (evita double-count)
        setCurrentTask((prev) => {
          if (!prev) return null;
          baseSecondsRef.current = prev.timeSpentSeconds || 0;
          if (timerStartRef.current !== null) {
            timerStartRef.current = Date.now();
          }
          return prev; // sem alterar o valor exibido
        });
      }
    };

    // task-updated: recarrega dados estruturais (ex: título, conclusão)
    const handleTaskUpdated = (e: Event) => {
      const ev = e as CustomEvent<{ taskId?: number }>;
      if (!ev.detail?.taskId || ev.detail.taskId === linkedTaskId) {
        fetchTasks();
      }
    };

    window.addEventListener("task-time-updated", handleTimeUpdated);
    window.addEventListener("task-updated", handleTaskUpdated);
    return () => {
      window.removeEventListener("task-time-updated", handleTimeUpdated);
      window.removeEventListener("task-updated", handleTaskUpdated);
    };
  }, [linkedTaskId, fetchTasks]);

  const handleChoose = (task: Task) => {
    setCurrentTask(task);
    onSelectTask(task);
    setIsOpen(false);
    toast.success(`Tarefa "${task.title}" vinculada ao Pomodoro`);
  };

  const handleUnlink = () => {
    setCurrentTask(null);
    onSelectTask(null);
    toast.info("Tarefa desvinculada do Pomodoro");
  };

  const handleCompleteTask = async () => {
    if (!currentTask?.id) return;
    try {
      await invoke("tasks_toggle", { id: currentTask.id, completed: true });
      toast.success(`Tarefa "${currentTask.title}" concluída com sucesso!`);
      setCurrentTask(null);
      onSelectTask(null);
      fetchTasks();
    } catch {
      toast.error("Erro ao concluir tarefa");
    }
  };

  const filteredTasks = tasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="w-full max-w-md flex flex-col items-center">
      {currentTask ? (
        <div className="w-full bg-card/60 border border-border/70 rounded-2xl p-3.5 flex items-center justify-between gap-3 transition-all">
          <div className="flex items-center gap-3 min-w-0">
            {/* Botão de Concluir Tarefa */}
            <button
              type="button"
              onClick={handleCompleteTask}
              title="Marcar tarefa como concluída"
              className="shrink-0 w-6 h-6 rounded-lg border border-border/80 flex items-center justify-center hover:bg-emerald-500/10 hover:border-emerald-500/40 hover:text-emerald-500 text-muted-foreground transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
            </button>

            {/* Informações da Tarefa */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground truncate">
                  {currentTask.title}
                </span>
                {isTimerRunning && isWorkCycle && (
                  <span
                    className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"
                    title="Tempo sendo computado"
                  />
                )}
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">
                {currentTask.timeSpentSeconds &&
                currentTask.timeSpentSeconds > 0
                  ? `Tempo investido: ${formatTime(currentTask.timeSpentSeconds)}`
                  : "Nenhum tempo investido ainda"}
              </span>
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(true)}
              className="h-8 text-xs font-medium text-muted-foreground hover:text-foreground px-2.5 rounded-lg"
            >
              Trocar
            </Button>
            <button
              type="button"
              onClick={handleUnlink}
              title="Desvincular tarefa"
              className="p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            fetchTasks();
            setIsOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-border/80 bg-muted/20 hover:bg-muted/40 hover:border-border text-muted-foreground hover:text-foreground text-xs font-medium transition-all cursor-pointer"
        >
          <ListTodo className="w-4 h-4 text-muted-foreground" />
          <span>Vincular tarefa em andamento</span>
        </button>
      )}

      {/* Modal de Seleção de Tarefas */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md p-6 bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-primary" /> Selecionar Tarefa
              para Foco
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 mt-2">
            <Input
              type="text"
              placeholder="Pesquisar tarefas pendentes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 text-xs"
            />

            <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
              {loading ? (
                <div className="p-6 text-center text-xs text-muted-foreground animate-pulse">
                  Carregando tarefas...
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  Nenhuma tarefa pendente encontrada.
                </div>
              ) : (
                filteredTasks.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleChoose(t)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 group cursor-pointer",
                      currentTask?.id === t.id
                        ? "border-primary/50 bg-primary/5"
                        : "border-border/60 hover:border-border bg-card/40 hover:bg-card",
                    )}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {t.title}
                      </span>
                      {t.timeSpentSeconds && t.timeSpentSeconds > 0 ? (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {formatTime(t.timeSpentSeconds)} investidos
                        </span>
                      ) : null}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
