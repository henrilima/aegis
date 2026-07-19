"use client";

import {
  CheckCircle2,
  Circle,
  Flag,
  Hash,
  ListTodo,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { resolveTaskStyles } from "@/colors.config";
import { TaskCreateModal } from "@/components/modules/tasks/components/modals/TaskCreateModal";
import { Button } from "@/components/ui/button";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { Task } from "../../../tasks/types";
import { BaseWidget } from "../BaseWidget";

interface TasksWidgetProps {
  tasks: Task[];
  onToggleTask?: (task: Task) => void;
  onAddTask?: (
    title: string,
    priority?: number,
    category?: string,
    color?: string,
  ) => void;
  onDeleteTask?: (task: Task) => void;
  limit?: number;
  isEditMode?: boolean;
  isInteractive?: boolean;
  onToggleInteractive?: () => void;
}

const priorityBadgeStyles = [
  "",
  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
];

const priorityLabels = ["", "Baixa", "Média", "Alta"];

export function TasksWidget({
  tasks,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  limit,
  isEditMode,
  isInteractive,
  onToggleInteractive,
}: TasksWidgetProps) {
  const moduleColor = getModuleColor("tasks");
  const theme = getColorTheme(moduleColor);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const pendingTasks = tasks.filter(
    (t) =>
      !t.completed && (!t.parentId || !tasks.some((p) => p.id === t.parentId)),
  );

  const rootTasks = tasks.filter(
    (t) => !t.parentId || !tasks.some((p) => p.id === t.parentId),
  );
  const totalCount = rootTasks.length;
  const completedCount = rootTasks.filter((t) => t.completed).length;
  const progressPct =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <>
      <BaseWidget
        title="Lista de Tarefas"
        icon={ListTodo}
        color={moduleColor}
        route="tasks"
        isEditMode={isEditMode}
        isInteractive={isInteractive}
        onToggleInteractive={onToggleInteractive}
      >
        <div className="flex flex-col gap-3">
          {/* Header de progresso / ações */}
          <div className="flex flex-col gap-2.5 mb-1.5">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-foreground leading-none">
                    {pendingTasks.length}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    pendentes
                  </span>
                </div>
                <p className="text-[10px] font-bold text-muted-foreground mt-0.5">
                  {totalCount > 0
                    ? `${completedCount} de ${totalCount} concluídas (${progressPct}%)`
                    : "Sem tarefas cadastradas"}
                </p>
              </div>

              {isInteractive && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    setIsModalOpen(true);
                  }}
                  className={cn(
                    "h-7 px-2.5 text-xs font-bold rounded-lg border-none gap-1 active:scale-95 transition-all text-white",
                    theme.solid,
                    theme.solidHover,
                  )}
                >
                  <Plus className="w-3 h-3" />
                  <span>Nova tarefa</span>
                </Button>
              )}
            </div>

            {totalCount > 0 && (
              <div className="w-full bg-muted/40 h-1 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-500 rounded-full",
                    theme.solid,
                  )}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            )}
          </div>

          {/* Lista de tarefas */}
          <div className="space-y-2">
            {pendingTasks
              .sort((a, b) => (b.priority || 0) - (a.priority || 0))
              .slice(0, limit ?? 3)
              .map((task) => {
                const styles = resolveTaskStyles(task.color, task.completed);

                return (
                  <div
                    key={task.id}
                    className={cn(
                      "group flex items-center justify-between gap-3 bg-card border border-border transition-all rounded-xl relative overflow-hidden p-3 text-sm cursor-default text-left focus:outline-none",
                      task.completed
                        ? "opacity-60 grayscale-[0.5]"
                        : "hover:bg-muted/30",
                    )}
                  >
                    {/* Faixa de cor lateral se definida */}
                    {task.color && (
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                        style={{ backgroundColor: styles.iconColor }}
                      />
                    )}

                    <div className="flex items-center gap-3 min-w-0 flex-1 pl-1">
                      {isInteractive ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleTask?.(task);
                          }}
                          className="shrink-0 transition-transform active:scale-90"
                        >
                          {task.completed ? (
                            <CheckCircle2
                              className={cn(
                                "w-4.5 h-4.5",
                                task.color
                                  ? ""
                                  : "text-red-500 dark:text-red-400",
                              )}
                              style={
                                task.color
                                  ? { color: styles.iconColor }
                                  : undefined
                              }
                            />
                          ) : (
                            <Circle
                              className={cn(
                                "w-4.5 h-4.5 transition-colors group-hover:scale-110",
                                task.color
                                  ? ""
                                  : "text-muted-foreground/50 hover:text-red-500/80 dark:hover:text-red-400/80",
                              )}
                              style={
                                task.color
                                  ? { color: styles.iconColorMuted }
                                  : undefined
                              }
                            />
                          )}
                        </button>
                      ) : (
                        <div className="shrink-0 opacity-60">
                          {task.completed ? (
                            <CheckCircle2
                              className={cn(
                                "w-4.5 h-4.5",
                                task.color
                                  ? ""
                                  : "text-red-500 dark:text-red-400",
                              )}
                              style={
                                task.color
                                  ? { color: styles.iconColor }
                                  : undefined
                              }
                            />
                          ) : (
                            <Circle
                              className={cn(
                                "w-4.5 h-4.5",
                                task.color ? "" : "text-muted-foreground/50",
                              )}
                              style={
                                task.color
                                  ? { color: styles.iconColorMuted }
                                  : undefined
                              }
                            />
                          )}
                        </div>
                      )}

                      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                        <span
                          className={cn(
                            "font-medium transition-all truncate text-sm text-foreground",
                            task.completed &&
                              "line-through text-muted-foreground/60",
                          )}
                        >
                          {task.title}
                        </span>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {Number(task.priority) > 0 && (
                            <div
                              className={cn(
                                "flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-bold capitalize shrink-0",
                                priorityBadgeStyles[task.priority ?? 0],
                              )}
                            >
                              <Flag className="w-2.5 h-2.5 shrink-0" />
                              <span>{priorityLabels[task.priority ?? 0]}</span>
                            </div>
                          )}
                          {task.category && (
                            <div
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold capitalize border shrink-0"
                              style={{
                                backgroundColor: styles.badgeBg,
                                borderColor: styles.badgeBorder.replace(
                                  "1px solid ",
                                  "",
                                ),
                              }}
                            >
                              <Hash
                                className={cn(
                                  "w-2.5 h-2.5",
                                  task.color ? "" : "text-muted-foreground/70",
                                )}
                                style={{
                                  color: task.color
                                    ? styles.iconColor
                                    : undefined,
                                }}
                              />
                              <span
                                className={cn(
                                  task.color ? "" : "text-muted-foreground/70",
                                )}
                                style={{
                                  color: task.color
                                    ? styles.iconColor
                                    : undefined,
                                }}
                              >
                                {task.category}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {isInteractive && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTask?.(task);
                        }}
                        className="p-1.5 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 rounded-md shrink-0 self-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            {pendingTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <p className="text-xs text-neutral-600 font-bold">
                  Tudo em Dia
                </p>
                <p className="text-[10px] text-neutral-600 font-medium max-w-[180px] mt-1">
                  Todas as suas tarefas pendentes foram concluídas.
                </p>
              </div>
            )}
          </div>
        </div>
      </BaseWidget>

      <TaskCreateModal
        isOpen={isModalOpen}
        onAdd={(title, priority, category, color) => {
          onAddTask?.(title, priority, category, color);
          setIsModalOpen(false);
        }}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
