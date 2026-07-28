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
  /** Status do kanban: "todo" | "doing" | "done" */
  status?: "todo" | "doing" | "done";
  /** Tempo total acumulado em segundos (persistido no banco) */
  timeSpentSeconds?: number;
}
