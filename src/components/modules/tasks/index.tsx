"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  CheckCircle2,
  Circle,
  Flag,
  Hash,
  HelpCircle,
  Kanban,
  ListTodo,
  Pencil,
  Plus,
  Subtitles,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { resolveTaskStyles } from "@/colors.config";
import { ModuleHeader, type ModuleTab } from "@/components/global/ModuleHeader";
import { CardSkeletonGrid } from "@/components/ui/CardSkeletonGrid";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { useAuth } from "@/context/AuthContext";
import { useTime } from "@/context/TimeContext";
import { cn } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import { KanbanView } from "./components/KanbanView";
import { TaskCreateModal } from "./components/modals/TaskCreateModal";
import { TasksGuidePanel, TasksInfoModal } from "./components/TasksInfoModal";
import { TaskTimer } from "./components/TaskTimer";
import type { Task } from "./types";

/** Chave no localStorage para lembrar o modo de visualização preferido */
const VIEW_MODE_KEY = "tasks_view_mode";

const TASK_TABS: ModuleTab[] = [
  { id: "list", label: "Lista", icon: ListTodo },
  { id: "kanban", label: "Kanban", icon: Kanban },
];

export default function TasksPage() {
  const { user } = useAuth();
  const { now } = useTime();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<
    number | undefined
  >();
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [taskToConfirm, setTaskToConfirm] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  // Modo de visualização: "list" | "kanban"
  const [viewMode, setViewMode] = useState<"list" | "kanban">(() => {
    if (typeof window !== "undefined") {
      return (
        (localStorage.getItem(VIEW_MODE_KEY) as "list" | "kanban") ?? "list"
      );
    }
    return "list";
  });

  // Id da tarefa com cronômetro ativo — gerenciado pelo context global
  // (persiste entre módulos enquanto o app estiver aberto)
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

  // Persiste o modo de visualização no localStorage ao mudar
  const handleViewModeChange = (mode: "list" | "kanban") => {
    setViewMode(mode);
    localStorage.setItem(VIEW_MODE_KEY, mode);
  };

  // Callback para atualizar o timeSpentSeconds de uma tarefa localmente
  const handleTimeSaved = (taskId: number, newTotal: number) => {
    setTasks((current) =>
      current.map((t) =>
        t.id === taskId ? { ...t, timeSpentSeconds: newTotal } : t,
      ),
    );
  };

  // Callback para atualizar o status do kanban localmente (sem reload completo)
  const handleStatusChange = (
    taskId: number,
    status: "todo" | "doing" | "done",
  ) => {
    setTasks((current) =>
      current.map((t) =>
        t.id === taskId ? { ...t, status, completed: status === "done" } : t,
      ),
    );
  };

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

  const priorityBadgeStyles = [
    "",
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  ];

  const priorityLabels = ["", "Baixa", "Média", "Alta"];

  const rootTasks = tasks
    .filter((t) => !t.parentId || !tasks.some((p) => p.id === t.parentId))
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));

  const filteredRootTasks = rootTasks.filter((t) => {
    if (filter === "pending") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

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
            "group flex items-center justify-between gap-3 bg-card border border-border transition-all rounded-xl relative overflow-hidden",
            task.completed ? "opacity-60 grayscale-[0.5]" : "hover:bg-muted/30",
            isSubtask ? "ml-8 p-3 text-xs" : "p-4 text-sm",
          )}
        >
          {/* Faixa de cor lateral se definida */}
          {task.color && (
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
              style={{ backgroundColor: styles.iconColor }}
            />
          )}

          <div className="flex items-center gap-3 flex-1 overflow-hidden">
            <button
              type="button"
              onClick={() => handleToggle(task)}
              className="shrink-0 transition-transform active:scale-90"
            >
              {task.completed ? (
                <CheckCircle2
                  className={cn(
                    "w-5 h-5",
                    task.color ? "" : "text-red-500 dark:text-red-400",
                  )}
                  style={task.color ? { color: styles.iconColor } : undefined}
                />
              ) : (
                <Circle
                  className={cn(
                    "w-5 h-5 transition-colors group-hover:scale-110",
                    task.color
                      ? ""
                      : "text-muted-foreground/50 hover:text-red-500/80 dark:hover:text-red-400/80",
                  )}
                  style={
                    task.color ? { color: styles.iconColorMuted } : undefined
                  }
                />
              )}
            </button>

            <div className="flex flex-col gap-0.5 overflow-hidden">
              <span
                className={cn(
                  "font-medium transition-all truncate",
                  isSubtask ? "text-xs" : "text-sm",
                  task.completed && "line-through text-muted-foreground",
                )}
              >
                {task.title}
              </span>

              <div className="flex items-center gap-2 flex-wrap">
                {Number(task.priority) > 0 && (
                  <div
                    className={cn(
                      "flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-bold capitalize shrink-0",
                      priorityBadgeStyles[task.priority ?? 0],
                    )}
                  >
                    <Flag className="w-2.5 h-2.5 shrink-0" />
                    <span>{priorityLabels[task.priority ?? 0]}</span>
                  </div>
                )}

                {/* Timer — ao lado da flag de prioridade, antes das tags */}
                {!isSubtask && task.id && (
                  <TaskTimer
                    task={task}
                    onTimeSaved={handleTimeSaved}
                    onStatusChange={handleStatusChange}
                  />
                )}

                {task.category && (
                  <div
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold capitalize border shrink-0"
                    style={{
                      backgroundColor: styles.badgeBg,
                      borderColor: styles.badgeBorder.replace("1px solid ", ""),
                    }}
                  >
                    <Hash
                      className={cn(
                        "w-2.5 h-2.5",
                        task.color ? "" : "text-muted-foreground/70",
                      )}
                      style={{
                        color: task.color ? styles.iconColor : undefined,
                      }}
                    />
                    <span
                      className={cn(
                        task.color ? "" : "text-muted-foreground/70",
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

          {/* Ações de gestão — visíveis apenas no hover */}
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

  if (showInfo) {
    return (
      <div className="w-full h-full flex flex-col gap-6 overflow-auto pb-10 text-foreground">
        <TasksGuidePanel onBack={() => setShowInfo(false)} />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col gap-6 overflow-auto pb-10 text-foreground">
      <ModuleHeader
        color={getModuleColor("tasks")}
        title="Lista de Tarefas"
        subtitle={`${pendingCount} ${pendingCount === 1 ? "tarefa pendente" : "tarefas pendentes"}`}
        icon={ListTodo}
        tabs={TASK_TABS}
        activeTab={viewMode}
        onTabChange={(id) => handleViewModeChange(id as "list" | "kanban")}
        onTitleClick={() => setShowInfo(true)}
        titleHoverIcon={HelpCircle}
        titleTooltip="Visualizar Guia de Tarefas"
        actions={[
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
        <div className="flex flex-col gap-4 pr-2">
          {/* Filtros da visão de lista */}
          {viewMode === "list" && (
            <div className="flex items-center gap-1.5 p-1 bg-muted/30 border border-border/50 rounded-xl max-w-[320px] shrink-0">
              {[
                { id: "all", label: "Todas" },
                { id: "pending", label: "Pendentes" },
                { id: "completed", label: "Concluídas" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    setFilter(tab.id as "all" | "pending" | "completed")
                  }
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none text-center",
                    filter === tab.id
                      ? "bg-card text-foreground border border-border/60"
                      : "text-muted-foreground hover:text-foreground border border-transparent",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* ─── VISÃO KANBAN ─── */}
          {viewMode === "kanban" && (
            <KanbanView
              tasks={tasks}
              onTimeSaved={handleTimeSaved}
              onStatusChange={handleStatusChange}
              onToggle={handleToggle}
              onEdit={(task) => {
                setEditingTask(task);
                setIsModalOpen(true);
              }}
              onDelete={handleDelete}
              onAddSubtask={(parentId) => {
                setSelectedParentId(parentId);
                setIsModalOpen(true);
              }}
              onRefresh={fetchTasks}
            />
          )}

          {/* ─── VISÃO LISTA ─── */}
          {viewMode === "list" &&
            (filteredRootTasks.length === 0 ? (
              <EmptyState
                icon={ListTodo}
                title="Nenhuma tarefa nesta categoria"
                description="Nenhuma tarefa corresponde ao filtro selecionado no momento."
                className="bg-card/20 border border-border rounded-xl p-8"
              />
            ) : (
              <div className="flex flex-col gap-2">
                {filteredRootTasks.map((task, i) => renderTask(task, i))}
              </div>
            ))}
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
