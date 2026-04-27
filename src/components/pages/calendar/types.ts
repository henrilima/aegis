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
  user_id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  event_type: EventType;
  deadline_category?: DeadlineCategory;
  color?: string;
  is_holiday?: boolean;
  created_at?: string;
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

export const EVENT_COLOR_OPTIONS = [
  { label: "Azul", value: "#3b82f6" },
  { label: "Verde", value: "#22c55e" },
  { label: "Amarelo", value: "#eab308" },
  { label: "Laranja", value: "#f97316" },
  { label: "Vermelho", value: "#ef4444" },
  { label: "Rosa", value: "#ec4899" },
  { label: "Roxo", value: "#8b5cf6" },
  { label: "Ciano", value: "#06b6d4" },
  { label: "Branco", value: "#e5e7eb" },
];

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
