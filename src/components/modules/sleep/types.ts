export interface SleepEntry {
  id?: number;
  userId: string;
  date: string;
  bedtime: string;
  wakeTime: string;
  durationMinutes: number;
  nap_minutes?: number;
  quality: number;
  note?: string;
  createdAt?: string;
  caffeine?: boolean;
  screens?: boolean;
  alcohol?: boolean;
  exercise?: boolean;
}

export interface SleepDream {
  id?: number;
  userId: string;
  date: string;
  content: string;
  dreamType: string; // "lúcido" | "comum" | "pesadelo"
  createdAt?: string;
}

export interface SleepGoal {
  userId: string;
  targetHours: number;
  targetBedtime: string;
  reminderEnabled: boolean;
}

export interface WeekStats {
  avgDuration: number;
  avgQuality: number;
  totalNights: number;
  consistency: number;
  entries: SleepEntry[];
}
