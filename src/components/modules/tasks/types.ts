export interface Task {
  id?: number;
  userId: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
  createdAt: string;
  parentId?: number;
  priority?: number;
  category?: string;
  color?: string;
  /** Data e hora em que a tarefa foi concluída (ISO 8601) */
  completedAt?: string;
  /** Status do kanban: "todo" | "doing" | "done" */
  status?: "todo" | "doing" | "done";
  /** Tempo total acumulado em segundos (persistido no banco) */
  timeSpentSeconds?: number;
  /** Recorrência configurada: "none" | "daily" | "weekly" | "monthly" */
  recurrence?: "none" | "daily" | "weekly" | "monthly";
}

/** Formata a data/hora de conclusão para exibição amigável (ex: "07/10 às 19:04") */
export function formatCompletedAt(rawDate?: string): string | null {
  if (!rawDate) return null;
  try {
    const d = new Date(rawDate);
    if (Number.isNaN(d.getTime())) return rawDate;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month} às ${hours}:${minutes}`;
  } catch {
    return rawDate;
  }
}

/** Formata data de vencimento (YYYY-MM-DD) para o padrão brasileiro (DD/MM/YYYY) */
export function formatDueDate(rawDate?: string): string {
  if (!rawDate) return "";
  const parts = rawDate.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return rawDate;
}
