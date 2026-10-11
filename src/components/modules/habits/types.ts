export interface Habit {
  id?: number;
  userId: string;
  name: string;
  habitType: string;
  lastSlip: string;
  createdAt: string;
  maxStreak: number;
  cooldownDays: number;
  lastDone: string | null;
  chargesUsed: number;
  chargesAmount: number;
  chargesIntervalDays: number;
  accumulates: boolean;
  lastChargeRefill: string;
  currentCharges: number;
  currentStreak: number;
  goalDays?: number;
  frequency?: "daily" | "weekdays";
  weekdays?: string;
  completedDates?: string[];
  archived?: boolean;
  targetTime?: string | null;
}

export interface SoberLog {
  id?: number;
  habitId: number;
  logType: "pledge" | "review" | "relapse";
  timestamp: string;
  logDate: string;
  difficulty?: "Fácil" | "Médio" | "Difícil";
  triggerType?:
    | "Estresse"
    | "Ansiedade"
    | "Tédio"
    | "Influência Social"
    | "Cansaço";
  notes?: string;
}

export type GoalTimeframe = "annual" | "quarterly" | "semiannual";
export type GoalStatus = "in_progress" | "completed" | "paused";

export interface HabitMilestone {
  id?: number;
  goalId?: number;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: string | null;
  dueDate?: string | null;
  orderIndex: number;
  taskId?: number | null;
  taskTitle?: string | null;
  taskCompleted?: boolean | null;
}

export interface HabitGoal {
  id?: number;
  userId: string;
  title: string;
  description?: string;
  category?: string;
  timeframe: GoalTimeframe;
  periodLabel: string;
  startDate?: string | null;
  endDate?: string | null;
  color?: string | null;
  status: GoalStatus;
  createdAt: string;
  milestones: HabitMilestone[];
  progress?: number;
}
