"use client";

import { invoke } from "@tauri-apps/api/core";
import { CheckCircle2, Circle, ListTodo, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useTime } from "@/context/TimeContext";
import type { Task } from "./types";

export default function TasksPage() {
  const { user } = useAuth();
  const { now } = useTime();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");

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

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !newTaskTitle.trim()) return;

    try {
      await invoke("tasks_upsert", {
        task: {
          user_id: uid,
          title: newTaskTitle.trim(),
          completed: false,
          created_at: now.toISOString(),
        } satisfies Omit<Task, "id">,
      });
      setNewTaskTitle("");
      fetchTasks();
      toast.success("Tarefa adicionada!");
    } catch {
      toast.error("Erro ao adicionar tarefa");
    }
  };

  const handleToggle = async (task: Task) => {
    if (!task.id) return;
    try {
      await invoke("tasks_toggle", { id: task.id, completed: !task.completed });
      fetchTasks();
    } catch {
      toast.error("Erro ao atualizar tarefa");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await invoke("tasks_delete", { id });
      fetchTasks();
      toast.success("Tarefa removida!");
    } catch {
      toast.error("Erro ao remover tarefa");
    }
  };

  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
          <ListTodo className="w-4 h-4" />
          <span className="font-bold">Carregando tarefas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col gap-6 overflow-auto pb-10  text-foreground w-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
            <ListTodo className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-none">Lista de tarefas</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pendingTasks.length}{" "}
              {pendingTasks.length === 1
                ? "tarefa pendente"
                : "tarefas pendentes"}
            </p>
          </div>
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleAddTask} className="flex gap-2">
        <Input
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="O que precisa ser feito?"
          className="h-12 bg-card border-border focus-visible:ring-red-500/20"
        />
        <button
          type="submit"
          disabled={!newTaskTitle.trim()}
          className="flex items-center justify-center h-12 w-12 rounded-xl bg-red-600 hover:bg-red-500 disabled:bg-muted disabled:text-muted-foreground text-white font-bold transition-all shrink-0 cursor-pointer active:scale-95"
        >
          <Plus className="w-5 h-5" />
        </button>
      </form>

      {tasks.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="Nenhuma tarefa ainda"
          description="Adicione sua primeira tarefa acima para começar a se organizar."
        />
      ) : (
        <div className="flex flex-col gap-8">
          {/* Tarefas Pendentes */}
          {pendingTasks.length > 0 && (
            <div className="flex flex-col gap-2">
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="group flex items-center justify-between gap-3 p-4 bg-card border border-border hover:border-border rounded-xl transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => handleToggle(task)}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    <Circle className="w-5 h-5 text-neutral-600 group-hover:text-red-500 transition-colors shrink-0" />
                    <span className="text-sm font-medium text-foreground">
                      {task.title}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => task.id && handleDelete(task.id)}
                    className="p-2 text-neutral-600 opacity-0 group-hover:opacity-100 transition-all hover:text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-lg shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Tarefas Concluídas */}
          {completedTasks.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                Concluídas{" "}
                <span className="px-2 py-0.5 rounded-full bg-muted text-[10px]">
                  {completedTasks.length}
                </span>
              </h2>
              <div className="flex flex-col gap-2">
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="group flex items-center justify-between gap-3 p-4 bg-transparent border border-border rounded-xl transition-colors opacity-60 hover:opacity-100"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggle(task)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      <CheckCircle2 className="w-5 h-5 text-red-500 shrink-0" />
                      <span className="text-sm font-medium text-muted-foreground line-through">
                        {task.title}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => task.id && handleDelete(task.id)}
                      className="p-2 text-neutral-600 opacity-0 group-hover:opacity-100 transition-all hover:text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-lg shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
