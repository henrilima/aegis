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
