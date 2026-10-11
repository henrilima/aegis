"use client";

import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  MoreVertical,
  Pencil,
  Plus,
  Repeat,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatCompletedAt, formatDueDate, type Task } from "../types";
import { TaskTimer } from "./TaskTimer";

interface EisenhowerMatrixViewProps {
  tasks: Task[];
  onToggleTask: (task: Task) => Promise<void>;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onUpdatePriority: (task: Task, newPriority: number) => Promise<void>;
  onCreateInQuadrant: (defaultPriority: number) => void;
  onTimeSaved?: (taskId: number, newTotal: number) => void;
}

interface QuadrantConfig {
  id: number;
  priority: number;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  borderColor: string;
  bgLight: string;
  icon: React.ComponentType<{ className?: string }>;
}

const QUADRANTS: QuadrantConfig[] = [
  {
    id: 1,
    priority: 3,
    title: "Fazer primeiro",
    subtitle: "Urgente & importante",
    badge: "Crítico",
    badgeColor: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    borderColor: "border-rose-500/30",
    bgLight: "bg-rose-500/5",
    icon: Flame,
  },
  {
    id: 2,
    priority: 2,
    title: "Agendar & planejar",
    subtitle: "Importante & não urgente",
    badge: "Estratégico",
    badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    borderColor: "border-amber-500/30",
    bgLight: "bg-amber-500/5",
    icon: Calendar,
  },
  {
    id: 3,
    priority: 1,
    title: "Delegar ou agilizar",
    subtitle: "Urgente & não importante",
    badge: "Operacional",
    badgeColor: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    borderColor: "border-blue-500/30",
    bgLight: "bg-blue-500/5",
    icon: Clock,
  },
  {
    id: 4,
    priority: 0,
    title: "Eliminar ou secundário",
    subtitle: "Não urgente & não importante",
    badge: "Baixa prioridade",
    badgeColor: "bg-muted text-muted-foreground border-border",
    borderColor: "border-border/60",
    bgLight: "bg-muted/10",
    icon: AlertTriangle,
  },
];

export function EisenhowerMatrixView({
  tasks,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onUpdatePriority,
  onCreateInQuadrant,
  onTimeSaved,
}: EisenhowerMatrixViewProps) {
  // Filtra apenas tarefas principais (sem sub-tarefas para manter a matriz limpa)
  const rootTasks = tasks.filter((t) => !t.parentId);

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
      {QUADRANTS.map((quadrant) => {
        const quadrantTasks = rootTasks.filter(
          (t) => (t.priority ?? 0) === quadrant.priority,
        );
        const IconComponent = quadrant.icon;

        return (
          <div
            key={quadrant.id}
            className={cn(
              "flex flex-col rounded-2xl border bg-card/60 backdrop-blur-xs overflow-hidden transition-all duration-200",
              quadrant.borderColor,
            )}
          >
            {/* Cabeçalho do Quadrante */}
            <div className="flex items-center justify-between p-5 border-b border-border/40 bg-muted/20">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "p-2 rounded-xl border flex items-center justify-center",
                    quadrant.badgeColor,
                  )}
                >
                  <IconComponent className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground">
                      {quadrant.title}
                    </h3>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-bold border",
                        quadrant.badgeColor,
                      )}
                    >
                      {quadrant.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {quadrant.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-lg border border-border/40">
                  {quadrantTasks.length}
                </span>
                <button
                  type="button"
                  onClick={() => onCreateInQuadrant(quadrant.priority)}
                  className="p-1.5 rounded-lg hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all cursor-pointer border border-transparent hover:border-border"
                  title="Adicionar tarefa neste quadrante"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Lista de Tarefas do Quadrante */}
            <div className="flex-1 p-4 space-y-2.5 min-h-45 max-h-90 overflow-y-auto custom-scrollbar">
              {quadrantTasks.length === 0 ? (
                <div className="h-full min-h-35 flex flex-col items-center justify-center text-center p-4 border border-dashed border-border/50 rounded-xl bg-muted/5">
                  <p className="text-xs text-muted-foreground font-medium">
                    Nenhuma tarefa neste quadrante
                  </p>
                  <button
                    type="button"
                    onClick={() => onCreateInQuadrant(quadrant.priority)}
                    className="mt-2 text-[11px] text-primary font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Adicionar tarefa
                  </button>
                </div>
              ) : (
                quadrantTasks.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "p-3.5 rounded-xl border border-border/60 bg-background/80 hover:bg-background transition-all flex items-start justify-between gap-3 group",
                      task.completed && "opacity-60 bg-muted/20",
                    )}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => onToggleTask(task)}
                        className="mt-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-xs font-bold text-foreground truncate",
                            task.completed &&
                              "line-through text-muted-foreground",
                          )}
                        >
                          {task.title}
                        </p>

                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {task.category && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/40">
                              {task.category}
                            </span>
                          )}

                          {task.recurrence && task.recurrence !== "none" && (
                            <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                              <Repeat className="w-2.5 h-2.5" />
                              {task.recurrence === "daily"
                                ? "Diária"
                                : task.recurrence === "weekly"
                                  ? "Semanal"
                                  : "Mensal"}
                            </span>
                          )}

                          {task.dueDate && (
                            <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
                              <Calendar className="w-2.5 h-2.5" />
                              {formatDueDate(task.dueDate)}
                            </span>
                          )}

                          {task.completed && (
                            <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              {task.completedAt
                                ? `Concluída em ${formatCompletedAt(task.completedAt)}`
                                : "Concluída"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <TaskTimer task={task} onTimeSaved={onTimeSaved} />

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-44 rounded-xl"
                        >
                          <DropdownMenuItem
                            onClick={() => onEditTask(task)}
                            className="text-xs gap-2 cursor-pointer font-medium"
                          >
                            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                            Editar tarefa
                          </DropdownMenuItem>

                          <div className="h-px bg-border/50 my-1" />

                          <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground">
                            Mover para quadrante:
                          </div>

                          {QUADRANTS.map((q) => (
                            <DropdownMenuItem
                              key={q.id}
                              disabled={task.priority === q.priority}
                              onClick={() => onUpdatePriority(task, q.priority)}
                              className="text-xs gap-2 cursor-pointer font-medium"
                            >
                              <span
                                className={cn(
                                  "w-2 h-2 rounded-full",
                                  q.id === 1
                                    ? "bg-rose-500"
                                    : q.id === 2
                                      ? "bg-amber-500"
                                      : q.id === 3
                                        ? "bg-blue-500"
                                        : "bg-muted-foreground",
                                )}
                              />
                              {q.title}
                            </DropdownMenuItem>
                          ))}

                          <div className="h-px bg-border/50 my-1" />

                          <DropdownMenuItem
                            onClick={() => onDeleteTask(task)}
                            className="text-xs gap-2 text-red-500 hover:text-red-600 cursor-pointer font-medium"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            Excluir tarefa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
