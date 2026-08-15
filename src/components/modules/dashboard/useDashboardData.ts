"use client";

import { invoke } from "@tauri-apps/api/core";
import { load } from "@tauri-apps/plugin-store";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useTime } from "@/context/TimeContext";

import type { GlossaryWord } from "../dictionary/types";
import type { Flashcard, FlashcardDeck } from "../flashcards/types";
import type { SubjectMeta } from "../grades/types";
import type { Movie } from "../movies/types";
import type {
  ReadingBook,
  ReadingGoal,
  ReadingSession,
} from "../reading/types";
import type { StudySchedule } from "../studies/types";
import type { Task } from "../tasks/types";
import { startOfWeekIso } from "./helpers";
import type {
  AppAlarm,
  Habit,
  Note,
  PasswordEntry,
  PerformanceSummary,
  PomodoroState,
  SleepEntry,
  SleepGoal,
  StudyGoal,
  StudySession,
} from "./types";

const DEFAULT_WIDGET_IDS = [
  "habits",
  "pomodoro",
  "notes",
  "tasks",
  "studies",
  "sleep",
  "statistics",
  "hydration",
  "calendar",
  "passwords",
  "movies",
  "dictionary",
];

const STORE_KEY = "aegis_dashboard_widgets";
const CONFIG_KEY = "aegis_dashboard_configs";

export interface DashboardData {
  habits: Habit[];
  notes: Note[];
  pomodoro: PomodoroState | null;
  studySessions: StudySession[];
  studyGoals: StudyGoal[];
  sleepEntries: SleepEntry[];
  sleepGoal: SleepGoal | null;
  passwords: PasswordEntry[];
  vaultExists: boolean | null;
  alarms: AppAlarm[];
  flashcardDecks: (FlashcardDeck & { cards: Flashcard[] })[];

  statsSummary: PerformanceSummary | null;
  weekStartDay: number;
  tasks: Task[];
  readingBooks: ReadingBook[];
  readingSessions: ReadingSession[];
  readingGoals: ReadingGoal[];
  movies: Movie[];
  dictionaryWords: GlossaryWord[];
  showHolidays: boolean;
  schedules: StudySchedule[];
  subjects: SubjectMeta[];
}

const INITIAL_DATA: DashboardData = {
  habits: [],
  notes: [],
  pomodoro: null,
  studySessions: [],
  studyGoals: [],
  sleepEntries: [],
  sleepGoal: null,
  passwords: [],
  vaultExists: null,
  alarms: [],
  flashcardDecks: [],

  statsSummary: null,
  weekStartDay: 1,
  tasks: [],
  readingBooks: [],
  readingSessions: [],
  readingGoals: [],
  movies: [],
  dictionaryWords: [],
  showHolidays: true,
  schedules: [],
  subjects: [],
};

// Layout de Widgets (persistido no Store do Tauri)
export function useWidgetLayout() {
  const [activeWidgetIds, setActiveWidgetIds] = useState<string[]>([]);
  const [widgetConfigs, setWidgetConfigs] = useState<
    Record<string, { interactive: boolean; limit?: number }>
  >({});

  useEffect(() => {
    const restore = async () => {
      try {
        const store = await load("aegis-dashboard.json", {
          defaults: {},
          autoSave: true,
        });
        const savedIds = await store.get<string[]>(STORE_KEY);
        const savedConfigs =
          await store.get<
            Record<string, { interactive: boolean; limit?: number }>
          >(CONFIG_KEY);

        if (Array.isArray(savedIds)) {
          setActiveWidgetIds(savedIds);
        } else {
          setActiveWidgetIds(DEFAULT_WIDGET_IDS);
        }

        if (savedConfigs && typeof savedConfigs === "object") {
          setWidgetConfigs(savedConfigs);
        } else {
          setWidgetConfigs({});
        }
      } catch {
        setActiveWidgetIds(DEFAULT_WIDGET_IDS);
        setWidgetConfigs({});
      }
    };
    restore();
  }, []);

  const persist = async (ids: string[]) => {
    try {
      const store = await load("aegis-dashboard.json", {
        defaults: {},
        autoSave: true,
      });
      await store.set(STORE_KEY, ids);
    } catch {
      // fallback silencioso
    }
  };

  const handleToggleWidget = (id: string) => {
    setActiveWidgetIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id];
      persist(next);
      return next;
    });
  };

  const handleReorderWidgets = (newOrder: string[]) => {
    setActiveWidgetIds(newOrder);
    persist(newOrder);
  };

  const handleUpdateWidgetConfig = async (
    id: string,
    config: Partial<{ interactive: boolean; limit: number }>,
  ) => {
    const next = {
      ...widgetConfigs,
      [id]: {
        ...(widgetConfigs[id] || { interactive: false }),
        ...config,
      },
    };
    setWidgetConfigs(next);
    try {
      const store = await load("aegis-dashboard.json", {
        defaults: {},
        autoSave: true,
      });
      await store.set(CONFIG_KEY, next);
    } catch {
      // fallback
    }
  };

  return {
    activeWidgetIds,
    handleToggleWidget,
    handleReorderWidgets,
    widgetConfigs,
    handleUpdateWidgetConfig,
  };
}

