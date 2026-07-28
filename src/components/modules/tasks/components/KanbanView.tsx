"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  CheckCircle2,
  Circle,
  Flag,
  Hash,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { resolveTaskStyles } from "@/colors.config";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { cn } from "@/lib/utils";
import type { Task } from "../types";
import { TaskTimerBadge } from "./TaskTimer";

type KanbanStatus = "todo" | "doing" | "done";

interface KanbanColumnDef {
  id: KanbanStatus;
  label: string;
  emptyLabel: string;
  headerClass: string;
  dotClass: string;
}

const COLUMNS: KanbanColumnDef[] = [
  {
    id: "todo",
    label: "A Fazer",
    emptyLabel: "Nenhuma tarefa pendente",
    headerClass: "text-muted-foreground",
    dotClass: "bg-muted-foreground/60",
  },
  {
    id: "doing",
    label: "Fazendo",
    emptyLabel: "Nenhuma tarefa em andamento",
    headerClass: "text-amber-600 dark:text-amber-400",
    dotClass: "bg-amber-500",
  },
  {
    id: "done",
    label: "Concluído",
    emptyLabel: "Nenhuma tarefa concluída",
    headerClass: "text-emerald-600 dark:text-emerald-400",
    dotClass: "bg-emerald-500",
  },
];

const priorityBadgeStyles = [
  "",
  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
];
const priorityLabels = ["", "Baixa", "Média", "Alta"];

interface KanbanViewProps {
  tasks: Task[];
  onTimeSaved: (taskId: number, newTotal: number) => void;
  onStatusChange: (taskId: number, status: "todo" | "doing" | "done") => void;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onAddSubtask: (parentId: number) => void;
  onRefresh: () => void;
}

/**
 * Visualização Kanban do módulo de Tarefas.
 * 3 colunas de largura igual. Timer via TaskTimerContext global.
 * Cards mostram subtarefas com checkboxes embutidos.
 */
