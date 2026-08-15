"use client";

import type { StudySession, SubjectData } from "./types";

// Utilitários de data

export function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function startOfWeek(d: Date, weekStartDay: number = 1) {
  const day = d.getDay();
  // Se weekStartDay for 1 (Seg), domingo (0) vira 7 para o cálculo do diff
  const dayAdjusted = weekStartDay === 1 && day === 0 ? 7 : day;
  const diff = d.getDate() - dayAdjusted + weekStartDay;
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

export function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function parseDate(s: string) {
  const [y, m, dd] = s.split("-").map(Number);
  return new Date(y, m - 1, dd);
}

export function hitRate(correct: number, total: number) {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export function formatHours(h: number) {
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  if (hrs === 0) return `${mins}min`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}min`;
}

// Converte horário no formato "HH:MM" para minutos do dia
export function timeToMinutes(t?: string | null): number {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Calcula os minutos de intervalo configurados para a aula
export function calcScheduleBreakMinutes(
  breakStart?: string | null,
  breakEnd?: string | null,
): number {
  if (!breakStart || !breakEnd) return 0;
  const bStart = timeToMinutes(breakStart);
  const bEnd = timeToMinutes(breakEnd);
  return Math.max(0, bEnd - bStart);
}

// Calcula a duração líquida da aula em minutos (descontando o intervalo se houver)
export function calcScheduleNetMinutes(schedule: {
  startTime: string;
  endTime: string;
  breakStartTime?: string | null;
  breakEndTime?: string | null;
}): number {
  const start = timeToMinutes(schedule.startTime);
  const end = timeToMinutes(schedule.endTime);
  const rawMin = end - start;
  if (rawMin <= 0) return 60;

  const breakMin = calcScheduleBreakMinutes(
    schedule.breakStartTime,
    schedule.breakEndTime,
  );
  if (breakMin > 0 && breakMin < rawMin) {
    return Math.max(15, rawMin - breakMin);
  }
  return rawMin;
}

// Calcula a duração líquida da aula em horas com arredondamento
export function calcScheduleNetHours(schedule: {
  startTime: string;
  endTime: string;
  breakStartTime?: string | null;
  breakEndTime?: string | null;
}): number {
  const netMin = calcScheduleNetMinutes(schedule);
  return Math.round((netMin / 60) * 100) / 100;
}

// Lógica de Computação

export function computeStats(arr: StudySession[]) {
  return {
    hours: arr.reduce((a, s) => a + s.hours, 0),
    questions: arr.reduce((a, b) => a + b.questionsNew + b.questionsReview, 0),
    questionsNew: arr.reduce((a, s) => a + s.questionsNew, 0),
    correctNew: arr.reduce((a, s) => a + s.correctNew, 0),
    questionsReview: arr.reduce((a, s) => a + s.questionsReview, 0),
    correctReview: arr.reduce((a, s) => a + s.correctReview, 0),
    pages: arr.reduce((a, s) => a + (s.pagesRead || 0), 0),
    sessionsCount: arr.length,
  };
}

export function computeSubjectMap(sessions: StudySession[]) {
  const m: Record<string, SubjectData> = {};
  for (const s of sessions) {
    if (!m[s.subject])
      m[s.subject] = { hours: 0, qNew: 0, cNew: 0, qRev: 0, cRev: 0 };
    m[s.subject].hours += s.hours;
    m[s.subject].qNew += s.questionsNew;
    m[s.subject].cNew += s.correctNew;
    m[s.subject].qRev += s.questionsReview;
    m[s.subject].cRev += s.correctReview;
  }
  return m;
}
