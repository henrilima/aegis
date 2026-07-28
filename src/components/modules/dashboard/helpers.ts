import type { Habit } from "@/components/modules/habits/types";
import type { PomodoroState } from "./types";

export function pomodoroClock(p: PomodoroState, referenceNow?: Date): number {
  const dur = p.cycleType === "Work" ? p.workMinutes : p.breakMinutes;
  let elapsed = p.accumulatedSeconds;
  // Adiciona o tempo decorrido se o timer estiver rodando
  if (p.isRunning && p.startTime) {
    const now = referenceNow ? referenceNow.getTime() : Date.now();
    elapsed += Math.floor((now - new Date(p.startTime).getTime()) / 1000);
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
  if (!habit.lastDone) return true;
  if (isToday(habit.lastDone, referenceNow)) return true;

  const lastDate = new Date(habit.lastDone);
  const effectiveInterval = Math.max(1, habit.cooldownDays);
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
    habit.habitType === "Bad" || habit.habitType === "Negative";
  if (!isNegative) return habit.currentStreak || 0;

  if (!habit.lastSlip) return 0;
  const slip = new Date(habit.lastSlip);
  const now = referenceNow || new Date();
  const diff = now.getTime() - slip.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function formatDateShort(iso: string) {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length >= 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return iso;
}

export function isHabitScheduledToday(h: Habit, referenceNow?: Date): boolean {
  if (h.archived) return false;
  if (!h.frequency || h.frequency === "daily") return true;
  if (h.frequency === "weekdays" && h.weekdays) {
    const weekday = (referenceNow || new Date()).getDay();
    const list = h.weekdays.split(",").map(Number);
    return list.includes(weekday);
  }
  return false;
}

export function isHabitDoneToday(h: Habit, referenceNow?: Date): boolean {
  const ref = referenceNow || new Date();
  const y = ref.getFullYear();
  const m = String(ref.getMonth() + 1).padStart(2, "0");
  const d = String(ref.getDate()).padStart(2, "0");
  const todayStr = `${y}-${m}-${d}`;

  if (Array.isArray(h.completedDates)) {
    return h.completedDates.includes(todayStr);
  }

  return h.lastDone ? isToday(h.lastDone, ref) : false;
}
