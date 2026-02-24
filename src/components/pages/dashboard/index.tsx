"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  Activity,
  Banknote,
  BookOpen,
  Droplet,
  FileText,
  Flame,
  Lock,
  Moon,
  ShieldOff,
  Timer,
  TrendingUp,
  Wifi,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Habit } from "@/components/pages/habits/types";
import type { Note } from "@/components/pages/notes/types";
import { useAuth } from "@/context/AuthContext";
import type { AppRoute } from "@/context/NavigationContext";
import { DashboardHeader } from "./dashboard-header";

import { formatDurationMin, isToday, startOfWeekIso } from "./helpers";
import type {
  HydrationReminder,
  PasswordEntry,
  PomodoroState,
  SleepEntry,
  SleepGoal,
  StudyGoal,
  StudySession,
} from "./types";
import {
  EstudosWidget,
  HabitsWidget,
  ModuleGrid,
  NotesWidget,
  PomodoroWidget,
  QuickStatsBar,
  SonoWidget,
} from "./widgets";

export default function DashboardPage() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [hydration, setHydration] = useState<HydrationReminder[]>([]);
  const [pomodoro, setPomodoro] = useState<PomodoroState | null>(null);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [studyGoals, setStudyGoals] = useState<StudyGoal[]>([]);
  const [sleepEntries, setSleepEntries] = useState<SleepEntry[]>([]);
  const [sleepGoal, setSleepGoal] = useState<SleepGoal | null>(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // Atualiza o relógio a cada segundo para o Pomodoro e saudação
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    const uid = String(user.id);
    // Busca todos os dados necessários de forma assíncrona e paralela
    const results = await Promise.allSettled([
      invoke<Habit[]>("list_habits", { userId: uid }),
      invoke<Note[]>("list_notes", { userId: uid }),
      invoke<PasswordEntry[]>("list_passwords", { userId: uid }),
      invoke<HydrationReminder[]>("list_hydration_reminders", { userId: uid }),
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
    ]);
    // Atualiza os estados apenas se a promessa foi cumprida (fulfilled)
    if (results[0].status === "fulfilled") setHabits(results[0].value);
    if (results[1].status === "fulfilled") setNotes(results[1].value);
    if (results[2].status === "fulfilled") setPasswords(results[2].value);
    if (results[3].status === "fulfilled") setHydration(results[3].value);
    if (results[4].status === "fulfilled") setPomodoro(results[4].value);
    if (results[5].status === "fulfilled") setStudySessions(results[5].value);
    if (results[6].status === "fulfilled") setStudyGoals(results[6].value);
    if (results[7].status === "fulfilled") setSleepEntries(results[7].value);
    if (results[8].status === "fulfilled") setSleepGoal(results[8].value);
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleCreateNote = async (title: string, content: string) => {
    if (!user) return;
    try {
      await invoke("add_note", {
        note: {
          user_id: String(user.id),
          title,
          content,
          pinned: false,
          status: "pending",
        },
      });
      fetchAll();
      toast.success("Nota criada!");
    } catch {
      toast.error("Erro ao criar nota");
    }
  };

  const hour = time.getHours();
  const greeting = useMemo(
    () => (hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite"),
    [hour],
  );

  const positiveHabits = habits.filter((h) => h.habit_type === "Positive");
  const negativeHabits = habits.filter(
    (h) => h.habit_type === "Negative" || h.habit_type === "Bad",
  );
  // Calcula métricas de hábitos positivos para o progresso diário
  const doneToday = positiveHabits.filter(
    (h) => h.last_done && isToday(h.last_done),
  );
  const progressPct =
    positiveHabits.length > 0
      ? Math.round((doneToday.length / positiveHabits.length) * 100)
      : 0;
  const maxStreak = positiveHabits.reduce(
    (m, h) => Math.max(m, h.max_streak ?? 0),
    0,
  );

  const pendingNotes = notes.filter((n) => n.status === "pending" && !n.pinned);
  const pinnedNotes = notes.filter((n) => n.pinned);
  const doneNotes = notes.filter((n) => n.status === "done");

  // Agrega estatísticas de estudos da semana corrente
  const weekStart = startOfWeekIso();
  const weekSessions = studySessions.filter((s) => s.date >= weekStart);
  const weekHours = weekSessions.reduce((a, s) => a + s.hours, 0);
  const weekQuestions = weekSessions.reduce(
    (a, s) => a + s.questions_new + s.questions_review,
    0,
  );
  const totalSessions = studySessions.length;
  const goalWeekHours =
    studyGoals.find((g) => g.goal_type === "weekly_hours")?.target_value ??
    null;
  const goalWeekQuestions =
    studyGoals.find((g) => g.goal_type === "weekly_questions")?.target_value ??
    null;

  // Calcula média de sono e porcentagem em relação à meta
  const recentSleep = sleepEntries.slice(0, 7);
  const avgSleepMin =
    recentSleep.length > 0
      ? Math.round(
          recentSleep.reduce((a, e) => a + e.duration_minutes, 0) /
            recentSleep.length,
        )
      : 0;
  const avgQuality =
    recentSleep.length > 0
      ? (
          recentSleep.reduce((a, e) => a + e.quality, 0) / recentSleep.length
        ).toFixed(1)
      : "—";
  const todaySleep = sleepEntries.find((e) => isToday(e.date));
  const goalSleepMin = sleepGoal ? sleepGoal.target_hours * 60 : null;
  const sleepPct =
    goalSleepMin && avgSleepMin > 0
      ? Math.min(100, Math.round((avgSleepMin / goalSleepMin) * 100))
      : 0;

  const MODULES = [
    {
      label: "Hábitos",
      icon: Activity,
      route: "habits" as AppRoute,
      color: "teal",
      count: positiveHabits.length,
      sub: `${doneToday.length} feitos hoje`,
    },
    {
      label: "Pomodoro",
      icon: Timer,
      route: "pomodoro" as AppRoute,
      color: "red",
      count: pomodoro?.cycles_completed ?? 0,
      sub: pomodoro?.is_running ? "Em andamento" : "Parado",
    },
    {
      label: "Notas",
      icon: FileText,
      route: "notes" as AppRoute,
      color: "orange",
      count: pendingNotes.length,
      sub: `${doneNotes.length} concluídas`,
    },
    {
      label: "Senhas",
      icon: Lock,
      route: "passwords" as AppRoute,
      color: "amber",
      count: passwords.length,
      sub: "Cofre seguro",
    },
    {
      label: "Estudos",
      icon: BookOpen,
      route: "studies" as AppRoute,
      color: "violet",
      count: totalSessions,
      sub: `${weekHours.toFixed(1)}h esta semana`,
    },
    {
      label: "Sono",
      icon: Moon,
      route: "sleep" as AppRoute,
      color: "blue",
      count: sleepEntries.length,
      sub:
        avgSleepMin > 0
          ? `Média ${formatDurationMin(avgSleepMin)}`
          : "Sem dados",
    },
    {
      label: "Câmbio",
      icon: Banknote,
      route: "currency" as AppRoute,
      color: "green",
      count: null,
      sub: "Cotações",
    },
    {
      label: "Hidratação",
      icon: Droplet,
      route: "hydration" as AppRoute,
      color: "sky",
      count: hydration.length,
      sub: "Lembretes",
    },
    {
      label: "Internet",
      icon: Wifi,
      route: "speedtest" as AppRoute,
      color: "red",
      count: null,
      sub: "Speedtest",
    },
  ] as const;

  type ModColor =
    | "teal"
    | "red"
    | "orange"
    | "amber"
    | "violet"
    | "blue"
    | "green"
    | "sky";

  const COLOR: Record<
    ModColor,
    { text: string; bg: string; border: string; ring: string }
  > = {
    teal: {
      text: "text-teal-400",
      bg: "bg-teal-500/10",
      border: "border-teal-500/20",
      ring: "#2dd4bf",
    },
    red: {
      text: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      ring: "#ef4444",
    },
    orange: {
      text: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
      ring: "#f97316",
    },
    amber: {
      text: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      ring: "#f59e0b",
    },
    violet: {
      text: "text-violet-400",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
      ring: "#8b5cf6",
    },
    blue: {
      text: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      ring: "#3b82f6",
    },
    green: {
      text: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/20",
      ring: "#22c55e",
    },
    sky: {
      text: "text-sky-400",
      bg: "bg-sky-500/10",
      border: "border-sky-500/20",
      ring: "#0ea5e9",
    },
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 pb-12 animate-in fade-in duration-500">
      <DashboardHeader
        time={time}
        greeting={greeting}
        user={user}
        doneTodayCount={doneToday.length}
        positiveHabitsCount={positiveHabits.length}
        pendingNotesCount={pendingNotes.length}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <HabitsWidget
          positiveHabits={positiveHabits}
          doneToday={doneToday}
          progressPct={progressPct}
          maxStreak={maxStreak}
          isToday={isToday}
        />

        <NotesWidget
          notes={notes}
          pendingNotes={pendingNotes}
          pinnedNotes={pinnedNotes}
          doneNotes={doneNotes}
          onCreateNote={handleCreateNote}
        />

        <PomodoroWidget pomodoro={pomodoro} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EstudosWidget
          weekHours={weekHours}
          goalWeekHours={goalWeekHours}
          weekQuestions={weekQuestions}
          goalWeekQuestions={goalWeekQuestions}
          weekSessions={weekSessions}
          totalSessions={totalSessions}
        />

        <SonoWidget
          recentSleep={recentSleep}
          avgSleepMin={avgSleepMin}
          goalSleepMin={goalSleepMin}
          avgQuality={avgQuality}
          sleepPct={sleepPct}
          todaySleep={todaySleep}
        />
      </div>

      <QuickStatsBar
        stats={[
          {
            icon: Lock,
            label: "Senhas salvas",
            value: passwords.length,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            border: "border-amber-500/20",
          },
          {
            icon: Flame,
            label: "Maior sequência",
            value: `${maxStreak}d`,
            color: "text-orange-400",
            bg: "bg-orange-500/10",
            border: "border-orange-500/20",
          },
          {
            icon: TrendingUp,
            label: "Hábitos positivos",
            value: positiveHabits.length,
            color: "text-teal-400",
            bg: "bg-teal-500/10",
            border: "border-teal-500/20",
          },
          {
            icon: ShieldOff,
            label: "Vícios controlad.",
            value: negativeHabits.length,
            color: "text-red-400",
            bg: "bg-red-500/10",
            border: "border-red-500/20",
          },
        ]}
      />

      <ModuleGrid modules={MODULES} colorConfig={COLOR} />
    </div>
  );
}
