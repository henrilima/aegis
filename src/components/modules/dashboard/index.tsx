"use client";

import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { toast } from "sonner";
import type { AlarmFormState } from "@/components/modules/alarms/hooks/useAlarmsLogic";
import { DashboardConfigModal } from "@/components/modules/dashboard/components/modals/DashboardConfigModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useAuth } from "@/context/AuthContext";
import { type ModuleId, useModules } from "@/context/ModuleContext";
import { useTime } from "@/context/TimeContext";
import type { CalendarEvent } from "../calendar/types";
import type { ReadingSession } from "../reading/types";
import type { Task } from "../tasks/types";
import { DashboardHeader } from "./dashboardHeader";
import { isToday } from "./helpers";
import type { Habit, SleepEntry, StudySession } from "./types";
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
                if (id === "alarms") {
                  widgetProps.alarms = data.alarms;
                  widgetProps.onAddAlarm = async (form: AlarmFormState) => {
                    try {
                      const alarmData = {
                        userId: String(user?.id),
                        title: form.title.trim(),
                        alarmType: form.alarmType,
                        time: form.time,
                        intervalMinutes:
                          form.alarmType === "interval"
                            ? Number(form.intervalMinutes)
                            : null,
                        lastTriggered: null,
                        soundFile: form.soundFile,
                        icon: form.iconName || "Bell",
                        color: form.color || "red",
                        enabled: true,
                      };
                      await invoke("add_alarm", { alarm: alarmData });
                      fetchAll();
                      toast.success("Alarme adicionado!");
                    } catch {
                      toast.error("Erro ao adicionar alarme");
                    }
                  };
                }

                if (id === "calendar") {
                  widgetProps.showHolidays = data.showHolidays;
                  widgetProps.onAddEvent = async (event: CalendarEvent) => {
                    try {
                      await invoke("calendar_add_event", {
                        event: { ...event, userId: String(user?.id) },
                      });
                      fetchAll();
                      toast.success("Evento agendado!");
                    } catch {
                      toast.error("Erro ao agendar evento");
                    }
                  };
                }

                if (id === "reading") {
                  widgetProps.books = data.readingBooks;
                  widgetProps.recentSessions = data.readingSessions.slice(0, 5);
                  widgetProps.weekPages = weekPages;
                  widgetProps.goalWeekPages = goalWeekPages;
                  widgetProps.onLogSession = async (
                    session: ReadingSession,
                  ) => {
                    try {
                      const sessionData = {
                        id: session.id || undefined,
                        userId: String(user?.id),
                        bookId: session.bookId
                          ? Number(session.bookId)
                          : undefined,
                        pagesRead: Number(session.pagesRead || 0),
                        durationMinutes: Number(session.durationMinutes || 0),
                        date:
                          session.date ||
                          new Date().toISOString().split("T")[0],
                        note: session.note || "",
                        focus: Number(session.focus || 5), // Valor padrão se estiver faltando
                      };
                      await invoke("reading_upsert_session", {
                        session: sessionData,
                      });

                      // Atualiza progresso do livro
                      const book = data.readingBooks.find(
                        (b) => b.id === sessionData.bookId,
                      );
                      if (book) {
                        const newPage =
                          Number(book.currentPage) +
                          Number(sessionData.pagesRead);
                        await invoke("reading_upsert_book", {
                          book: {
                            ...book,
                            currentPage: newPage,
                          },
                        });
                      }
                      fetchAll();
                      toast.success("Leitura registrada!");
                    } catch (err) {
                      console.error("Erro ao salvar leitura:", err);
                      toast.error("Erro ao salvar sessão");
                    }
                  };
                }

                if (id === "sleep") {
                  widgetProps.recentSleep = recentSleep;
                  widgetProps.avgSleepMin = avgSleepMin;
                  widgetProps.avgQuality = avgQuality;
                  widgetProps.goalSleepMin = goalSleepMin;
                  widgetProps.sleepPct = sleepPct;
                  widgetProps.onAddSleep = async (entry: SleepEntry) => {
                    try {
                      const entryData = {
                        id: entry.id || undefined,
                        userId: String(user?.id),
                        date: entry.date,
                        bedtime: entry.bedtime,
                        wakeTime: entry.wakeTime,
                        durationMinutes: Number(entry.durationMinutes || 0),
                        nap_minutes: Number(entry.nap_minutes || 0),
                        quality: Number(entry.quality || 5),
                        note: entry.note || "",
                      };
                      await invoke("sono_upsert_entry", {
                        entry: entryData,
                      });
                      fetchAll();
                      toast.success("Sono registrado!");
                    } catch (err) {
                      console.error("Erro ao salvar sono:", err);
                      toast.error("Erro ao salvar sono");
                    }
                  };
                }

                if (id === "studies") {
                  const allSubjects = Array.from(
                    new Set(
                      (data.studySessions || []).map(
                        (s: StudySession) => s.subject,
                      ),
                    ),
                  ).sort();
                  widgetProps.sessions = weekSessions;
                  widgetProps.allSubjects = allSubjects;
                  widgetProps.weekHours = weekHours;
                  widgetProps.weekQuestions = weekQuestions;
                  widgetProps.goalWeekHours = goalWeekHours;
                  widgetProps.goalWeekQuestions = goalWeekQuestions;
                  widgetProps.onAddSession = async (session: StudySession) => {
                    try {
                      await invoke("estudos_add_session", {
                        session: { ...session, userId: String(user?.id) },
                      });
                      fetchAll();
                      toast.success("Estudo registrado!");
                    } catch {
                      toast.error("Erro ao salvar sessão");
                    }
                  };
                }

                if (id === "statistics")
                  widgetProps.summary = data.statsSummary;
                if (id === "movies") {
                  widgetProps.movies = data.movies;
                }
                if (id === "dictionary") {
                  widgetProps.words = data.dictionaryWords;
                }

                const config = widgetConfigs[id] || { interactive: false };
                const isNonInteractive = [
                  "movies",
                  "statistics",
                  "dictionary",
                ].includes(id);
                const isInteractive = isNonInteractive
                  ? false
                  : config.interactive;

                widgetProps.isInteractive = isInteractive;
                widgetProps.onToggleInteractive = !isNonInteractive
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
