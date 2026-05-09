"use client";

import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardConfigModal } from "@/components/modules/dashboard/components/modals/DashboardConfigModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useAuth } from "@/context/AuthContext";
import { type ModuleId, useModules } from "@/context/ModuleContext";
import { useTime } from "@/context/TimeContext";
import type { Habit } from "../habits/types";
import type { Task } from "../tasks/types";
import { DashboardHeader } from "./dashboardHeader";
import { isToday } from "./helpers";
import { useDashboardData, useWidgetLayout } from "./useDashboardData";
import { WIDGET_REGISTRY } from "./widgets/registry";

export default function Dashboard() {
  const { user } = useAuth();
  const { now: time, isSimulated } = useTime();
  const { isModuleEnabled } = useModules();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [taskToConfirm, setTaskToConfirm] = useState<{
    task: Task;
    count: number;
  } | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [habitToConfirm, setHabitToConfirm] = useState<Habit | null>(null);

  const {
    activeWidgetIds,
    handleToggleWidget,
    handleReorderWidgets,
    widgetConfigs,
    handleUpdateWidgetConfig,
  } = useWidgetLayout();
  const {
    data,
    fetchAll,
    pendingTasksCount,
    handleCreateNote,
    handleToggleTask,
    handleDeleteTask,
    derived,
  } = useDashboardData();

  const {
    weekSessions,
    weekHours,
    weekQuestions,
    goalWeekHours,
    goalWeekQuestions,
    recentSleep,
    avgSleepMin,
    avgQuality,
    goalSleepMin,
    sleepPct,
    weekPages,
    goalWeekPages,
  } = derived;

  const doneTodayCount = data.habits.filter(
    (h) => h.lastDone && isToday(h.lastDone),
  ).length;
  const positiveHabitsCount = data.habits.filter(
    (h) => h.habitType === "Positive",
  ).length;

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-background p-0 sm:p-8 animate-in fade-in duration-700 overflow-x-hidden">
      <div className="w-full max-w-[1400px] flex flex-col gap-4 sm:gap-8 min-w-0">
        <div className="flex-none px-4 sm:px-0 mt-4 sm:mt-0">
          <DashboardHeader
            time={time}
            greeting="Olá"
            user={user}
            doneTodayCount={doneTodayCount}
            positiveHabitsCount={positiveHabitsCount}
            pendingTasksCount={pendingTasksCount}
            onOpenConfig={() => setIsConfigOpen(true)}
            isSimulated={isSimulated}
          />
        </div>

        <div className="relative flex-1 px-4 sm:px-0 mb-20 whitespace-normal">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-auto">
            {activeWidgetIds
              .filter((id) => isModuleEnabled(id as ModuleId))
              .map((id) => {
                const WidgetComponent = WIDGET_REGISTRY[id];
                if (!WidgetComponent) return null;

                const boundIsToday = (iso: string) => isToday(iso, time);

                const widgetProps: {
                  isToday: (iso: string) => boolean;
                  time: Date;
                  [key: string]: unknown;
                } = {
                  isToday: boundIsToday,
                  time,
                };

                if (id === "habits") {
                  widgetProps.habits = data.habits;
                }
                if (id === "pomodoro") {
                  widgetProps.pomodoro = data.pomodoro;
                  widgetProps.onTogglePomo = async () => {
                    if (!data.pomodoro || !user) return;
                    const isStarting = !data.pomodoro.isRunning;
                    const nowIso = time.toISOString();
                    let newAccumulated = data.pomodoro.accumulatedSeconds;
                    if (!isStarting && data.pomodoro.startTime) {
                      const startTime = new Date(
                        data.pomodoro.startTime,
                      ).getTime();
                      newAccumulated += Math.floor(
                        (time.getTime() - startTime) / 1000,
                      );
                    }
                    const newState = {
                      ...data.pomodoro,
                      isRunning: isStarting,
                      startTime: isStarting ? nowIso : null,
                      accumulatedSeconds: newAccumulated,
                      cycleType:
                        isStarting && data.pomodoro.cyclesCompleted === 0
                           ? "Work"
                           : data.pomodoro.cycleType,
                    };
                    try {
                      await invoke("save_pomodoro_state", {
                        userId: String(user.id),
                        pomoState: newState,
                      });
                      fetchAll();
                    } catch {
                      toast.error("Erro ao salvar Pomodoro");
                    }
                  };
                  widgetProps.onStopPomo = async () => {
                    if (!user || !data.pomodoro) return;
                    if (data.pomodoro.cyclesCompleted > 0) {
                      const historyEntry = {
                        userId: String(user.id),
                        workMinutes: data.pomodoro.workMinutes,
                        breakMinutes: data.pomodoro.breakMinutes,
                        cyclesDone: data.pomodoro.cyclesCompleted,
                        startTime: time.toISOString(),
                        endTime: time.toISOString(),
                      };
                      try {
                        await invoke("record_pomodoro_session", {
                          session: historyEntry,
                        });
                      } catch {}
                    }
                    const newState = {
                      ...data.pomodoro,
                      isRunning: false,
                      startTime: null,
                      cyclesCompleted: 0,
                      accumulatedSeconds: 0,
                      cycleType: "Work",
                    };
                    await invoke("save_pomodoro_state", {
                      userId: String(user.id),
                      pomoState: newState,
                    });
                    fetchAll();
                  };
                }
                if (id === "notes") {
                  widgetProps.notes = data.notes;
                  widgetProps.onCreateNote = handleCreateNote;
                }
                if (id === "tasks") {
                  widgetProps.tasks = data.tasks;
                  widgetProps.onToggleTask = async (task: Task) => {
                    const res = await handleToggleTask(task);
                    if (
                      res?.needsConfirmation &&
                      res.pendingCount !== undefined
                    ) {
                      setTaskToConfirm({ task, count: res.pendingCount });
                    }
                  };
                  widgetProps.onDeleteTask = (task: Task) => {
                    setTaskToDelete(task);
                  };
                  widgetProps.onAddTask = async (
                    title: string,
                    priority?: number,
                    category?: string,
                    color?: string,
                  ) => {
                    try {
                      await invoke("tasks_upsert", {
                        task: {
                          userId: String(user?.id),
                          title,
                          description: null,
                          completed: false,
                          dueDate: null,
                          createdAt: time.toISOString(),
                          priority,
                          category,
                          color,
                        },
                      });
                      fetchAll();
                      toast.success("Tarefa adicionada!");
                    } catch (err) {
                      toast.error(
                        typeof err === "string"
                          ? err
                          : "Erro ao adicionar tarefa",
                      );
                    }
                  };
                }
                if (id === "studies") {
                  widgetProps.sessions = weekSessions;
                  widgetProps.weekHours = weekHours;
                  widgetProps.weekQuestions = weekQuestions;
                  widgetProps.goalWeekHours = goalWeekHours;
                  widgetProps.goalWeekQuestions = goalWeekQuestions;
                }
                if (id === "sleep") {
                  widgetProps.recentSleep = recentSleep;
                  widgetProps.avgSleepMin = avgSleepMin;
                  widgetProps.avgQuality = avgQuality;
                  widgetProps.goalSleepMin = goalSleepMin;
                  widgetProps.sleepPct = sleepPct;
                }
                if (id === "passwords") {
                  widgetProps.passwords = data.passwords;
                  widgetProps.vaultExists = data.vaultExists;
                }
                if (id === "alarms") widgetProps.alarms = data.alarms;

                if (id === "statistics")
                  widgetProps.summary = data.statsSummary;
                if (id === "calendar")
                  widgetProps.showHolidays = data.showHolidays;
                if (id === "reading") {
                  widgetProps.books = data.readingBooks;
                  widgetProps.recentSessions = data.readingSessions.slice(0, 5);
                  widgetProps.weekPages = weekPages;
                  widgetProps.goalWeekPages = goalWeekPages;
                  widgetProps.onLogSession = async (
                    bookId: number,
                    pages: number,
                  ) => {
                    try {
                      const book = data.readingBooks.find(
                        (b) => b.id === bookId,
                      );
                      if (!book) return;

                      const newPage = Math.min(
                        book.totalPages,
                        book.currentPage + pages,
                      );

                      await invoke("reading_upsert_book", {
                        book: { ...book, currentPage: newPage },
                      });

                      await invoke("reading_upsert_session", {
                        session: {
                          userId: String(user?.id),
                          bookId: bookId,
                          pagesRead: pages,
                          date: time.toISOString().split("T")[0],
                          durationMinutes: 0,
                        },
                      });

                      fetchAll();
                      toast.success("Progresso salvo!");
                    } catch {
                      toast.error("Erro ao salvar progresso");
                    }
                  };
                }
                if (id === "movies") {
                  widgetProps.movies = data.movies;
                }
                if (id === "dictionary") {
                  widgetProps.words = data.dictionaryWords;
                }

                const config = widgetConfigs[id] || { interactive: false };
                const isInteractive =
                  id !== "reading"
                    ? config.interactive
                    : false;

                widgetProps.isInteractive = isInteractive;
                widgetProps.onToggleInteractive =
                  id !== "reading"
                    ? () =>
                        handleUpdateWidgetConfig(id, {
                          interactive: !config.interactive,
                        })
                    : undefined;

                if (id === "habits") {
                  widgetProps.onToggleHabit = (habitId: number) => {
                    const habit = data.habits.find((h) => h.id === habitId);
                    if (habit) setHabitToConfirm(habit);
                  };
                }

                return (
                  <div
                    key={id}
                    className="w-full h-full min-h-[320px] lg:min-h-[380px]"
                  >
                    <WidgetComponent
                      {...widgetProps}
                      className="h-full w-full"
                    />
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {isConfigOpen && (
        <DashboardConfigModal
          activeWidgetIds={activeWidgetIds}
          onToggle={handleToggleWidget}
          onReorder={handleReorderWidgets}
          onClose={() => setIsConfigOpen(false)}
        />
      )}

      {taskToConfirm && (
        <ConfirmModal
          title="Concluir tudo?"
          description={`Esta tarefa possui ${taskToConfirm.count} subtarefas pendentes. Deseja marcar todas como concluídas?`}
          confirmLabel="Sim, concluir tudo"
          cancelLabel="Cancelar"
          variant="default"
          onConfirm={() => {
            const t = taskToConfirm.task;
            setTaskToConfirm(null);
            handleToggleTask(t, true);
          }}
          onCancel={() => setTaskToConfirm(null)}
        />
      )}

      {taskToDelete && (
        <ConfirmModal
          title={
            data.tasks.filter((t) => t.parentId === taskToDelete.id).length > 0
              ? "Excluir tarefa e subtarefas?"
              : "Excluir tarefa?"
          }
          description={
            data.tasks.filter((t) => t.parentId === taskToDelete.id).length > 0
              ? `Esta tarefa possui ${data.tasks.filter((t) => t.parentId === taskToDelete.id).length} subtarefas vinculadas. Ao excluí-la, todas as subtarefas também serão removidas permanentemente.`
              : "Deseja remover permanentemente esta tarefa de sua lista?"
          }
          confirmLabel="Excluir"
          cancelLabel="Cancelar"
          variant="danger"
          onConfirm={() => {
            const t = taskToDelete;
            setTaskToDelete(null);
            handleDeleteTask(t);
          }}
          onCancel={() => setTaskToDelete(null)}
        />
      )}

      {habitToConfirm && (
        <ConfirmModal
          title="Marcar hábito?"
          description={`Deseja marcar o hábito "${habitToConfirm.name}" como concluído hoje?`}
          confirmLabel="Sim, concluir"
          cancelLabel="Cancelar"
          variant="default"
          onConfirm={async () => {
            const hId = habitToConfirm.id;
            setHabitToConfirm(null);
            if (hId === undefined) return;
            try {
              await invoke("mark_habit_done", {
                id: hId,
                userId: String(user?.id),
              });
              fetchAll();
              toast.success("Hábito concluído!");
            } catch {
              toast.error("Erro ao atualizar hábito");
            }
          }}
          onCancel={() => setHabitToConfirm(null)}
        />
      )}
    </div>
  );
}
