"use client";

import { Circle, ListTodo } from "lucide-react";
import type { Task } from "../../../tasks/types";
import { BaseWidget } from "../BaseWidget";

interface TasksWidgetProps {
  tasks: Task[];
  onToggleTask: (task: Task) => void;
  isEditMode?: boolean;
}

export function TasksWidget({
  tasks,
  onToggleTask,
  isEditMode,
}: TasksWidgetProps) {
  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  return (
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
        </div>

        <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
          {pendingTasks.slice(0, 4).map((t) => (
            <div
              key={t.id}
              className="group flex items-start gap-[2.5cqw] @sm:gap-3 p-[3cqw] @sm:p-3 rounded-xl bg-muted/50 border border-border/50 hover:border-border transition-colors"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleTask(t);
                }}
                className="mt-0.5 shrink-0 hover:scale-110 transition-transform"
              >
                <Circle className="w-[3.5cqw] h-[3.5cqw] @sm:w-4 @sm:h-4 text-muted-foreground group-hover:text-red-500 transition-colors" />
              </button>
              <span className="text-[3.5cqw] @sm:text-sm font-medium text-muted-foreground flex-1 leading-tight line-clamp-2">
                {t.title}
              </span>
            </div>
          ))}

          {pendingTasks.length === 0 && (
            <div className="h-full flex items-center justify-center pt-4">
              <p className="text-xs text-muted-foreground italic">
                Nenhuma tarefa pendente
              </p>
            </div>
          )}
        </div>
      </div>
    </BaseWidget>
  );
}
