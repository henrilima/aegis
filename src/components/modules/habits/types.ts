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
}
