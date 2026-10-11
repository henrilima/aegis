"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  CheckCircle2,
  CheckSquare,
  Link2,
  Plus,
  Search,
  Unlink,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatDueDate, type Task } from "@/components/modules/tasks/types";
import { Input } from "@/components/ui/input";
import { ModalShell } from "@/components/ui/ModalShell";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { HabitMilestone } from "../../types";

interface MilestoneTaskModalProps {
  milestone: HabitMilestone;
  userId: string;
  onRefresh: () => void;
  onClose: () => void;
}

export function MilestoneTaskModal({
  milestone,
  userId,
  onRefresh,
  onClose,
}: MilestoneTaskModalProps) {
  const theme = getColorTheme(getModuleColor("habits"));

  const [activeTab, setActiveTab] = useState<"create" | "link">("create");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [search, setSearch] = useState("");

  // Formulário para criar nova tarefa
  const [newTaskTitle, setNewTaskTitle] = useState(milestone.title);
  const [newTaskDueDate, setNewTaskDueDate] = useState(milestone.dueDate || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carrega tarefas existentes
  useEffect(() => {
    async function loadTasks() {
      if (!userId) return;
      setLoadingTasks(true);
      try {
        const res = await invoke<Task[]>("tasks_list", { userId });
        setTasks(res);
      } catch (err) {
        console.error("Erro ao carregar tarefas:", err);
      } finally {
        setLoadingTasks(false);
      }
    }
    loadTasks();
  }, [userId]);

  // Cria nova tarefa e vincula ao marco
  const handleCreateAndLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      toast.error("Informe o título da tarefa.");
      return;
    }
    if (!milestone.id) {
      toast.error("Marco inválido.");
      return;
    }

    setIsSubmitting(true);
    try {
      await invoke("habit_create_task_for_milestone", {
        milestoneId: milestone.id,
        userId,
        taskTitle: newTaskTitle.trim(),
        dueDate: newTaskDueDate ? newTaskDueDate : null,
      });

      toast.success("Tarefa criada e conectada ao marco com sucesso!");
      onRefresh();
      onClose();
    } catch (err) {
      toast.error(`Erro ao criar tarefa: ${err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Vincula tarefa existente
  const handleLinkExisting = async (taskId: number) => {
    if (!milestone.id) return;
    setIsSubmitting(true);
    try {
      await invoke("habit_link_milestone_task", {
        milestoneId: milestone.id,
        taskId,
      });

      toast.success("Tarefa vinculada com sucesso!");
      onRefresh();
      onClose();
    } catch (err) {
      toast.error(`Erro ao vincular tarefa: ${err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Desvincula tarefa
  const handleUnlink = async () => {
    if (!milestone.id) return;
    setIsSubmitting(true);
    try {
      await invoke("habit_link_milestone_task", {
        milestoneId: milestone.id,
        taskId: null,
      });

      toast.info("Tarefa desvinculada do marco.");
      onRefresh();
      onClose();
    } catch (err) {
      toast.error(`Erro ao desvincular: ${err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (!search.trim()) return true;
    return t.title.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <ModalShell isOpen onClose={onClose} size="md">
      <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div
              className={cn("p-2 rounded-lg border", theme.bg, theme.border)}
            >
              <CheckSquare className={cn("w-5 h-5", theme.text)} />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Conectar ao módulo de tarefas
              </h2>
              <p className="text-xs text-muted-foreground truncate max-w-sm">
                Marco:{" "}
                <strong className="text-foreground">"{milestone.title}"</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status atual se já conectado */}
        {milestone.taskId && (
          <div className="mx-5 mt-4 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-emerald-500" />
              <div>
                <p className="text-xs font-bold text-emerald-500">
                  Conectado à tarefa #{milestone.taskId}
                </p>
                {milestone.taskTitle && (
                  <p className="text-xs text-muted-foreground">
                    "{milestone.taskTitle}"{" "}
                    {milestone.taskCompleted ? "• Concluída" : "• Pendente"}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleUnlink}
              disabled={isSubmitting}
              className="px-2.5 py-1 rounded-md text-xs font-semibold text-destructive hover:bg-destructive/10 border border-destructive/20 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Unlink className="w-3.5 h-3.5" /> Desvincular
            </button>
          </div>
        )}

        {/* Abas: Criar nova vs Vincular existente */}
        <div className="px-5 pt-4">
          <div className="flex p-1 bg-background border border-border rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab("create")}
              className={cn(
                "flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5",
                activeTab === "create"
                  ? cn(theme.solid, "text-white font-bold")
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Plus className="w-3.5 h-3.5" /> Criar nova tarefa
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("link")}
              className={cn(
                "flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5",
                activeTab === "link"
                  ? cn(theme.solid, "text-white font-bold")
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Link2 className="w-3.5 h-3.5" /> Vincular existente
            </button>
          </div>
        </div>

        {/* Aba 1: Criar nova tarefa */}
        {activeTab === "create" ? (
          <form onSubmit={handleCreateAndLink} className="p-5 space-y-4">
            <div>
              <label
                htmlFor="milestone-task-title"
                className="block text-xs font-semibold text-foreground mb-1.5"
              >
                Título da tarefa *
              </label>
              <Input
                id="milestone-task-title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Ex: Concluir capítulos 1 a 3 do manual"
                required
                className="bg-background border-border text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="milestone-task-due-date"
                className="block text-xs font-semibold text-foreground mb-1.5"
              >
                Data de vencimento (opcional)
              </label>
              <Input
                id="milestone-task-due-date"
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="bg-background border-border text-sm"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "w-full py-2.5 rounded-lg text-xs font-bold text-white transition-colors cursor-pointer flex items-center justify-center gap-2",
                  theme.solid,
                  isSubmitting && "opacity-50 cursor-not-allowed",
                )}
              >
                {isSubmitting ? (
                  "Criando e conectando..."
                ) : (
                  <>
                    <CheckSquare className="w-4 h-4" /> Criar tarefa e vincular
                    marco
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Aba 2: Vincular tarefa existente */
          <div className="p-5 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar tarefa por título..."
                className="pl-9 bg-background border-border text-xs h-9"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1 border border-border rounded-lg p-1 bg-background/50">
              {loadingTasks ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  Carregando tarefas...
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  Nenhuma tarefa encontrada.
                </div>
              ) : (
                filteredTasks.map((t) => {
                  const isLinked = milestone.taskId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => t.id && handleLinkExisting(t.id)}
                      disabled={isSubmitting || isLinked}
                      className={cn(
                        "w-full p-2.5 rounded-md border text-left transition-colors flex items-center justify-between text-xs cursor-pointer",
                        isLinked
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 font-bold"
                          : "bg-card border-border hover:bg-muted/50 text-foreground",
                      )}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            t.completed ? "bg-emerald-500" : "bg-neutral-400",
                          )}
                        />
                        <span className="truncate">{t.title}</span>
                        {t.dueDate && (
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            ({formatDueDate(t.dueDate)})
                          </span>
                        )}
                      </div>
                      {isLinked ? (
                        <span className="text-xs font-semibold shrink-0 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Atual
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-primary shrink-0">
                          Vincular
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
