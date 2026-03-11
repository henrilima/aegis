import type { Habit } from "@/components/pages/habits/types";
import type { PomodoroState } from "./types";

export function pomodoroClock(p: PomodoroState): number {
  const dur = p.cycle_type === "Work" ? p.work_minutes : p.break_minutes;
  let elapsed = p.accumulated_seconds;
  // Adiciona o tempo decorrido se o timer estiver rodando
  if (p.is_running && p.start_time) {
    elapsed += Math.floor(
      (Date.now() - new Date(p.start_time).getTime()) / 1000,
    );
  }
  // Garante que o tempo restante não seja negativo
  return Math.max(0, dur * 60 - elapsed);
}

export function fmtTime(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function isToday(iso: string) {
  const d = new Date(iso);
  const t = new Date();
  return (
    d.getDate() === t.getDate() &&
    d.getMonth() === t.getMonth() &&
    d.getFullYear() === t.getFullYear()
  );
}

export function isHabitDueToday(habit: Habit) {
  // using any or importing Habit
  if (!habit.last_done) return true;
  if (isToday(habit.last_done)) return true;

  const lastDate = new Date(habit.last_done);
  const effectiveInterval = Math.max(1, habit.cooldown_days);
  const nextDate = new Date(lastDate);
  nextDate.setDate(nextDate.getDate() + effectiveInterval);
  nextDate.setHours(0, 0, 0, 0);

  return nextDate.getTime() <= Date.now();
}

export function startOfWeekIso() {
  const now = new Date();
  const day = now.getDay();
  // Calcula a diferença para chegar na segunda-feira (ajusta se for domingo)
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const s = new Date(now.getFullYear(), now.getMonth(), diff);
  const y = s.getFullYear();
  const m = String(s.getMonth() + 1).padStart(2, "0");
  const d = String(s.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDurationMin(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function getHabitStreak(habit: Habit) {
  const isNegative =
    habit.habit_type === "Bad" || habit.habit_type === "Negative";
  if (!isNegative) return habit.current_streak || 0;

  if (!habit.last_slip) return 0;
  const slip = new Date(habit.last_slip);
  const now = new Date();
  const diff = now.getTime() - slip.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
