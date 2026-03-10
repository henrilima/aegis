"use client";

import type { StudySession, StudyStats, SubjectData } from "./types";

// ─── Utilitários de data ──────────────────────────────────────────────────────

export function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function startOfWeek(d: Date) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
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

// ─── Lógica de Computação ───────────────────────────────────────────────────

export function computeStats(arr: StudySession[]) {
  return {
    hours: arr.reduce((a, s) => a + s.hours, 0),
    questions: arr.reduce(
      (a, b) => a + b.questions_new + b.questions_review,
      0,
    ),
    questionsNew: arr.reduce((a, s) => a + s.questions_new, 0),
    correctNew: arr.reduce((a, s) => a + s.correct_new, 0),
    questionsReview: arr.reduce((a, s) => a + s.questions_review, 0),
    correctReview: arr.reduce((a, s) => a + s.correct_review, 0),
    pages: arr.reduce((a, s) => a + (s.pages_read || 0), 0),
    sessionsCount: arr.length,
  };
}

export function generateReport({
  weekStats,
  monthStats,
  allStats,
  goalValue,
}: {
  weekStats: StudyStats;
  monthStats: StudyStats;
  allStats: StudyStats;
  goalValue: (type: string) => number;
}) {
  const lines = [
    `📊 RELATÓRIO DE ESTUDOS — ${new Date().toLocaleDateString("pt-BR")}`,
    ``,
    `📅 SEMANA ATUAL`,
    `  ⏱ Tempo: ${formatHours(weekStats.hours)} / ${goalValue("weekly_hours") ? formatHours(goalValue("weekly_hours")) : "—"}`,
    `  📝 Questões: ${weekStats.questions} / ${goalValue("weekly_questions") || "—"}`,
    `  📖 Páginas: ${weekStats.pages} / ${goalValue("weekly_pages") || "—"}`,
    `  ✅ Acerto Inéditas: ${hitRate(weekStats.correctNew, weekStats.questionsNew)}%`,
    `  🔄 Acerto Refeitas: ${hitRate(weekStats.correctReview, weekStats.questionsReview)}%`,
    ``,
    `📆 MÊS ATUAL`,
    `  ⏱ Tempo: ${formatHours(monthStats.hours)} / ${goalValue("monthly_hours") ? formatHours(goalValue("monthly_hours")) : "—"}`,
    `  📝 Questões: ${monthStats.questions} / ${goalValue("monthly_questions") || "—"}`,
    `  📖 Páginas: ${monthStats.pages} / ${goalValue("monthly_pages") || "—"}`,
    ``,
    `🏆 TOTAL ACUMULADO`,
    `  ⏱ Total de Horas: ${formatHours(allStats.hours)}`,
    `  📝 Total de Questões: ${allStats.questions}`,
    `  📖 Total de Páginas: ${allStats.pages}`,
    `  🎓 Sessões Realizadas: ${allStats.sessionsCount}`,
  ];
  return lines.join("\n");
}

export function computeSubjectMap(sessions: StudySession[]) {
  const m: Record<string, SubjectData> = {};
  for (const s of sessions) {
    if (!m[s.subject])
      m[s.subject] = { hours: 0, qNew: 0, cNew: 0, qRev: 0, cRev: 0 };
    m[s.subject].hours += s.hours;
    m[s.subject].qNew += s.questions_new;
    m[s.subject].cNew += s.correct_new;
    m[s.subject].qRev += s.questions_review;
    m[s.subject].cRev += s.correct_review;
  }
  return m;
}
