"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  Calendar,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit2,
  Flag,
  Link2,
  MoreVertical,
  Plus,
  Sparkles,
  Target,
  Trash2,
  Trophy,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { formatDueDate } from "@/components/modules/tasks/types";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type {
  GoalStatus,
  GoalTimeframe,
  HabitGoal,
  HabitMilestone,
} from "../types";
import { GoalModal } from "./modals/GoalModal";
import { MilestoneTaskModal } from "./modals/MilestoneTaskModal";

interface HabitsGoalsTabProps {
  userId: string;
}

export function HabitsGoalsTab({ userId }: HabitsGoalsTabProps) {
  const theme = getColorTheme(getModuleColor("habits"));

  const [goals, setGoals] = useState<HabitGoal[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [timeframeFilter, setTimeframeFilter] = useState<"all" | GoalTimeframe>(
    "all",
  );
  const [statusFilter, setStatusFilter] = useState<"all" | GoalStatus>("all");

  // Modais
  const [modalGoal, setModalGoal] = useState<HabitGoal | null | undefined>(
    undefined,
  );
  const [connectingMilestone, setConnectingMilestone] =
    useState<HabitMilestone | null>(null);
  const [deleteGoalId, setDeleteGoalId] = useState<number | null>(null);

  // Estados colapsados por meta (id -> boolean)
  const [expandedGoals, setExpandedGoals] = useState<Record<number, boolean>>(
    {},
  );

  // Busca lista de metas
  const fetchGoals = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await invoke<HabitGoal[]>("habit_list_goals", { userId });
      setGoals(res);
    } catch (err) {
      console.error("Erro ao listar metas:", err);
      toast.error("Erro ao sincronizar metas de longo prazo");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const toggleExpand = (goalId: number) => {
    setExpandedGoals((prev) => ({
      ...prev,
      [goalId]: prev[goalId] === false,
    }));
  };

  const handleSaveGoal = async (
    goalData: HabitGoal,
    createTasksForNewMilestones?: boolean[],
  ) => {
    try {
      const goalId = await invoke<number>("habit_upsert_goal", {
        goal: goalData,
      });

      if (
        createTasksForNewMilestones &&
        createTasksForNewMilestones.length > 0
      ) {
        const fresh = await invoke<HabitGoal[]>("habit_list_goals", { userId });
        const savedGoal = fresh.find((g) => g.id === goalId);
        if (savedGoal) {
          for (let i = 0; i < savedGoal.milestones.length; i++) {
            if (createTasksForNewMilestones[i]) {
              const m = savedGoal.milestones[i];
              if (m.id && !m.taskId) {
                await invoke("habit_create_task_for_milestone", {
                  milestoneId: m.id,
                  userId,
                  taskTitle: m.title,
                  dueDate: m.dueDate || null,
                });
              }
            }
          }
        }
      }

      toast.success(
        goalData.id
          ? "Meta atualizada com sucesso!"
          : "Nova meta criada com sucesso!",
      );
      await fetchGoals();
    } catch (err) {
      toast.error(`Erro ao salvar meta: ${err}`);
      throw err;
    }
  };

  const confirmDelete = async () => {
    if (!deleteGoalId) return;
    try {
      await invoke("habit_delete_goal", { id: deleteGoalId });
      toast.success("Meta removida.");
      setDeleteGoalId(null);
      await fetchGoals();
    } catch (err) {
      toast.error(`Erro ao excluir meta: ${err}`);
    }
  };

  const handleToggleMilestone = async (
    goalId: number,
    milestone: HabitMilestone,
  ) => {
    if (!milestone.id) return;
    const nextCompleted = !milestone.completed;

    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        const updatedMilestones = g.milestones.map((m) =>
          m.id === milestone.id ? { ...m, completed: nextCompleted } : m,
        );
        const total = updatedMilestones.length;
        const completedCount = updatedMilestones.filter(
          (m) => m.completed,
        ).length;
        const progress = total > 0 ? (completedCount / total) * 100 : 0;
        return {
          ...g,
          milestones: updatedMilestones,
          progress,
        };
      }),
    );

    try {
      await invoke("habit_toggle_milestone", {
        milestoneId: milestone.id,
        completed: nextCompleted,
      });

      if (nextCompleted) {
        toast.success(`Marco "${milestone.title}" concluído!`);
      }
      await fetchGoals();
    } catch (err) {
      toast.error(`Erro ao atualizar marco: ${err}`);
      await fetchGoals();
    }
  };

  const filteredGoals = useMemo(() => {
    return goals.filter((g) => {
      if (timeframeFilter !== "all" && g.timeframe !== timeframeFilter)
        return false;
      if (statusFilter !== "all" && g.status !== statusFilter) return false;
      return true;
    });
  }, [goals, timeframeFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = goals.length;
    const completedGoals = goals.filter(
      (g) => g.status === "completed" || (g.progress && g.progress >= 100),
    ).length;

    let totalMilestones = 0;
    let completedMilestones = 0;
    let linkedTasksCount = 0;

    for (const g of goals) {
      for (const m of g.milestones) {
        totalMilestones++;
        if (m.completed) completedMilestones++;
        if (m.taskId) linkedTasksCount++;
      }
    }

    const avgProgress =
      total > 0
        ? Math.round(
            goals.reduce((acc, g) => acc + (g.progress || 0), 0) / total,
          )
        : 0;

    return {
      total,
      completedGoals,
      avgProgress,
      totalMilestones,
      completedMilestones,
      linkedTasksCount,
    };
  }, [goals]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in-0 duration-300">
      {/* Resumo de métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Metas ativas</span>
            <Target className={cn("w-4 h-4", theme.text)} />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-foreground">
              {goals.filter((g) => g.status !== "completed").length}
            </p>
            <p className="text-xs text-muted-foreground">
              de {stats.total} metas cadastradas
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Progresso geral</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <p className={cn("text-2xl font-bold", theme.text)}>
              {stats.avgProgress}%
            </p>
            <p className="text-xs text-muted-foreground">
              média entre todas as metas
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Marcos concluídos</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-emerald-500">
              {stats.completedMilestones}
            </p>
            <p className="text-xs text-muted-foreground">
              de {stats.totalMilestones} marcos acionáveis
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Tarefas conectadas</span>
            <CheckSquare className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-primary">
              {stats.linkedTasksCount}
            </p>
            <p className="text-xs text-muted-foreground">
              marcos com tarefas práticas
            </p>
          </div>
        </div>
      </div>

      {/* Barra de filtros e botão nova meta */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-card border border-border rounded-xl p-3">
        {/* Filtro por horizonte */}
        <div className="flex items-center gap-2 overflow-x-auto py-0.5">
          <span className="text-xs font-medium text-muted-foreground mr-1">
            Horizonte:
          </span>
          <Tabs
            value={timeframeFilter}
            onValueChange={(val) =>
              setTimeframeFilter(val as "all" | GoalTimeframe)
            }
            className="w-auto"
          >
            <TabsList className="h-9">
              <TabsTrigger
                value="all"
                className="text-xs px-3 font-semibold cursor-pointer"
              >
                Todas
              </TabsTrigger>
              <TabsTrigger
                value="annual"
                className="text-xs px-3 font-semibold cursor-pointer"
              >
                Anuais
              </TabsTrigger>
              <TabsTrigger
                value="semiannual"
                className="text-xs px-3 font-semibold cursor-pointer"
              >
                Semestrais
              </TabsTrigger>
              <TabsTrigger
                value="quarterly"
                className="text-xs px-3 font-semibold cursor-pointer"
              >
                Trimestrais
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Filtro por status + botão nova meta */}
        <div className="flex items-center gap-2 ml-auto">
          <Tabs
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as "all" | GoalStatus)}
            className="w-auto"
          >
            <TabsList className="h-9">
              <TabsTrigger
                value="all"
                className="text-xs px-3 font-semibold cursor-pointer"
              >
                Todos
              </TabsTrigger>
              <TabsTrigger
                value="in_progress"
                className="text-xs px-3 font-semibold cursor-pointer"
              >
                Em andamento
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="text-xs px-3 font-semibold cursor-pointer"
              >
                Concluídas
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <button
            type="button"
            onClick={() => setModalGoal(null)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-colors cursor-pointer",
              theme.solid,
            )}
          >
            <Plus className="w-4 h-4" /> Nova meta
          </button>
        </div>
      </div>

      {/* Lista de metas */}
      {loading ? (
        <div className="p-12 text-center text-sm text-muted-foreground">
          Carregando metas de longo prazo...
        </div>
      ) : filteredGoals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Nenhuma meta de longo prazo encontrada"
          description={
            goals.length === 0
              ? "Crie metas anuais, semestrais ou trimestrais com marcos práticos para orientar sua evolução."
              : "Nenhuma meta corresponde aos filtros selecionados."
          }
          actionLabel={goals.length === 0 ? "Criar primeira meta" : undefined}
          onAction={goals.length === 0 ? () => setModalGoal(null) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredGoals.map((g) => {
            const isCompleted =
              g.status === "completed" ||
              (g.progress !== undefined && g.progress >= 100);
            const isExpanded = expandedGoals[g.id || 0] !== false;
            const progressVal = Math.min(100, Math.round(g.progress || 0));

            return (
              <div
                key={g.id}
                className={cn(
                  "bg-card border rounded-xl p-5 transition-colors flex flex-col gap-4",
                  isCompleted
                    ? "border-emerald-500/30 bg-emerald-500/2"
                    : "border-border hover:border-border/80",
                )}
              >
                {/* Cabeçalho da meta */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md text-xs font-semibold border",
                          g.timeframe === "annual"
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                            : g.timeframe === "semiannual"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20",
                        )}
                      >
                        {g.timeframe === "annual"
                          ? "Anual"
                          : g.timeframe === "semiannual"
                            ? "Semestral"
                            : "Trimestral"}
                        {" • "}
                        {g.periodLabel}
                      </span>

                      {g.category && (
                        <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border">
                          {g.category}
                        </span>
                      )}

                      {isCompleted && (
                        <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <Trophy className="w-3 h-3" /> Meta concluída
                        </span>
                      )}
                      {g.status === "paused" && (
                        <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-neutral-500/10 text-neutral-400 border border-neutral-500/20 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Pausada
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-foreground">
                      {g.title}
                    </h3>

                    {g.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
                        {g.description}
                      </p>
                    )}
                  </div>

                  {/* Menu de ações */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem
                        onClick={() => setModalGoal(g)}
                        className="cursor-pointer gap-2"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Editar meta
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => g.id && setDeleteGoalId(g.id)}
                        className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Excluir meta
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Progresso integrado sem card aninhado */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Flag className="w-3.5 h-3.5 text-primary" />
                      Progresso da meta
                    </span>
                    <span className="font-bold text-foreground">
                      {progressVal}%{" "}
                      <span className="text-muted-foreground font-normal">
                        ({g.milestones.filter((m) => m.completed).length} de{" "}
                        {g.milestones.length} marcos)
                      </span>
                    </span>
                  </div>

                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isCompleted ? "bg-emerald-500" : theme.solid,
                      )}
                      style={{ width: `${progressVal}%` }}
                    />
                  </div>
                </div>

                {/* Seção de marcos integrada */}
                <div className="pt-2 border-t border-border/50 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => g.id && toggleExpand(g.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                      <span>Marcos acionáveis ({g.milestones.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setModalGoal(g)}
                      className="text-xs font-medium text-primary hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar marco
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="divide-y divide-border/30">
                      {g.milestones.map((m, mIdx) => (
                        <div
                          key={m.id || mIdx}
                          className={cn(
                            "py-2 first:pt-1 last:pb-0 flex items-center justify-between gap-3 group/m transition-colors",
                            m.completed && "opacity-70",
                          )}
                        >
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            {/* Checkbox */}
                            <button
                              type="button"
                              onClick={() =>
                                g.id && handleToggleMilestone(g.id, m)
                              }
                              className={cn(
                                "w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer shrink-0",
                                m.completed
                                  ? "bg-emerald-500 border-emerald-500 text-white"
                                  : "border-muted-foreground/40 hover:border-primary bg-background",
                              )}
                              title={
                                m.completed
                                  ? "Marcar como pendente"
                                  : "Marcar como concluído"
                              }
                            >
                              {m.completed && (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Título do marco */}
                            <span
                              className={cn(
                                "text-xs font-medium truncate",
                                m.completed
                                  ? "line-through text-muted-foreground"
                                  : "text-foreground",
                              )}
                            >
                              {m.title}
                            </span>

                            {/* Prazo */}
                            {m.dueDate && (
                              <span className="text-[11px] text-muted-foreground shrink-0 flex items-center gap-1 bg-muted/40 px-1.5 py-0.5 rounded border border-border/40">
                                <Calendar className="w-3 h-3" />
                                {formatDueDate(m.dueDate)}
                              </span>
                            )}
                          </div>

                          {/* Conexão com tarefas */}
                          <div className="shrink-0">
                            {m.taskId ? (
                              <button
                                type="button"
                                onClick={() => setConnectingMilestone(m)}
                                className="text-xs font-medium text-emerald-500 hover:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition-colors"
                                title="Gerenciar tarefa conectada"
                              >
                                <CheckSquare className="w-3 h-3" />
                                <span className="max-w-35 truncate">
                                  {m.taskTitle || `Tarefa #${m.taskId}`}
                                </span>
                                {m.taskCompleted ? " (Concluída)" : ""}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConnectingMilestone(m)}
                                className="text-xs font-medium text-muted-foreground hover:text-foreground bg-background px-2 py-0.5 rounded-md border border-border hover:border-primary/40 flex items-center gap-1 cursor-pointer transition-colors opacity-80 hover:opacity-100"
                                title="Conectar a uma tarefa prática"
                              >
                                <Link2 className="w-3 h-3 text-primary" />+
                                Conectar tarefa
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modais */}
      {modalGoal !== undefined && (
        <GoalModal
          goal={modalGoal}
          userId={userId}
          onSave={handleSaveGoal}
          onClose={() => setModalGoal(undefined)}
        />
      )}

      {connectingMilestone && (
        <MilestoneTaskModal
          milestone={connectingMilestone}
          userId={userId}
          onRefresh={fetchGoals}
          onClose={() => setConnectingMilestone(null)}
        />
      )}

      {deleteGoalId !== null && (
        <ConfirmModal
          title="Excluir meta de longo prazo"
          description="Tem certeza de que deseja remover esta meta e seus marcos? As tarefas práticas associadas não serão apagadas."
          confirmLabel="Excluir meta"
          cancelLabel="Cancelar"
          variant="danger"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteGoalId(null)}
        />
      )}
    </div>
  );
}
