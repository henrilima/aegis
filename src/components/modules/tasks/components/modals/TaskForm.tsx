"use client";

import { Calendar, Repeat } from "lucide-react";
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
  defaultPriority?: number;
  onSave: (
    title: string,
    priority: number,
    category: string,
    color?: string,
    recurrence?: "none" | "daily" | "weekly" | "monthly",
    dueDate?: string,
  ) => void;
  onCancel: () => void;
}

export function TaskForm({ task, defaultPriority = 0, onSave }: TaskFormProps) {
  const colorModule = getModuleColor("tasks");
  const theme = getColorTheme(colorModule);

  const [title, setTitle] = useState(task?.title ?? "");
  const [priority, setPriority] = useState(
    task?.priority ?? defaultPriority ?? 0,
  );
  const [category, setCategory] = useState(task?.category ?? "");
  const [color, setColor] = useState(task?.color ?? "");
  const [recurrence, setRecurrence] = useState<
    "none" | "daily" | "weekly" | "monthly"
  >(task?.recurrence ?? "none");
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setPriority(task.priority ?? 0);
      setCategory(task.category ?? "");
      setColor(task.color ?? "");
      setRecurrence(task.recurrence ?? "none");
      setDueDate(task.dueDate ?? "");
    } else if (defaultPriority !== undefined) {
      setPriority(defaultPriority);
    }
  }, [task, defaultPriority]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("O título da tarefa é obrigatório");
      return;
    }
    onSave(
      title.trim(),
      priority,
      category.trim(),
      color,
      recurrence,
      dueDate || undefined,
    );
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
        {/* Linha 1: Título */}
        <div className="space-y-2 w-full">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Coluna Esquerda: Categoria, Data e Recorrência */}
          <div className="flex flex-col gap-5">
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

            <div className="space-y-2">
              <Label
                htmlFor="task-due-date"
                className={cn(labelClass, "flex items-center gap-1.5")}
              >
                <Calendar className="w-3 h-3 text-muted-foreground" />
                Data de vencimento
              </Label>
              <Input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputStyle}
              />
            </div>

            <div className="space-y-2">
              <Label className={cn(labelClass, "flex items-center gap-1.5")}>
                <Repeat className="w-3 h-3 text-muted-foreground" />
                Recorrência automática
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: "none", label: "Nenhuma" },
                  { val: "daily", label: "Diária" },
                  { val: "weekly", label: "Semanal" },
                  { val: "monthly", label: "Mensal" },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() =>
                      setRecurrence(
                        item.val as "none" | "daily" | "weekly" | "monthly",
                      )
                    }
                    className={cn(
                      "py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border text-center",
                      recurrence === item.val
                        ? cn(
                            theme.bg,
                            theme.border,
                            theme.text,
                            "border-primary/40",
                          )
                        : "bg-card/50 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">
                {recurrence === "none"
                  ? "A tarefa será finalizada normalmente ao ser concluída."
                  : "Ao ser concluída, a data será recalculada automaticamente para o próximo ciclo."}
              </p>
            </div>
          </div>

          {/* Coluna Direita: Prioridade e Cor */}
          <div className="flex flex-col gap-5">
            <div className="space-y-3">
              <Label className={labelClass}>Nível de Prioridade</Label>
              <div className="flex gap-1 p-1 bg-background border border-border rounded-xl">
                {[
                  { val: 0, label: "Nenhuma", color: "text-muted-foreground" },
                  { val: 1, label: "Baixa", color: "text-blue-500" },
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
                  ? "Sem prioridade (Quadrante secundário)"
                  : `Prioridade ${["", "Baixa (Delegar)", "Média (Planejar)", "Alta (Fazer primeiro)"][priority]}`}
              </p>
            </div>

            <div className="w-full space-y-2">
              <Label className={labelClass}>Cor da tag</Label>
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
