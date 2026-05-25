"use client";

import { invoke } from "@tauri-apps/api/core";
import { open as openDialog, save } from "@tauri-apps/plugin-dialog";
import {
  CheckCircle2,
  Circle,
  DownloadCloud,
  Flag,
  Hash,
  HelpCircle,
  ListTodo,
  Pencil,
  Plus,
  Subtitles,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { resolveTaskStyles } from "@/colors.config";
import { ModuleHeader } from "@/components/global/ModuleHeader";
import { CardSkeletonGrid } from "@/components/ui/CardSkeletonGrid";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { useAuth } from "@/context/AuthContext";
import { useTime } from "@/context/TimeContext";
import { cn } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import { TaskCreateModal } from "./components/modals/TaskCreateModal";
import { TasksInfoModal } from "./components/TasksInfoModal";
import type { Task } from "./types";

export default function TasksPage() {
  const { user } = useAuth();
  const { now } = useTime();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<
    number | undefined
  >();
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [taskToConfirm, setTaskToConfirm] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const uid = user ? String(user.id) : "";

  const fetchTasks = useCallback(async () => {
    if (!uid) return;
    try {
      const res = await invoke<Task[]>("tasks_list", { userId: uid });
      setTasks(res);
    } catch {
      toast.error("Erro ao carregar tarefas");
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleAddTask = async (
    title: string,
    priority?: number,
    category?: string,
    color?: string,
  ) => {
    if (!uid) return;

    try {
      await invoke("tasks_upsert", {
        task: {
          id: editingTask?.id,
          userId: uid,
          title,
          completed: editingTask?.completed ?? false,
          createdAt: editingTask?.createdAt ?? now.toISOString(),
          priority,
          category,
          color,
          parentId: selectedParentId ?? editingTask?.parentId,
        } satisfies Task,
      });
      setIsModalOpen(false);
      setSelectedParentId(undefined);
      setEditingTask(undefined);
      fetchTasks();
      toast.success(
        editingTask
          ? "Tarefa atualizada!"
          : selectedParentId
            ? "Subtarefa adicionada!"
            : "Tarefa adicionada!",
      );
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Erro ao processar tarefa");
    }
  };

  const handleToggle = async (task: Task, forceConfirmed = false) => {
    if (!task.id) return;
    const newState = !task.completed;

    if (newState && !task.parentId && !forceConfirmed) {
      const subtasks = getSubtasks(task.id);
      const pendingCount = subtasks.filter((s) => !s.completed).length;
      if (pendingCount > 1) {
        setTaskToConfirm(task);
        return;
      }
    }

    setTasks((current) =>
      current.map((t) => {
        if (t.id === task.id) return { ...t, completed: newState };
        if (newState && t.parentId === task.id)
          return { ...t, completed: true };
        return t;
      }),
    );

    try {
      await invoke("tasks_toggle", { id: task.id, completed: newState });

      if (newState) {
        const subtasks = getSubtasks(task.id);
        const pendingSubtasks = subtasks.filter((s) => !s.completed);

        if (pendingSubtasks.length > 0) {
          await Promise.all(
            pendingSubtasks.map((s) =>
              invoke("tasks_toggle", { id: s.id, completed: true }),
            ),
          );
        }
      }

      fetchTasks();
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Erro ao atualizar tarefa");
      fetchTasks();
    }
  };

  const handleDelete = async (task: Task, force = false) => {
    if (!task.id) return;

    if (!force) {
      setTaskToDelete(task);
      return;
    }

    try {
      await invoke("tasks_delete", { id: task.id });
      fetchTasks();
      toast.success("Tarefa removida!");
      setTaskToDelete(null);
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Erro ao remover tarefa");
    }
  };

  const handleExportCSV = async () => {
    try {
      const filePath = await save({
        filters: [{ name: "CSV", extensions: ["csv"] }],
        defaultPath: "aegis_tarefas_backup.csv",
      });

      if (!filePath) return;

      await invoke("export_tasks_csv", { userId: uid, path: filePath });
      toast.success("Exportação de tarefas concluída!");
    } catch (e) {
      toast.error(
        `Falha ao exportar: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  };

  const handleImportCSV = async () => {
    try {
      const filePath = await openDialog({
        multiple: false,
        filters: [{ name: "CSV", extensions: ["csv"] }],
      });
      if (filePath && typeof filePath === "string") {
        const count = await invoke<number>("import_tasks_csv", {
          userId: uid,
          path: filePath,
        });
        toast.success(`${count} tarefas importadas!`);
        await fetchTasks();
      }
    } catch (e) {
      toast.error(
        `Erro ao importar CSV: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  };

  const priorityColors = [
    "text-muted-foreground/40",
    "text-emerald-500",
    "text-amber-500",
    "text-rose-500",
  ];

  const priorityLabels = ["", "Baixa", "Média", "Alta"];

  const rootTasks = tasks
    .filter((t) => !t.parentId || !tasks.some((p) => p.id === t.parentId))
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));

  const getSubtasks = (parentId: number) =>
    tasks
      .filter((t) => t.parentId === parentId)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

  const pendingCount = tasks.filter((t) => !t.completed).length;

  if (loading) {
    return (
      <div className="w-full flex flex-col gap-6">
        <div className="h-20 w-1/3 bg-card animate-pulse rounded-2xl" />
        <CardSkeletonGrid count={6} cardClassName="h-32" />
      </div>
    );
  }

  const renderTask = (task: Task, index: number, isSubtask = false) => {
    const subtasks = task.id ? getSubtasks(task.id) : [];
    const styles = resolveTaskStyles(task.color, task.completed);

    return (
      <div
        key={task.id}
        className="flex flex-col gap-1 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 fill-mode-both"
        style={{ animationDelay: `${index * 40}ms` }}
      >
        <div
          className={cn(
            "group flex items-center justify-between gap-3 p-4 bg-card border transition-all rounded-xl",
            task.completed ? "opacity-60 grayscale-[0.5]" : "hover:bg-muted/30",
            isSubtask && "ml-8",
            !task.color && "border-border",
          )}
          style={
            {
              borderColor: styles.borderColor,
            } as React.CSSProperties
          }
        >
          <div className="flex items-center gap-3 flex-1 overflow-hidden">
            <button
              type="button"
              onClick={() => handleToggle(task)}
              className="shrink-0 transition-transform active:scale-90"
            >
              {task.completed ? (
                <CheckCircle2
                  className="w-5 h-5"
                  style={{ color: styles.iconColor }}
                />
              ) : (
                <Circle
                  className="w-5 h-5 transition-colors group-hover:scale-110"
                  style={{ color: styles.iconColorMuted }}
                />
              )}
            </button>

            <div className="flex flex-col gap-0.5 overflow-hidden">
              <span
                className={cn(
                  "text-sm font-medium transition-all truncate",
                  task.completed && "line-through text-muted-foreground",
                )}
              >
                {task.title}
              </span>

              <div className="flex items-center gap-2">
                {Number(task.priority) > 0 && (
                  <div className="flex items-center gap-1">
                    <Flag
                      className={cn(
                        "w-3 h-3",
                        priorityColors[task.priority ?? 0],
                      )}
                    />
                    <span className="text-[10px] text-muted-foreground font-bold uppercase">
                      {priorityLabels[task.priority ?? 0]}
                    </span>
                  </div>
                )}
                {task.category && (
                  <div
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-md"
                    style={{
                      backgroundColor: styles.badgeBg,
                      border: styles.badgeBorder,
                    }}
                  >
                    <Hash
                      className={cn(
                        "w-2.5 h-2.5",
                        task.color ? "" : "text-muted-foreground",
                      )}
                      style={{
                        color: task.color ? styles.iconColor : undefined,
                      }}
                    />
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase",
                        task.color ? "" : "text-muted-foreground",
                      )}
                      style={{
                        color: task.color ? styles.iconColor : undefined,
                      }}
                    >
                      {task.category}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
            {!isSubtask && !task.completed && (
              <ToolTip content="Adicionar subtarefa">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedParentId(task.id);
                    setIsModalOpen(true);
                  }}
                  className="p-1.5 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  <Subtitles className="w-4 h-4" />
                </button>
              </ToolTip>
            )}
            <ToolTip content="Editar tarefa">
              <button
                type="button"
                onClick={() => {
                  setEditingTask(task);
                  setIsModalOpen(true);
                }}
                className="p-1.5 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </ToolTip>
            <ToolTip content="Remover tarefa">
              <button
                type="button"
                onClick={() => handleDelete(task)}
                className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </ToolTip>
          </div>
        </div>

        {subtasks.length > 0 && (
          <div className="flex flex-col gap-1 mt-1">
            {subtasks.map((st, i) => renderTask(st, i, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col gap-6 overflow-auto pb-10 text-foreground">
      <ModuleHeader
        color={getModuleColor("tasks")}
        title="Lista de Tarefas"
        subtitle={`${pendingCount} ${pendingCount === 1 ? "tarefa pendente" : "tarefas pendentes"}`}
        icon={ListTodo}
        actions={[
          {
            id: "import",
            label: "Importar",
            icon: UploadCloud,
            tooltip: "Importar Tarefas (CSV)",
            onClick: handleImportCSV,
          },
          {
            id: "export",
            label: "Exportar",
            icon: DownloadCloud,
            tooltip: "Exportar Tarefas (CSV)",
            onClick: handleExportCSV,
          },
          {
            id: "info",
            label: "Guia",
            icon: HelpCircle,
            tooltip: "Guia do Módulo",
            onClick: () => setShowInfo(true),
          },
          {
            id: "add",
            label: "Nova Tarefa",
            icon: Plus,
            tooltip: "Criar Nova Tarefa",
            primary: true,
            onClick: () => {
              setSelectedParentId(undefined);
              setEditingTask(undefined);
              setIsModalOpen(true);
            },
          },
        ]}
      />

      {tasks.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="Nenhuma tarefa ainda"
          description="Sua lista está vazia. Comece criando uma nova tarefa para se organizar."
        />
      ) : (
        <div className="flex flex-col gap-2 pr-2">
          {rootTasks.map((task, i) => renderTask(task, i))}
        </div>
      )}

      <TaskCreateModal
        isOpen={isModalOpen}
        task={editingTask}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedParentId(undefined);
          setEditingTask(undefined);
        }}
        onAdd={handleAddTask}
      />

      <TasksInfoModal show={showInfo} onClose={() => setShowInfo(false)} />

      {taskToConfirm && (
        <ConfirmModal
          title="Concluir tudo?"
          description={`Esta tarefa possui ${getSubtasks(taskToConfirm.id ?? 0).filter((s) => !s.completed).length} subtarefas pendentes. Deseja marcar todas como concluídas?`}
          confirmLabel="Sim, concluir tudo"
          cancelLabel="Cancelar"
          variant="default"
          onConfirm={() => {
            const t = taskToConfirm;
            setTaskToConfirm(null);
            handleToggle(t, true);
          }}
          onCancel={() => setTaskToConfirm(null)}
        />
      )}

      {taskToDelete && (
        <ConfirmModal
          title={
            getSubtasks(taskToDelete.id ?? 0).length > 0
              ? "Excluir tarefa e subtarefas?"
              : "Excluir tarefa?"
          }
          description={
            getSubtasks(taskToDelete.id ?? 0).length > 0
              ? `Esta tarefa possui ${getSubtasks(taskToDelete.id ?? 0).length} subtarefas vinculadas. Ao excluí-la, todas as subtarefas também serão removidas permanentemente.`
              : "Deseja remover permanentemente esta tarefa de sua lista?"
          }
          confirmLabel="Excluir"
          cancelLabel="Cancelar"
          variant="danger"
          onConfirm={() => handleDelete(taskToDelete, true)}
          onCancel={() => setTaskToDelete(null)}
        />
      )}
    </div>
  );
}
