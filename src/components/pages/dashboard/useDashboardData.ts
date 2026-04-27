"use client";

import { invoke } from "@tauri-apps/api/core";
import { load } from "@tauri-apps/plugin-store";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useTime } from "@/context/TimeContext";
import type { CurrencyRate } from "../currency/types";
import type {
  ReadingBook,
  ReadingGoal,
  ReadingSession,
} from "../reading/types";
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
  "currency",
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
  currencyRates: Record<string, number>;
  currencyLastUpdated: string | null;
  statsSummary: PerformanceSummary | null;
  weekStartDay: number;
  tasks: Task[];
  readingBooks: ReadingBook[];
  readingSessions: ReadingSession[];
  readingGoals: ReadingGoal[];
  showHolidays: boolean;
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
  currencyRates: {},
  currencyLastUpdated: null,
  statsSummary: null,
  weekStartDay: 1,
  tasks: [],
  readingBooks: [],
  readingSessions: [],
  readingGoals: [],
  showHolidays: true,
};

// Hook: Layout de Widgets (persistido no Store do Tauri)
export function useWidgetLayout() {
  const [activeWidgetIds, setActiveWidgetIds] = useState<string[]>([]);
  const [widgetConfigs, setWidgetConfigs] = useState<
    Record<string, { interactive: boolean }>
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
          await store.get<Record<string, { interactive: boolean }>>(CONFIG_KEY);

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
    config: { interactive: boolean },
  ) => {
    const next = { ...widgetConfigs, [id]: config };
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
          /* silencioso — tarefas não críticas */
        });

      const config = await invoke<{
        week_start_day: number;
        show_holidays: boolean;
      }>("get_app_config");
      const results = await Promise.allSettled([
        invoke<Habit[]>("list_habits", { userId: uid }),
        invoke<Note[]>("list_notes", { userId: uid }),
        invoke<PomodoroState>("get_pomodoro_state", { userId: uid }),
        invoke<StudySession[]>("estudos_list_sessions", {
          userId: uid,
          monthsBack: 1,
        }),
        invoke<StudyGoal[]>("estudos_list_goals", { userId: uid }),
        invoke<SleepEntry[]>("sono_list_entries", {
          userId: uid,
          monthsBack: 1,
        }),
        invoke<SleepGoal>("sono_get_goal", { userId: uid }),
        invoke<PasswordEntry[]>("list_passwords", { userId: uid }),
        invoke<boolean>("check_vault", { userId: uid }),
        invoke<AppAlarm[]>("list_alarms", { userId: uid }),
        invoke<CurrencyRate[]>("get_currency_rates"),
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
      ]);

      const ratesMap: Record<string, number> = {};
      let lastUpdateTS: string | null = null;
      if (
        results[10].status === "fulfilled" &&
        Array.isArray(results[10].value)
      ) {
        const ratesArr = results[10].value as CurrencyRate[];
        for (const r of ratesArr) ratesMap[r.code.toUpperCase()] = r.rate;
        if (ratesArr.length > 0) lastUpdateTS = ratesArr[0].last_updated;
      }

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
        currencyRates: ratesMap,
        currencyLastUpdated: lastUpdateTS,
        statsSummary:
          results[11].status === "fulfilled"
            ? (results[11].value as PerformanceSummary)
            : null,
        weekStartDay: config.week_start_day,
        showHolidays: config.show_holidays,
        readingBooks:
          results[12].status === "fulfilled"
            ? (results[12].value as ReadingBook[])
            : [],
        readingSessions:
          results[13].status === "fulfilled"
            ? (results[13].value as ReadingSession[])
            : [],
        readingGoals:
          results[14].status === "fulfilled"
            ? (results[14].value as ReadingGoal[])
            : [],
      }));
    } catch {
      // Erro silencioso — dashboard mostra dados anteriores
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
    (acc, s) => acc + (s.questions_new + s.questions_review || 0),
    0,
  );
  const goalWeekHours =
    data.studyGoals.find((g) => g.goal_type === "weekly_hours")?.target_value ||
    0;
  const goalWeekQuestions =
    data.studyGoals.find((g) => g.goal_type === "weekly_questions")
      ?.target_value || 0;

  const sleepLimit = new Date(time);
  sleepLimit.setDate(time.getDate() - 6);
  sleepLimit.setHours(0, 0, 0, 0);
  const recentSleep = data.sleepEntries
    .filter((e) => new Date(e.date.replace(/-/g, "/")) >= sleepLimit)
    .slice(0, 7);
  const avgSleepMin = recentSleep.length
    ? recentSleep.reduce((acc, s) => acc + s.duration_minutes, 0) /
      recentSleep.length
    : 0;
  const avgQuality = recentSleep.length
    ? (
        recentSleep.reduce((acc, s) => acc + s.quality, 0) / recentSleep.length
      ).toFixed(1)
    : "0.0";
  const goalSleepMin = (data.sleepGoal?.target_hours || 8) * 60;
  const sleepPct =
    goalSleepMin > 0 ? Math.round((avgSleepMin / goalSleepMin) * 100) : 0;

  const weekReadingSessions = data.readingSessions.filter(
    (s) => s.date >= weekStart,
  );
  const weekPages = weekReadingSessions.reduce(
    (acc, s) => acc + (s.pages_read || 0),
    0,
  );
  const goalWeekPages =
    data.readingGoals.find((g) => g.goal_type === "weekly_pages")
      ?.target_value ?? null;

  const handleCreateNote = async (title: string, content: string) => {
    if (!user?.id) return;
    try {
      await invoke("add_note", {
        note: {
          user_id: String(user.id),
          title: title.trim(),
          content: content.trim(),
          created_at: time.toISOString(),
          pinned: false,
        },
      });
      fetchAll();
      toast.success("Nota salva!");
    } catch {
      toast.error("Erro ao criar nota");
    }
  };

  return {
    data,
    fetchAll,
    pendingTasksCount,
    handleCreateNote,
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
      weekPages,
      goalWeekPages,
    },
  };
}