export function KanbanView({
  tasks,
  onTimeSaved,
  onStatusChange,
  onToggle,
  onEdit,
  onDelete,
  onAddSubtask,
  onRefresh,
}: KanbanViewProps) {
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [hoveringCol, setHoveringCol] = useState<KanbanStatus | null>(null);
  const dragSourceCol = useRef<KanbanStatus | null>(null);

  const resolveStatus = (task: Task): KanbanStatus => {
    if (task.status) return task.status;
    return task.completed ? "done" : "todo";
  };

  // Apenas tarefas raiz no kanban
  const rootTasks = tasks.filter(
    (t) => !t.parentId || !tasks.some((p) => p.id === t.parentId),
  );

  const getSubtasks = (parentId: number) =>
    tasks
      .filter((t) => t.parentId === parentId)
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  const tasksByColumn = (col: KanbanStatus) =>
    rootTasks
      .filter((t) => resolveStatus(t) === col)
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  const handleDragStart = (task: Task, col: KanbanStatus) => {
    setDraggingId(task.id ?? null);
    dragSourceCol.current = col;
  };

  const handleDragOver = (e: React.DragEvent, col: KanbanStatus) => {
    e.preventDefault();
    setHoveringCol(col);
  };

  const handleDrop = async (e: React.DragEvent, col: KanbanStatus) => {
    e.preventDefault();
    setHoveringCol(null);
    if (!draggingId || col === dragSourceCol.current) {
      setDraggingId(null);
      return;
    }
    try {
      await invoke("tasks_update_status", { id: draggingId, status: col });
      onRefresh();
    } catch {
      toast.error("Erro ao mover tarefa");
    } finally {
      setDraggingId(null);
      dragSourceCol.current = null;
    }
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setHoveringCol(null);
    dragSourceCol.current = null;
  };

  return (
    <div className="grid grid-cols-3 w-full">
      {COLUMNS.map((col, idx) => {
        const colTasks = tasksByColumn(col.id);
        const isHovering = hoveringCol === col.id;

        return (
          <section
            key={col.id}
            aria-label={col.label}
            className={cn(
              "flex flex-col gap-3 transition-all min-h-50 rounded-2xl",
              idx === 0 ? "pr-4" : idx === 1 ? "px-4" : "pl-4",
              isHovering && "bg-muted/20 ring-2 ring-dashed ring-border/80",
            )}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDrop={(e) => handleDrop(e, col.id)}
            onDragLeave={() => setHoveringCol(null)}
          >
            {/* Cabeçalho da coluna */}
            <div className="flex items-center gap-2 px-1 pb-1 border-b border-border/40 shrink-0">
              <span
                className={cn("w-2 h-2 rounded-full shrink-0", col.dotClass)}
              />
              <span className={cn("text-xs font-bold", col.headerClass)}>
                {col.label}
              </span>
              <span className="ml-auto text-[10px] font-medium text-muted-foreground">
                {colTasks.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-2 flex-1">
              {colTasks.length === 0 ? (
                <div className="flex-1 flex items-center justify-center py-6">
                  <p className="text-[11px] text-muted-foreground/50 text-center px-2">
                    {col.emptyLabel}
                  </p>
                </div>
              ) : (
                colTasks.map((task, idx) => (
                  <KanbanCard
                    key={task.id}
                    task={task}
                    index={idx}
                    colId={col.id}
                    isDragging={draggingId === task.id}
                    subtasks={task.id ? getSubtasks(task.id) : []}
                    onTimeSaved={onTimeSaved}
                    onStatusChange={onStatusChange}
                    onToggle={onToggle}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onAddSubtask={onAddSubtask}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  />
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ─── Card Individual do Kanban ────────────────────────────────────────────────

interface KanbanCardProps {
  task: Task;
  index: number;
  colId: KanbanStatus;
  isDragging: boolean;
  subtasks: Task[];
  onTimeSaved: (taskId: number, newTotal: number) => void;
  onStatusChange: (taskId: number, status: "todo" | "doing" | "done") => void;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onAddSubtask: (parentId: number) => void;
  onDragStart: (task: Task, col: KanbanStatus) => void;
  onDragEnd: () => void;
}

function KanbanCard({
  task,
  index,
  colId,
  isDragging,
  subtasks,
  onTimeSaved,
  onStatusChange,
  onToggle,
  onEdit,
  onDelete,
  onAddSubtask,
  onDragStart,
  onDragEnd,
}: KanbanCardProps) {
  const styles = resolveTaskStyles(task.color, task.completed);
  const completedSubs = subtasks.filter((s) => s.completed).length;

  return (
    <article
      aria-label={task.title}
      draggable
      onDragStart={() => onDragStart(task, colId)}
      onDragEnd={onDragEnd}
      className={cn(
        "group relative flex flex-col gap-2.5 bg-card border border-border rounded-xl p-3 cursor-grab active:cursor-grabbing transition-all overflow-hidden",
        "animate-in fade-in-0 slide-in-from-bottom-1 duration-200 fill-mode-both",
        isDragging && "opacity-40 scale-95",
        task.completed ? "opacity-60 grayscale-[0.5]" : "hover:bg-muted/20",
      )}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Linha superior: toggle + título + ações */}
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => onToggle(task)}
          className="shrink-0 mt-0.5 transition-transform active:scale-90"
        >
          {task.completed ? (
            <CheckCircle2
              className="w-4 h-4"
              style={task.color ? { color: styles.iconColor } : undefined}
            />
          ) : (
            <Circle
              className={cn(
                "w-4 h-4 transition-colors",
                task.color
                  ? ""
                  : "text-muted-foreground/50 hover:text-foreground/60",
              )}
              style={task.color ? { color: styles.iconColorMuted } : undefined}
            />
          )}
        </button>

        {/* Título */}
        <span
          className={cn(
            "text-xs font-medium leading-snug flex-1 min-w-0 wrap-break-word",
            task.completed && "line-through text-muted-foreground",
          )}
        >
          {task.title}
        </span>

        {/* Ações — aparecem no hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
          {!task.completed && (
            <ToolTip content="Adicionar subtarefa">
              <button
                type="button"
                onClick={() => task.id && onAddSubtask(task.id)}
                className="p-1 text-muted-foreground hover:bg-muted rounded-md transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </ToolTip>
          )}
          <ToolTip content="Editar tarefa">
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="p-1 text-muted-foreground hover:bg-muted rounded-md transition-colors"
            >
              <Pencil className="w-3 h-3" />
            </button>
          </ToolTip>
          <ToolTip content="Remover tarefa">
            <button
              type="button"
              onClick={() => onDelete(task)}
              className="p-1 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </ToolTip>
        </div>
      </div>

      {/* ── Subtarefas ── */}
      {subtasks.length > 0 && (
        <div className="flex flex-col gap-1 ml-6">
          {/* Barra de progresso das subtarefas */}
          {subtasks.length > 1 && (
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.round((completedSubs / subtasks.length) * 100)}%`,
                    backgroundColor: task.color
                      ? styles.iconColor
                      : "hsl(var(--primary))",
                  }}
                />
              </div>
              <span className="text-[9px] font-bold text-muted-foreground tabular-nums shrink-0">
                {completedSubs}/{subtasks.length}
              </span>
            </div>
          )}

          {/* Lista completa de subtarefas */}
          {subtasks.map((sub) => {
            const subStyles = resolveTaskStyles(
              sub.color ?? task.color,
              sub.completed,
            );
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => onToggle(sub)}
                className="flex items-center gap-1.5 text-left group/sub w-full"
              >
                {sub.completed ? (
                  <CheckCircle2
                    className="w-3 h-3 shrink-0"
                    style={
                      task.color ? { color: subStyles.iconColor } : undefined
                    }
                  />
                ) : (
                  <Circle
                    className={cn(
                      "w-3 h-3 shrink-0 transition-colors",
                      task.color
                        ? ""
                        : "text-muted-foreground/40 group-hover/sub:text-muted-foreground/70",
                    )}
                    style={
                      task.color
                        ? { color: subStyles.iconColorMuted }
                        : undefined
                    }
                  />
                )}
                <span
                  className={cn(
                    "text-[10px] leading-tight truncate",
                    sub.completed
                      ? "line-through text-muted-foreground/50"
                      : "text-muted-foreground group-hover/sub:text-foreground transition-colors",
                  )}
                >
                  {sub.title}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Badges: prioridade + timer + categoria ── */}
      <div className="flex flex-wrap items-center gap-1.5 ml-6">
        {Number(task.priority) > 0 && (
          <div
            className={cn(
              "flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-bold shrink-0",
              priorityBadgeStyles[task.priority ?? 0],
            )}
          >
            <Flag className="w-2.5 h-2.5" />
            <span>{priorityLabels[task.priority ?? 0]}</span>
          </div>
        )}

        {/* Timer — usa TaskTimerContext global */}
        {task.id && (
          <TaskTimerBadge
            task={task}
            onTimeSaved={onTimeSaved}
            onStatusChange={onStatusChange}
          />
        )}

        {task.category && (
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border shrink-0"
            style={{
              backgroundColor: styles.badgeBg,
              borderColor: styles.badgeBorder.replace("1px solid ", ""),
            }}
          >
            <Hash
              className="w-2.5 h-2.5"
              style={{ color: task.color ? styles.iconColor : undefined }}
            />
            <span style={{ color: task.color ? styles.iconColor : undefined }}>
              {task.category}
            </span>
          </div>
        )}
      </div>
    </article>
  );
}
