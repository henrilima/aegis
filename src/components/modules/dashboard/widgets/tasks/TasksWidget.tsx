"use client";

import { CheckCircle2, Circle, ListTodo, Plus, Trash2 } from "lucide-react";
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
        <div className="flex flex-col gap-[4cqw] @sm:gap-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-[4cqw] @sm:gap-4">
              <div className="text-left">
                <p className="text-2xl @sm:text-3xl font-bold text-foreground leading-none">
                  {pendingTasks.length}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground mt-1">
                  Pendentes
                </p>
              </div>
            </div>{" "}
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
                <span className="hidden @sm:inline">Nova tarefa</span>
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {pendingTasks
              .sort((a, b) => (b.priority || 0) - (a.priority || 0))
              .slice(0, limit ?? 3)
              .map((task) => {
                const styles = resolveTaskStyles(task.color, task.completed);

                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-[2.5cqw] @sm:p-2.5 rounded-xl border border-neutral-200/60 dark:border-border/40 bg-neutral-100 dark:bg-neutral-900/10 hover:bg-neutral-200/50 dark:hover:bg-neutral-900/20 hover:border-neutral-300/60 dark:hover:border-border/60 transition-all gap-4 group w-full cursor-default text-left focus:outline-none"
                    style={
                      {
                        borderColor: styles.borderColor || undefined,
                      } as React.CSSProperties
                    }
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {isInteractive ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleTask?.(task);
                          }}
                          className={cn(
                            "shrink-0 p-2 rounded-xl bg-neutral-200 dark:bg-neutral-900/40 border border-neutral-300/40 dark:border-border/30 transition-all active:scale-95",
                            task.completed
                              ? "opacity-60"
                              : "hover:bg-neutral-300 dark:hover:bg-neutral-900/60",
                          )}
                          style={
                            {
                              borderColor: styles.borderColor || undefined,
                            } as React.CSSProperties
                          }
                        >
                          {task.completed ? (
                            <CheckCircle2
                              className="w-4 h-4"
                              style={{ color: styles.iconColor }}
                            />
                          ) : (
                            <Circle
                              className="w-4 h-4 transition-colors text-zinc-650 dark:text-zinc-500 hover:text-foreground"
                              style={{ color: styles.iconColorMuted }}
                            />
                          )}
                        </button>
                      ) : (
                        <div
                          className="shrink-0 p-2 rounded-xl bg-neutral-200 dark:bg-neutral-900/40 border border-neutral-300/40 dark:border-border/30 opacity-60"
                          style={
                            {
                              borderColor: styles.borderColor || undefined,
                            } as React.CSSProperties
                          }
                        >
                          {task.completed ? (
                            <CheckCircle2
                              className="w-4 h-4"
                              style={{ color: styles.iconColor }}
                            />
                          ) : (
                            <Circle
                              className="w-4 h-4"
                              style={{ color: styles.iconColorMuted }}
                            />
                          )}
                        </div>
                      )}

                      <div className="flex flex-col min-w-0 flex-1">
                        <span
                          className={cn(
                            "text-sm font-bold text-foreground truncate",
                            task.completed &&
                              "text-muted-foreground/60 line-through",
                          )}
                        >
                          {task.title}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-500/80 mt-0.5">
                          {task.category ||
                            (task.completed ? "Concluída" : "Tarefa pendente")}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {task.priority !== undefined && task.priority > 0 && (
                        <div
                          className="shrink-0 flex flex-col items-start justify-center px-3 py-1.5 rounded-xl bg-neutral-200/70 dark:bg-neutral-900/30 border border-neutral-300/40 dark:border-border/30 min-w-[48px] text-left"
                          style={
                            {
                              borderColor: styles.borderColor || undefined,
                            } as React.CSSProperties
                          }
                        >
                          <span
                            className="block text-xs font-bold leading-none"
                            style={{ color: styles.iconColor }}
                          >
                            P{task.priority}
                          </span>
                          <span className="text-[9px] font-semibold text-neutral-500 dark:text-neutral-400 block mt-1">
                            Prioridade
                          </span>
                        </div>
                      )}

                      {isInteractive && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTask?.(task);
                          }}
                          className="p-1.5 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 rounded-md shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            {pendingTasks.length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                Nenhuma tarefa pendente
              </p>
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
