"use client";

import { Circle, ListTodo, Plus } from "lucide-react";
import { useState } from "react";
import { TaskCreateModal } from "@/components/forms/tasks/TaskCreateModal";
import { Button } from "@/components/ui/button";
import type { Task } from "../../../tasks/types";
import { BaseWidget } from "../BaseWidget";

interface TasksWidgetProps {
  tasks: Task[];
  onToggleTask: (task: Task) => void;
  onAddTask?: (title: string) => void;
  isEditMode?: boolean;
}

export function TasksWidget({
  tasks,
  onToggleTask,
  onAddTask,
  isEditMode,
}: TasksWidgetProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  return (
    <>
      <BaseWidget
        title="Tarefas"
        icon={ListTodo}
        iconColor="text-red-600 dark:text-red-400"
        route="tasks"
        isEditMode={isEditMode}
      >
        <div className="flex flex-col gap-[4cqw] @sm:gap-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-[8cqw] @sm:gap-10">
              <div className="text-center">
                <p className="text-2xl @sm:text-3xl font-black text-foreground leading-none">
                  {pendingTasks.length}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">
                  Pendentes
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl @sm:text-3xl font-black text-foreground leading-none">
                  {completedTasks.length}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">
                  Concluídas
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              className="h-7 px-2.5 text-xs bg-red-600 hover:bg-red-500 dark:bg-red-600 dark:hover:bg-red-500 text-white font-bold rounded-lg border-none gap-1 active:scale-95 transition-all"
            >
              <Plus className="w-3 h-3" />
              <span className="hidden @sm:inline">Nova tarefa</span>
            </Button>
          </div>

          <div className="space-y-1.5">
            {pendingTasks.slice(0, 3).map((task) => (
              <button
                key={task.id}
                type="button"
                className="group w-full flex items-start gap-[2.5cqw] @sm:gap-3 p-[3cqw] @sm:p-3 rounded-xl bg-muted/50 border border-border/50 hover:border-border transition-colors cursor-pointer text-left"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleTask(task);
                }}
              >
                <Circle className="w-[3.5cqw] h-[3.5cqw] @sm:w-4 @sm:h-4 text-neutral-600 group-hover:text-red-500 shrink-0 mt-0.5" />
                <span className="text-[3.5cqw] @sm:text-sm font-medium text-muted-foreground truncate flex-1 group-hover:text-foreground transition-colors">
                  {task.title}
                </span>
              </button>
            ))}
            {pendingTasks.length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                Nenhuma tarefa pendente
              </p>
            )}
          </div>
        </div>
      </BaseWidget>

      {isModalOpen && (
        <TaskCreateModal
          onAdd={(title) => {
            onAddTask?.(title);
            setIsModalOpen(false);
          }}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
