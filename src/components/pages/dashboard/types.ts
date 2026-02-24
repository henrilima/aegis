export type ModColor = "teal" | "blue" | "amber" | "orange" | "red" | "neutral";

export interface PomodoroState {
  cycle_type: string;
  cycles_completed: number;
  is_running: boolean;
  start_time: string | null;
  accumulated_seconds: number;
  work_minutes: number;
  break_minutes: number;
}

export interface PasswordEntry {
  id?: number;
  site: string;
}

export interface HydrationReminder {
  id?: number;
  reminder_type: string;
  value: string;
}

export interface StudySession {
  id?: number;
  user_id: string;
  date: string;
  subject: string;
  hours: number;
  questions_new: number;
  questions_review: number;
  correct_new: number;
  correct_review: number;
  note?: string;
}

export interface StudyGoal {
  goal_type: string;
  target_value: number;
}

export interface SleepEntry {
  id?: number;
  user_id: string;
  date: string;
  bedtime: string;
  wake_time: string;
  duration_minutes: number;
  quality: number;
  note?: string;
}

export interface SleepGoal {
  target_hours: number;
  target_bedtime: string;
}
