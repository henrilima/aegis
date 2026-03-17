"use client";

import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardConfigModal } from "@/components/forms/dashboard/DashboardConfigModal";
import { useAuth } from "@/context/AuthContext";
import { useTime } from "@/context/TimeContext";
import type { CurrencyRate } from "../currency/types";
import { DashboardHeader } from "./dashboardHeader";
import { isToday, startOfWeekIso } from "./helpers";

import type {
  Habit,
  HydrationReminder,
  Note,
  PasswordEntry,
  PerformanceSummary,
  PomodoroState,
  SleepEntry,
  SleepGoal,
  StudyGoal,
  StudySession,
} from "./types";
import { WIDGET_REGISTRY } from "./widgets/registry";

const DEFAULT_WIDGET_IDS = [
  "habits",
  "pomodoro",
  "notes",
  "studies",
  "sleep",
  "statistics",
  "hydration",
  "calendar",
  "passwords",
  "currency",
];

export default function Dashboard() {
  const { user } = useAuth();
  const [activeWidgetIds, setActiveWidgetIds] = useState<string[]>([]);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [data, setData] = useState<{
    habits: Habit[];
    notes: Note[];
    pomodoro: PomodoroState | null;
    studySessions: StudySession[];
    studyGoals: StudyGoal[];
    sleepEntries: SleepEntry[];
    sleepGoal: SleepGoal | null;
    passwords: PasswordEntry[];
    vaultExists: boolean | null;
    hydrationReminders: HydrationReminder[];
    currencyRates: Record<string, number>;
    currencyLastUpdated: string | null;
    statsSummary: PerformanceSummary | null;
    weekStartDay: number;
  }>({
    habits: [],
    notes: [],
    pomodoro: null,
    studySessions: [],
    studyGoals: [],
    sleepEntries: [],
    sleepGoal: null,
    passwords: [],
    vaultExists: null,
    hydrationReminders: [],
    currencyRates: {},
    currencyLastUpdated: null,
    statsSummary: null,
    weekStartDay: 1,
  });
  const { now: time, isSimulated } = useTime();

  // Carrega layout ao montar
  useEffect(() => {
    const saved = localStorage.getItem("aegis_dashboard_widgets");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setActiveWidgetIds(parsed);
          return;
        }
      } catch (e) {
        console.error("Error parsing saved widgets", e);
      }
    }
    setActiveWidgetIds(DEFAULT_WIDGET_IDS);
  }, []);

  const handleToggleWidget = (id: string) => {
    setActiveWidgetIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id];
      localStorage.setItem("aegis_dashboard_widgets", JSON.stringify(next));
      return next;
    });
  };

  const handleReorderWidgets = (newOrder: string[]) => {
    setActiveWidgetIds(newOrder);
    localStorage.setItem("aegis_dashboard_widgets", JSON.stringify(newOrder));
  };

  const fetchAll = useCallback(async () => {
    if (!user?.id) return;
    const uid = String(user.id);

    try {
      const config = await invoke<{ week_start_day: number }>("get_app_config");
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
        invoke<HydrationReminder[]>("list_hydration_reminders", {
          userId: uid,
        }),
        invoke<CurrencyRate[]>("get_currency_rates"),
        invoke<PerformanceSummary>("stats_get_performance_summary", {
          userId: uid,
          days: 30,
        }),
      ]);

      const ratesMap: Record<string, number> = {};
      let lastUpdateTS: string | null = null;
      if (
        results[10].status === "fulfilled" &&
        Array.isArray(results[10].value)
      ) {
        const ratesArr = results[10].value as CurrencyRate[];
        for (const r of ratesArr) {
          ratesMap[r.code.toUpperCase()] = r.rate;
        }
        if (ratesArr.length > 0) {
          lastUpdateTS = ratesArr[0].last_updated;
        }
      }

      setData({
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
        hydrationReminders:
          results[9].status === "fulfilled"
            ? (results[9].value as HydrationReminder[])
            : [],
        currencyRates: ratesMap,
        currencyLastUpdated: lastUpdateTS,
        statsSummary:
          results[11].status === "fulfilled"
            ? (results[11].value as PerformanceSummary)
            : null,
        weekStartDay: config.week_start_day,
      });
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleCreateNote = async (title: string, content: string) => {
    if (!user?.id) return;
    try {
      await invoke("add_note", {
        note: {
          user_id: String(user.id),
          title: title.trim(),
          content: content.trim(),
          created_at: time.toISOString(),
          status: "pending",
          pinned: false,
        },
      });
      fetchAll();
      toast.success("Nota salva!");
    } catch {
      toast.error("Erro ao criar nota");
    }
  };

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

  // Sono: Últimos 7 dias rolantes
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

  const doneTodayCount = data.habits.filter(
    (h) => h.last_done && isToday(h.last_done),
  ).length;
  const positiveHabitsCount = data.habits.filter(
    (h) => h.habit_type === "Positive",
  ).length;
  const pendingNotesCount = data.notes.filter(
    (n) => n.status === "pending",
  ).length;

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-neutral-950 p-0 sm:p-8 animate-in fade-in duration-700 overflow-x-hidden">
      <div className="w-full max-w-[1400px] flex flex-col gap-4 sm:gap-8 min-w-0">
        <div className="flex-none px-4 sm:px-0 mt-4 sm:mt-0">
          <DashboardHeader
            time={time}
            greeting="Olá"
            user={user}
            doneTodayCount={doneTodayCount}
            positiveHabitsCount={positiveHabitsCount}
            pendingNotesCount={pendingNotesCount}
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
              const widgetProps: Record<string, unknown> = {
                isToday: boundIsToday,
                time,
              };
              if (id === "habits") widgetProps.habits = data.habits;
              if (id === "pomodoro") widgetProps.pomodoro = data.pomodoro;
              if (id === "notes") {
                widgetProps.notes = data.notes;
                widgetProps.onCreateNote = handleCreateNote;
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
              if (id === "hydration") {
                widgetProps.reminders = data.hydrationReminders;
              }
              if (id === "currency") {
                widgetProps.rates = data.currencyRates;
                widgetProps.lastUpdated = data.currencyLastUpdated;
              }
              if (id === "statistics") {
                widgetProps.summary = data.statsSummary;
              }

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
