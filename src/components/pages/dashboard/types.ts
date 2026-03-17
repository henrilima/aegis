export type ModColor = "teal" | "blue" | "amber" | "orange" | "red" | "neutral";

export interface Habit {
  id?: number;
  user_id: string;
  name: string;
  habit_type: string;
  last_done: string | null;
  current_streak: number;
}

export interface Note {
  id?: number;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  status: string;
  pinned: boolean;
}

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
  enabled: boolean;
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

export interface SubjectStats {
  name: string;
  hours: number;
  hit_rate: number;
  percent_total: number;
}

export interface PerformanceSummary {
  avg_sleep_hours: number;
  avg_study_hours: number;
  avg_hit_rate: number;
  best_sleep_day: string | null;
  best_study_day: string | null;
  correlation_label: string;
  total_days_analyzed: number;
  study_streak_days: number;
  sleep_streak_days: number;
  peak_study_subject: string | null;
  consistency_score: number;
  study_efficiency: number;
}
