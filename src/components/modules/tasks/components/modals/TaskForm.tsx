"use client";

import { ListTodo } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ColorPicker } from "@/components/global/ColorPicker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { Task } from "../../types";

interface TaskFormProps {
  task?: Task;
  onSave: (
    title: string,
    priority: number,
    category: string,
    color?: string,
  ) => void;
  onCancel: () => void;
}

export function TaskForm({ task, onSave }: TaskFormProps) {
  const colorModule = getModuleColor("tasks");
  const theme = getColorTheme(colorModule);

  const [title, setTitle] = useState(task?.title ?? "");
  const [priority, setPriority] = useState(task?.priority ?? 0);
  const [category, setCategory] = useState(task?.category ?? "");
  const [color, setColor] = useState(task?.color ?? "");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setPriority(task.priority ?? 0);
      setCategory(task.category ?? "");
      setColor(task.color ?? "");
    }
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("O título da tarefa é obrigatório");
      return;
    }
    onSave(title.trim(), priority, category.trim(), color);
  };

  const inputStyle = cn(
    "w-full bg-card border-border h-11 rounded-xl text-sm font-medium transition-all placeholder:text-muted-foreground/50",
    theme.borderHover.replace("hover:", "focus:"),
  );
  const labelClass = "text-xs font-medium text-muted-foreground ml-0.5";

  return (
    <form
      id="task-form"
      onSubmit={handleSubmit}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-6">
        {/* Linha 1: Título e Cor */}
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="flex-1 space-y-2 w-full">
            <Label htmlFor="task-title" className={labelClass}>
              O que precisa ser feito?
            </Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Estudar React, Comprar café..."
              className={inputStyle}
              autoFocus
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          {/* Coluna Esquerda: Categoria e Info */}
          <div className="flex flex-col gap-6">
            <div className="space-y-2">
              <Label htmlFor="task-category" className={labelClass}>
                Categoria (opcional)
              </Label>
              <Input
                id="task-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex: Estudos, Trabalho, Pessoal..."
                className={inputStyle}
              />
            </div>

            <div className="p-5 rounded-2xl border border-dashed border-border bg-card/30 flex flex-col items-center justify-center text-center gap-2">
              <div className={cn("p-2 rounded-lg bg-muted/50", theme.text)}>
                <ListTodo className="w-4 h-4" />
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Organize suas tarefas por prioridade e categorias coloridas para
                melhor visualização.
              </p>
            </div>
          </div>

          {/* Coluna Direita: Prioridade */}
          <div className="flex flex-col gap-6">
            <div className="space-y-3">
              <Label className={labelClass}>Nível de Prioridade</Label>
              <div className="flex gap-1 p-1 bg-background border border-border rounded-xl">
                {[
                  { val: 0, label: "Nenhuma", color: "text-muted-foreground" },
                  { val: 1, label: "Baixa", color: "text-emerald-500" },
                  { val: 2, label: "Média", color: "text-amber-500" },
                  { val: 3, label: "Alta", color: "text-rose-500" },
                ].map((p) => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => setPriority(p.val)}
                    className={cn(
                      "flex-1 py-2.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border",
                      priority === p.val
                        ? cn(theme.bg, theme.border, p.color)
                        : "bg-transparent border-transparent text-neutral-600 hover:text-muted-foreground",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <p className="text-center text-[10px] font-bold text-neutral-600 capitalize">
                {priority === 0
                  ? "Sem prioridade definida"
                  : `Prioridade ${["", "Baixa", "Média", "Alta"][priority]}`}
              </p>
            </div>

            <div className="w-full space-y-2">
              <Label className={labelClass}>Cor</Label>
              <ColorPicker
                value={color}
                onChange={setColor}
                placeholder="Padrão"
                defaultColor={getModuleColor("tasks")}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