// Hook: Busca de Dados do Dashboard
export function useDashboardData() {
  const { user } = useAuth();
  const { now: time } = useTime();
  const [data, setData] = useState<DashboardData>(INITIAL_DATA);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);

  const fetchAll = useCallback(async () => {
    if (!user?.id) return;
    const uid = String(user.id);

    try {
      invoke<Task[]>("tasks_list", { userId: uid })
        .then((tasksResult) => {
          setPendingTasksCount(tasksResult.filter((t) => !t.completed).length);
          setData((prev) => ({ ...prev, tasks: tasksResult }));
        })
        .catch(() => {
          /* silencioso - tarefas não críticas */
        });

      const config = await invoke<{
        weekStartDay: number;
        showHolidays: boolean;
      }>("global_get_app_config");
      const results = await Promise.allSettled([
        invoke<Habit[]>("habit_list_habits", { userId: uid }),
        invoke<Note[]>("note_list_notes", { userId: uid }),
        invoke<PomodoroState>("pomodoro_get_pomodoro_state", { userId: uid }),
        invoke<StudySession[]>("studies_list_sessions", {
          userId: uid,
          monthsBack: 1,
        }),
        invoke<StudyGoal[]>("studies_list_goals", { userId: uid }),
        invoke<SleepEntry[]>("sleep_list_entries", {
          userId: uid,
          monthsBack: 1,
        }),
        invoke<SleepGoal>("sleep_get_goal", { userId: uid }),
        invoke<PasswordEntry[]>("password_list_passwords", { userId: uid }),
        invoke<boolean>("password_check_vault", { userId: uid }),
        invoke<AppAlarm[]>("alarm_list_alarms", { userId: uid }),

        invoke<PerformanceSummary>("stats_get_performance_summary", {
          userId: uid,
          days: 7,
        }),
        invoke<ReadingBook[]>("reading_list_books", { userId: uid }),
        invoke<ReadingSession[]>("reading_list_sessions", {
          userId: uid,
          monthsBack: 1,
        }),
        invoke<ReadingGoal[]>("reading_list_goals", { userId: uid }),
        invoke<Movie[]>("movies_list", { userId: uid }),
        invoke<GlossaryWord[]>("dictionary_list", { userId: uid }),
        invoke<StudySchedule[]>("studies_list_schedules", { userId: uid }),
        invoke<SubjectMeta[]>("subjects_list", { userId: uid }),
      ]);

      // Busca baralhos de flashcards e cartões em paralelo (separado do allSettled principal por ser hierárquico)
      invoke<FlashcardDeck[]>("flashcards_list_decks", { userId: uid })
        .then(async (fetchedDecks) => {
          const decksWithCards = await Promise.all(
            fetchedDecks.map(async (deck) => {
              if (!deck.id) return { ...deck, cards: [] };
              const cards = await invoke<Flashcard[]>("flashcards_list_cards", {
                deckId: deck.id,
              });
              return { ...deck, cards };
            }),
          );
          setData((prev) => ({ ...prev, flashcardDecks: decksWithCards }));
        })
        .catch(() => {
          /* baralhos não disponíveis, mantém vazio */
        });

      setData((prev) => ({
        ...prev,
        habits:
          results[0].status === "fulfilled"
            ? (results[0].value as Habit[])
            : [],
        notes:
          results[1].status === "fulfilled" ? (results[1].value as Note[]) : [],
        pomodoro:
          results[2].status === "fulfilled"
            ? (results[2].value as PomodoroState)
            : null,
        studySessions:
          results[3].status === "fulfilled"
            ? (results[3].value as StudySession[])
            : [],
        studyGoals:
          results[4].status === "fulfilled"
            ? (results[4].value as StudyGoal[])
            : [],
        sleepEntries:
          results[5].status === "fulfilled"
            ? (results[5].value as SleepEntry[])
            : [],
        sleepGoal:
          results[6].status === "fulfilled"
            ? (results[6].value as SleepGoal)
            : null,
        passwords:
          results[7].status === "fulfilled"
            ? (results[7].value as PasswordEntry[])
            : [],
        vaultExists:
          results[8].status === "fulfilled"
            ? (results[8].value as boolean)
            : null,
        alarms:
          results[9].status === "fulfilled"
            ? (results[9].value as AppAlarm[])
            : [],

        statsSummary:
          results[10].status === "fulfilled"
            ? (results[10].value as PerformanceSummary)
            : null,
        weekStartDay: config.weekStartDay,
        showHolidays: config.showHolidays,
        readingBooks:
          results[11].status === "fulfilled"
            ? (results[11].value as ReadingBook[])
            : [],
        readingSessions:
          results[12].status === "fulfilled"
            ? (results[12].value as ReadingSession[])
            : [],
        readingGoals:
          results[13].status === "fulfilled"
            ? (results[13].value as ReadingGoal[])
            : [],
        movies:
          results[14].status === "fulfilled"
            ? (results[14].value as Movie[])
            : [],
        dictionaryWords:
          results[15].status === "fulfilled"
            ? (results[15].value as GlossaryWord[])
            : [],
        schedules:
          results[16].status === "fulfilled"
            ? (results[16].value as StudySchedule[])
            : [],
        subjects:
          results[17].status === "fulfilled"
            ? (results[17].value as SubjectMeta[])
            : [],
      }));
    } catch {
      // Erro silencioso - dashboard mostra dados anteriores
    }
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Cálculos derivados
  const weekStart = startOfWeekIso(time, data.weekStartDay);
  const weekSessions = data.studySessions.filter((s) => s.date >= weekStart);
  const weekHours = weekSessions.reduce((acc, s) => acc + (s.hours || 0), 0);
  const weekQuestions = weekSessions.reduce(
    (acc, s) => acc + (s.questionsNew + s.questionsReview || 0),
    0,
  );
  const goalWeekHours =
    data.studyGoals.find((g) => g.goalType === "weekly_hours")?.targetValue ||
    0;
  const goalWeekQuestions =
    data.studyGoals.find((g) => g.goalType === "weekly_questions")
      ?.targetValue || 0;

  const sleepLimit = new Date(time);
  sleepLimit.setDate(time.getDate() - 6);
  sleepLimit.setHours(0, 0, 0, 0);
  const recentSleep = data.sleepEntries
    .filter((e) => new Date(e.date.replace(/-/g, "/")) >= sleepLimit)
    .slice(0, 7);
  const avgSleepMin = recentSleep.length
    ? recentSleep.reduce((acc, s) => acc + s.durationMinutes, 0) /
      recentSleep.length
    : 0;
  const avgQuality = recentSleep.length
    ? (
        recentSleep.reduce((acc, s) => acc + s.quality, 0) / recentSleep.length
      ).toFixed(1)
    : "0.0";
  const goalSleepMin = (data.sleepGoal?.targetHours || 8) * 60;
  const sleepPct =
    goalSleepMin > 0 ? Math.round((avgSleepMin / goalSleepMin) * 100) : 0;
  // Débito acumulado: soma de minutos faltantes em cada noite da semana
  const sleepDebt = recentSleep.reduce((acc, s) => {
    const deficit = goalSleepMin - s.durationMinutes;
    return acc + (deficit > 0 ? deficit : 0);
  }, 0);

  const weekReadingSessions = data.readingSessions.filter(
    (s) => s.date >= weekStart,
  );
  const weekPages = weekReadingSessions.reduce(
    (acc, s) => acc + (s.pagesRead || 0),
    0,
  );
  const goalWeekPages =
    data.readingGoals.find((g) => g.goalType === "weekly_pages")?.targetValue ??
    null;

  const handleCreateNote = async (title: string, content: string) => {
    if (!user?.id) return;
    try {
      await invoke("note_add_note", {
        note: {
          userId: String(user.id),
          title: title.trim(),
          content: content.trim(),
          createdAt: time.toISOString(),
          pinned: false,
        },
      });
      fetchAll();
      toast.success("Nota salva!");
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Erro ao criar nota");
    }
  };

  const handleToggleTask = async (task: Task, forceConfirmed = false) => {
    if (!task.id || !user?.id) return;
    const newState = !task.completed;

    // Se for marcar como concluída uma tarefa pai com mais de 2 subtarefas pendentes
    if (newState && !task.parentId && !forceConfirmed) {
      const subtasks = data.tasks.filter((t) => t.parentId === task.id);
      const pendingCount = subtasks.filter((s) => !s.completed).length;
      if (pendingCount > 1) {
        return { needsConfirmation: true, pendingCount };
      }
    }

    // Atualização otimista
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id === task.id) return { ...t, completed: newState };
        if (newState && t.parentId === task.id)
          return { ...t, completed: true };
        return t;
      }),
    }));

    try {
      await invoke("tasks_toggle", { id: task.id, completed: newState });

      if (newState) {
        const subtasks = data.tasks.filter(
          (t) => t.parentId === task.id && !t.completed,
        );
        if (subtasks.length > 0) {
          await Promise.all(
            subtasks.map((st) =>
              invoke("tasks_toggle", { id: st.id, completed: true }),
            ),
          );
        }
      }
      fetchAll();
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Erro ao atualizar tarefa");
      fetchAll();
    }
    return { needsConfirmation: false };
  };

  const handleDeleteTask = async (task: Task) => {
    if (!task.id) return;
    try {
      await invoke("tasks_delete", { id: task.id });
      fetchAll();
      toast.success("Tarefa removida!");
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Erro ao remover tarefa");
    }
  };

  return {
    data,
    fetchAll,
    pendingTasksCount,
    handleCreateNote,
    handleToggleTask,
    handleDeleteTask,
    derived: {
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
      sleepDebt,
      weekPages,
      goalWeekPages,
    },
  };
}
