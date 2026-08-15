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
