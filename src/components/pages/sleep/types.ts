export interface SleepEntry {
  id?: number;
  user_id: string;
  date: string;
  bedtime: string;
  wake_time: string;
  duration_minutes: number;
  nap_minutes?: number;
  quality: number;
  note?: string;
  created_at?: string;
}

export interface SleepGoal {
  user_id: string;
  target_hours: number;
  target_bedtime: string;
  reminder_enabled: boolean;
}

export interface WeekStats {
  avgDuration: number;
  avgQuality: number;
  totalNights: number;
  consistency: number;
  entries: SleepEntry[];
}
