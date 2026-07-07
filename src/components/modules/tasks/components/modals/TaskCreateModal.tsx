"use client";

import { ListTodo, X } from "lucide-react";
import { ModalShell } from "@/components/ui/ModalShell";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { Task } from "../../types";
import { TaskForm } from "./TaskForm";

interface TaskCreateModalProps {
  isOpen: boolean;
  task?: Task;
  onAdd: (
    title: string,
    priority: number,
    category: string,
    color?: string,
  ) => void;
  onClose: () => void;
}

/**
 * Modal padronizado para criação e edição de tarefas.
 * Segue o layout global do Aegis com Header, Body rolável e Footer fixo.
 */
export function TaskCreateModal({
  isOpen,
  task,
  onAdd,
  onClose,
}: TaskCreateModalProps) {
  const color = getModuleColor("tasks");
  const theme = getColorTheme(color);

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} size="xl">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between p-6 border-b border-border/60 shrink-0">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-xl border", theme.bg, theme.border)}>
            <ListTodo className={cn("w-5 h-5", theme.text)} />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground leading-none">
              {task ? "Editar Tarefa" : "Nova Tarefa"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Organize suas atividades e metas
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          aria-label="Fechar modal"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Área rolável (Body) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        <TaskForm task={task} onSave={onAdd} onCancel={onClose} />
      </div>

      {/* Rodapé Fixo */}
      <div className="flex flex-col sm:flex-row gap-2 p-6 border-t border-border/60 bg-muted/10 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 flex items-center justify-center p-2.5 rounded-lg border border-border bg-card hover:bg-accent/50 text-muted-foreground text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          form="task-form"
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 p-2.5 rounded-lg text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50",
            theme.solid,
            theme.solidHover,
          )}
        >
          {task ? "Salvar alterações" : "Criar tarefa agora"}
        </button>
      </div>
    </ModalShell>
  );
}
