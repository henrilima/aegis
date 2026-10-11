"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  Calendar,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  Flag,
  Hash,
  HelpCircle,
  Kanban,
  LayoutGrid,
  ListTodo,
  Pencil,
  Plus,
  Repeat,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useTime } from "@/context/TimeContext";
import { cn } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import { EisenhowerMatrixView } from "./components/EisenhowerMatrixView";
import { KanbanView } from "./components/KanbanView";
import { TaskCreateModal } from "./components/modals/TaskCreateModal";
import { TasksGuidePanel, TasksInfoModal } from "./components/TasksInfoModal";
import { TaskTimer } from "./components/TaskTimer";
import { formatCompletedAt, formatDueDate, type Task } from "./types";

/** Chave no localStorage para lembrar o modo de visualização preferido */
const VIEW_MODE_KEY = "tasks_view_mode";
/** Chave no localStorage para lembrar se tarefas concluídas devem ser ocultadas */
const HIDE_COMPLETED_KEY = "tasks_hide_completed";

const TASK_TABS: ModuleTab[] = [
  { id: "list", label: "Lista", icon: ListTodo },
  { id: "kanban", label: "Kanban", icon: Kanban },
  { id: "eisenhower", label: "Matriz", icon: LayoutGrid },
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
  const [defaultPriority, setDefaultPriority] = useState<number | undefined>(
    undefined,
  );
  const [taskToConfirm, setTaskToConfirm] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  // Configuração para ocultar tarefas já concluídas na visão de lista
  const [hideCompleted, setHideCompleted] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(HIDE_COMPLETED_KEY) === "true";
    }
    return false;
  });

  const toggleHideCompleted = () => {
    setHideCompleted((prev) => {
      const next = !prev;
      localStorage.setItem(HIDE_COMPLETED_KEY, String(next));
      return next;
    });
  };

  // Modo de visualização: "list" | "kanban" | "eisenhower"
  const [viewMode, setViewMode] = useState<"list" | "kanban" | "eisenhower">(
    () => {
      if (typeof window !== "undefined") {
        return (
          (localStorage.getItem(VIEW_MODE_KEY) as
            | "list"
            | "kanban"
            | "eisenhower") ?? "list"
        );
      }
      return "list";
    },
  );

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
  const handleViewModeChange = (mode: "list" | "kanban" | "eisenhower") => {
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
    recurrence?: "none" | "daily" | "weekly" | "monthly",
    dueDate?: string,
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
          priority: priority ?? defaultPriority ?? 0,
          category,
          color,
          parentId: selectedParentId ?? editingTask?.parentId,
          recurrence: recurrence ?? editingTask?.recurrence ?? "none",
          dueDate: dueDate ?? editingTask?.dueDate,
        } satisfies Task,
      });
      setIsModalOpen(false);
      setSelectedParentId(undefined);
      setEditingTask(undefined);
      setDefaultPriority(undefined);
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

  const handleUpdatePriority = async (task: Task, newPriority: number) => {
    if (!uid || !task.id) return;
    try {
      await invoke("tasks_upsert", {
        task: {
          ...task,
          priority: newPriority,
        } satisfies Task,
      });
      fetchTasks();
      toast.success("Prioridade atualizada!");
    } catch {
      toast.error("Erro ao atualizar prioridade");
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
    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  ];

  const priorityLabels = ["", "Baixa", "Média", "Alta"];

  const rootTasks = tasks
    .filter((t) => !t.parentId || !tasks.some((p) => p.id === t.parentId))
    .sort((a, b) => {
      // Ordena primeiro tarefas pendentes, depois concluídas
      if (Boolean(a.completed) !== Boolean(b.completed)) {
        return a.completed ? 1 : -1;
      }
      return (b.priority || 0) - (a.priority || 0);
    });

  const filteredRootTasks = rootTasks.filter((t) => {
    if (filter === "pending") return !t.completed;
    if (filter === "completed") return t.completed;
    // No filtro "all", respeita a configuração de ocultar concluídas
    if (hideCompleted && t.completed) return false;
    return true;
  });

  const getSubtasks = (parentId: number) =>
    tasks
      .filter((t) => t.parentId === parentId)
      .sort((a, b) => {
        if (Boolean(a.completed) !== Boolean(b.completed)) {
          return a.completed ? 1 : -1;
        }
        return (b.priority || 0) - (a.priority || 0);
      });

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
              className="shrink-0 transition-transform active:scale-90 cursor-pointer"
            >
              {task.completed ? (
                <CheckCircle2
                  className={cn(
                    "w-5 h-5",
                    task.color ? "" : "text-emerald-500 dark:text-emerald-400",
                  )}
                  style={task.color ? { color: styles.iconColor } : undefined}
                />
              ) : (
                <Circle
                  className={cn(
                    "w-5 h-5 transition-colors group-hover:scale-110",
                    task.color
                      ? ""
                      : "text-muted-foreground/50 hover:text-emerald-500/80 dark:hover:text-emerald-400/80",
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

                {/* Tag de Recorrência */}
                {task.recurrence && task.recurrence !== "none" && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shrink-0">
                    <Repeat className="w-2.5 h-2.5 shrink-0" />
                    <span>
                      {task.recurrence === "daily"
                        ? "Diária"
                        : task.recurrence === "weekly"
                          ? "Semanal"
                          : "Mensal"}
                    </span>
                  </div>
                )}

                {/* Data de vencimento */}
                {task.dueDate && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] text-muted-foreground bg-muted/40 border border-border/40 shrink-0">
                    <Calendar className="w-2.5 h-2.5" />
                    <span>{formatDueDate(task.dueDate)}</span>
                  </div>
                )}

                {/* Timer — ao lado da flag de prioridade */}
                {!isSubtask && task.id && (
                  <TaskTimer
                    task={task}
                    onTimeSaved={handleTimeSaved}
                    onStatusChange={handleStatusChange}
                  />
                )}

                {/* Tag de tarefa concluída com a data/hora */}
                {task.completed && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                    <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                    <span>
                      {task.completedAt
                        ? `Concluída em ${formatCompletedAt(task.completedAt)}`
                        : "Concluída"}
                    </span>
                  </div>
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

          {/* Ações de gestão — visíveis no hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
            {!isSubtask && !task.completed && (
              <ToolTip content="Adicionar subtarefa">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedParentId(task.id);
                    setDefaultPriority(task.priority);
                    setIsModalOpen(true);
                  }}
                  className="p-1.5 text-muted-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
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
                className="p-1.5 text-muted-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </ToolTip>
            <ToolTip content="Remover tarefa">
              <button
                type="button"
                onClick={() => handleDelete(task)}
                className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
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
      <div className="w-full flex flex-col gap-6 pb-10 text-foreground">
        <TasksGuidePanel onBack={() => setShowInfo(false)} />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 pb-10 text-foreground">
      <ModuleHeader
        moduleId="tasks"
        color={getModuleColor("tasks")}
        title="Lista de Tarefas"
        subtitle={`${pendingCount} ${pendingCount === 1 ? "tarefa pendente" : "tarefas pendentes"}`}
        icon={ListTodo}
        tabs={TASK_TABS}
        activeTab={viewMode}
        onTabChange={(id) =>
          handleViewModeChange(id as "list" | "kanban" | "eisenhower")
        }
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
              setDefaultPriority(undefined);
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
          {/* Barra de Controles e Filtros para todas as visões */}
          <div className="flex items-center justify-between gap-3">
            {viewMode === "list" ? (
              <Tabs
                value={filter}
                onValueChange={(val) =>
                  setFilter(val as "all" | "pending" | "completed")
                }
                className="w-auto"
              >
                <TabsList className="h-9">
                  <TabsTrigger
                    value="all"
                    className="text-xs px-3 font-bold cursor-pointer"
                  >
                    Todas
                  </TabsTrigger>
                  <TabsTrigger
                    value="pending"
                    className="text-xs px-3 font-bold cursor-pointer"
                  >
                    Pendentes
                  </TabsTrigger>
                  <TabsTrigger
                    value="completed"
                    className="text-xs px-3 font-bold cursor-pointer"
                  >
                    Concluídas
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            ) : (
              <div />
            )}

            {/* Toggle para ocultar tarefas concluídas (disponível em todos os layouts: Lista, Kanban e Matriz) */}
            <ToolTip
              content={
                hideCompleted ? "Mostrar concluídas" : "Ocultar concluídas"
              }
            >
              <button
                type="button"
                onClick={toggleHideCompleted}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none shrink-0",
                  hideCompleted
                    ? "bg-card border-border text-foreground shadow-xs"
                    : "bg-muted/30 border-border/50 text-muted-foreground hover:text-foreground",
                )}
              >
                {hideCompleted ? (
                  <EyeOff className="w-4 h-4 text-primary" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                <span>
                  {hideCompleted ? "Mostrar concluídas" : "Ocultar concluídas"}
                </span>
              </button>
            </ToolTip>
          </div>

          {/* ─── VISÃO MATRIZ DE EISENHOWER ─── */}
          {viewMode === "eisenhower" && (
            <EisenhowerMatrixView
              tasks={hideCompleted ? tasks.filter((t) => !t.completed) : tasks}
              onToggleTask={handleToggle}
              onEditTask={(task) => {
                setEditingTask(task);
                setIsModalOpen(true);
              }}
              onDeleteTask={handleDelete}
              onUpdatePriority={handleUpdatePriority}
              onCreateInQuadrant={(priority) => {
                setSelectedParentId(undefined);
                setEditingTask(undefined);
                setDefaultPriority(priority);
                setIsModalOpen(true);
              }}
              onTimeSaved={handleTimeSaved}
            />
          )}

          {/* ─── VISÃO KANBAN ─── */}
          {viewMode === "kanban" && (
            <KanbanView
              tasks={hideCompleted ? tasks.filter((t) => !t.completed) : tasks}
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
        defaultPriority={defaultPriority}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedParentId(undefined);
          setEditingTask(undefined);
          setDefaultPriority(undefined);
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
