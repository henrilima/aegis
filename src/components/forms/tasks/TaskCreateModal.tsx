"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TaskCreateModalProps {
  onAdd: (title: string) => void;
  onClose: () => void;
}

export function TaskCreateModal({ onAdd, onClose }: TaskCreateModalProps) {
  const [title, setTitle] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Botão de backdrop (Acessível e Semântico) */}
      <button
        type="button"
        className="absolute inset-0 w-full h-full cursor-default border-none appearance-none bg-transparent"
        onClick={onClose}
        aria-label="Fechar modal"
      />

      {/* Conteúdo do Modal (Estático, sem eventos de clique) */}
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-red-500/10">
              <Plus className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-sm font-bold text-foreground">Nova Tarefa</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="space-y-2">
            <label
              htmlFor="task-title"
              className="text-[10px] font-bold text-muted-foreground uppercase ml-1"
            >
              Título da Tarefa
            </label>
            <Input
              id="task-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Finalizar relatório mensal"
              className="h-11 bg-muted/50 border-border focus-visible:ring-red-500/20"
            />
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-xs font-bold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!title.trim()}
              className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs h-10 px-6 rounded-xl"
            >
              Criar Tarefa
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
