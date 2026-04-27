"use client";

import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardConfigModal } from "@/components/forms/dashboard/DashboardConfigModal";
import { useAuth } from "@/context/AuthContext";
import { useTime } from "@/context/TimeContext";
import type { Task } from "../tasks/types";
import { DashboardHeader } from "./dashboardHeader";
import { isToday } from "./helpers";
import { useDashboardData, useWidgetLayout } from "./useDashboardData";
import { WIDGET_REGISTRY } from "./widgets/registry";

export default function Dashboard() {
  const { user } = useAuth();
  const { now: time, isSimulated } = useTime();
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const {
    activeWidgetIds,
    handleToggleWidget,
    handleReorderWidgets,
    widgetConfigs,
    handleUpdateWidgetConfig,
  } = useWidgetLayout();
  const { data, fetchAll, pendingTasksCount, handleCreateNote, derived } =
    useDashboardData();

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
    (h) => h.last_done && isToday(h.last_done),
  ).length;
  const positiveHabitsCount = data.habits.filter(
    (h) => h.habit_type === "Positive",
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
            {activeWidgetIds.map((id) => {
              const WidgetComponent = WIDGET_REGISTRY[id];
              if (!WidgetComponent) return null;

              const boundIsToday = (iso: string) => isToday(iso, time);

              // Tipagem mais específica para evitar 'any'
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
                widgetProps.onToggleHabit = async (habitId: number) => {
                  try {
                    await invoke("mark_habit_done", {
                      id: habitId,
                      userId: String(user?.id),
                    });
                    fetchAll();
                  } catch {
                    toast.error("Erro ao atualizar hábito");
                  }
                };
              }
              if (id === "pomodoro") {
                widgetProps.pomodoro = data.pomodoro;
                widgetProps.onTogglePomo = async () => {
                  if (!data.pomodoro || !user) return;
                  const isStarting = !data.pomodoro.is_running;
                  const nowIso = time.toISOString();
                  let newAccumulated = data.pomodoro.accumulated_seconds;
                  if (!isStarting && data.pomodoro.start_time) {
                    const startTime = new Date(
                      data.pomodoro.start_time,
                    ).getTime();
                    newAccumulated += Math.floor(
                      (time.getTime() - startTime) / 1000,
                    );
                  }
                  const newState = {
                    ...data.pomodoro,
                    is_running: isStarting,
                    start_time: isStarting ? nowIso : null,
                    accumulated_seconds: newAccumulated,
                    cycle_type:
                      isStarting && data.pomodoro.cycles_completed === 0
                        ? "Work"
                        : data.pomodoro.cycle_type,
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
                  if (data.pomodoro.cycles_completed > 0) {
                    const historyEntry = {
                      user_id: String(user.id),
                      work_minutes: data.pomodoro.work_minutes,
                      break_minutes: data.pomodoro.break_minutes,
                      cycles_done: data.pomodoro.cycles_completed,
                      start_time: time.toISOString(),
                      end_time: time.toISOString(),
                    };
                    try {
                      await invoke("record_pomodoro_session", {
                        session: historyEntry,
                      });
                    } catch {}
                  }
                  const newState = {
                    ...data.pomodoro,
                    is_running: false,
                    start_time: null,
                    cycles_completed: 0,
                    accumulated_seconds: 0,
                    cycle_type: "Work",
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
                  try {
                    await invoke("tasks_toggle", {
                      id: task.id,
                      completed: !task.completed,
                    });
                    fetchAll();
                  } catch {
                    toast.error("Erro ao atualizar tarefa");
                  }
                };
                widgetProps.onAddTask = async (title: string) => {
                  try {
                    await invoke("tasks_upsert", {
                      task: {
                        user_id: String(user?.id),
                        title,
                        description: null,
                        completed: false,
                        due_date: null,
                        created_at: time.toISOString(),
                      },
                    });
                    fetchAll();
                    toast.success("Tarefa adicionada!");
                  } catch {
                    toast.error("Erro ao adicionar tarefa");
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
              if (id === "currency") {
                widgetProps.rates = data.currencyRates;
                widgetProps.lastUpdated = data.currencyLastUpdated;
                widgetProps.onRefresh = async () => {
                  try {
                    await invoke("update_currency_rates");
                    fetchAll();
                    toast.success("Câmbio atualizado!");
                  } catch {
                    toast.error("Erro ao atualizar câmbio");
                  }
                };
              }
              if (id === "statistics") widgetProps.summary = data.statsSummary;
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
                    const book = data.readingBooks.find((b) => b.id === bookId);
                    if (!book) return;

                    const newPage = Math.min(
                      book.total_pages,
                      book.current_page + pages,
                    );

                    // Upsert Book (update page)
                    await invoke("reading_upsert_book", {
                      book: { ...book, current_page: newPage },
                    });

                    // Add Session
                    await invoke("reading_upsert_session", {
                      session: {
                        user_id: String(user?.id),
                        book_id: bookId,
                        pages_read: pages,
                        date: time.toISOString().split("T")[0],
                        duration_minutes: 0,
                      },
                    });

                    fetchAll();
                    toast.success("Progresso salvo!");
                  } catch {
                    toast.error("Erro ao salvar progresso");
                  }
                };
              }

              const config = widgetConfigs[id] || { interactive: false };
              const isInteractive =
                id !== "notes" &&
                id !== "currency" &&
                id !== "tasks" &&
                id !== "reading"
                  ? config.interactive
                  : false;
              widgetProps.isInteractive = isInteractive;
              widgetProps.onToggleInteractive =
                id !== "notes" &&
                id !== "currency" &&
                id !== "tasks" &&
                id !== "reading"
                  ? () =>
                      handleUpdateWidgetConfig(id, {
                        interactive: !config.interactive,
                      })
                  : undefined;

              return (
                <div
                  key={id}
                  className="w-full h-full min-h-[320px] lg:min-h-[380px]"
                >
                  <WidgetComponent {...widgetProps} className="h-full w-full" />
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
    </div>
  );
}
