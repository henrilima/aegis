import type { Habit } from "@/components/pages/habits/types";
import type { PomodoroState } from "./types";

export function pomodoroClock(p: PomodoroState, referenceNow?: Date): number {
  const dur = p.cycle_type === "Work" ? p.work_minutes : p.break_minutes;
  let elapsed = p.accumulated_seconds;
  // Adiciona o tempo decorrido se o timer estiver rodando
  if (p.is_running && p.start_time) {
    const now = referenceNow ? referenceNow.getTime() : Date.now();
    elapsed += Math.floor((now - new Date(p.start_time).getTime()) / 1000);
  }
  // Garante que o tempo restante não seja negativo
  return Math.max(0, dur * 60 - elapsed);
}

export function fmtTime(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * Verifica se uma data ISO ou YYYY-MM-DD corresponde a hoje (Local ou Simulado)
 */
export function isToday(iso: string, referenceNow?: Date) {
  if (!iso) return false;
  const t = referenceNow || new Date();

  // Tratamento especial para datas curtas (YYYY-MM-DD) para evitar problemas de fuso horário (UTC vs Local)
  let d: Date;
  if (iso.length === 10) {
    d = new Date(iso.replace(/-/g, "/"));
  } else {
    d = new Date(iso);
  }

  return (
    d.getDate() === t.getDate() &&
    d.getMonth() === t.getMonth() &&
    d.getFullYear() === t.getFullYear()
  );
}

export function isHabitDueToday(habit: Habit, referenceNow?: Date) {
  if (!habit.last_done) return true;
  if (isToday(habit.last_done, referenceNow)) return true;

  const lastDate = new Date(habit.last_done);
  const effectiveInterval = Math.max(1, habit.cooldown_days);
  const nextDate = new Date(lastDate);
  nextDate.setDate(nextDate.getDate() + effectiveInterval);
  nextDate.setHours(0, 0, 0, 0);

  const now = referenceNow ? referenceNow.getTime() : Date.now();
  return nextDate.getTime() <= now;
}

/**
 * Retorna a data do início da semana atual no formato YYYY-MM-DD
 */
export function startOfWeekIso(referenceNow?: Date, weekStartDay: number = 1) {
  const now = referenceNow || new Date();
  const day = now.getDay();
  // Se weekStartDay for 1 (Seg), domingo (0) vira 7 para o cálculo do diff
  const dayAdjusted = weekStartDay === 1 && day === 0 ? 7 : day;
  const diff = now.getDate() - dayAdjusted + weekStartDay;
  const s = new Date(now.getFullYear(), now.getMonth(), diff);
  const y = s.getFullYear();
  const m = String(s.getMonth() + 1).padStart(2, "0");
  const d = String(s.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDurationMin(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function getHabitStreak(habit: Habit, referenceNow?: Date) {
  const isNegative =
    habit.habit_type === "Bad" || habit.habit_type === "Negative";
  if (!isNegative) return habit.current_streak || 0;

  if (!habit.last_slip) return 0;
  const slip = new Date(habit.last_slip);
  const now = referenceNow || new Date();
  const diff = now.getTime() - slip.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
