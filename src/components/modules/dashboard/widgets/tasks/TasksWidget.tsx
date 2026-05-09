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
  isEditMode?: boolean;
  isInteractive?: boolean;
}

export function TasksWidget({
  tasks,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  isEditMode,
  isInteractive,
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
        title="Tarefas"
        icon={ListTodo}
        color={moduleColor}
        route="tasks"
        isEditMode={isEditMode}
        isInteractive={isInteractive}
        onToggleInteractive={() => {}}
      >
        <div className="flex flex-col gap-[4cqw] @sm:gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-black text-foreground leading-none">
                  {pendingTasks.length}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
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
              .slice(0, 3)
              .map((task) => {
                const styles = resolveTaskStyles(task.color, task.completed);

                return (
                  <div
                    key={task.id}
                    className={cn(
                      "group w-full flex items-center gap-3 p-3 rounded-xl bg-card border transition-all cursor-default text-left",
                      !task.color && "border-border/50 hover:border-border",
                    )}
                    style={
                      { borderColor: styles.borderColor } as React.CSSProperties
                    }
                  >
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
                            className="w-4 h-4"
                            style={{ color: styles.iconColor }}
                          />
                        ) : (
                          <Circle
                            className="w-4 h-4 transition-colors group-hover:scale-110"
                            style={{ color: styles.iconColorMuted }}
                          />
                        )}
                      </button>
                    ) : (
                      <div className="shrink-0">
                        {task.completed ? (
                          <CheckCircle2
                            className="w-4 h-4 opacity-50"
                            style={{ color: styles.iconColor }}
                          />
                        ) : (
                          <Circle
                            className="w-4 h-4 opacity-50"
                            style={{ color: styles.iconColorMuted }}
                          />
                        )}
                      </div>
                    )}

                    <span
                      className={cn(
                        "text-sm font-medium truncate flex-1 transition-colors",
                        task.completed
                          ? "text-muted-foreground"
                          : "text-muted-foreground group-hover:text-foreground",
                      )}
                    >
                      {task.title}
                    </span>

                    {isInteractive && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTask?.(task);
                        }}
                        className="p-1 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 rounded-md"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
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
