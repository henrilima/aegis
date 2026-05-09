export type EventType = "event" | "deadline" | "holiday";
export type DeadlineCategory =
  | "prova"
  | "trabalho"
  | "simulado"
  | "estudo"
  | "reunião"
  | "exame"
  | "entrega"
  | "pessoal";

export interface CalendarEvent {
  id?: number;
  userId: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  eventType: EventType;
  deadlineCategory?: DeadlineCategory;
  color?: string;
  isHoliday?: boolean;
  createdAt?: string;
}

export const DEADLINE_LABELS: Record<DeadlineCategory, string> = {
  prova: "Prova",
  trabalho: "Trabalho",
  simulado: "Simulado",
  estudo: "Estudo",
  reunião: "Reunião",
  exame: "Exame",
  entrega: "Entrega",
  pessoal: "Pessoal",
};

export const DEADLINE_COLORS: Record<DeadlineCategory, string> = {
  prova: "#ef4444",
  trabalho: "#f97316",
  simulado: "#8b5cf6",
  estudo: "#3b82f6",
  reunião: "#10b981",
  exame: "#f43f5e",
  entrega: "#6366f1",
  pessoal: "#6b7280",
};

import { SELECTABLE_COLORS } from "@/colors.config";

export const EVENT_COLOR_OPTIONS = SELECTABLE_COLORS.map((c) => ({
  label: c.label,
  value: c.key,
}));

/** Calcula quantos dias faltam para a data (positivo = futuro, 0 = hoje, negativo = passado) */
export function daysUntil(dateStr: string, referenceNow?: Date): number {
  const today = referenceNow ? new Date(referenceNow) : new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = dateStr.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  return Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
}

export function formatDaysUntil(days: number): string {
  if (days < 0)
    return `Passou há ${Math.abs(days)} dia${Math.abs(days) !== 1 ? "s" : ""}`;
  if (days === 0) return "Hoje!";
  if (days === 1) return "Amanhã!";
  return `Faltam ${days} dias`;
}
