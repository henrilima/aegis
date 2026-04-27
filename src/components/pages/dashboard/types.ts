export type ModColor =
  | "teal"
  | "blue"
  | "amber"
  | "orange"
  | "red"
  | "green"
  | "violet"
  | "sky"
  | "neutral";

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

export interface AppAlarm {
  id?: number;
  user_id: string;
  title: string;
  alarm_type: string;
  time: string;
  interval_minutes: number | null;
  last_triggered: string | null;
  sound_file: string;
  icon: string;
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
  reading_streak_days: number;
  peak_study_subject: string | null;
  avg_reading_pages: number;
  avg_reading_minutes: number;
  avg_ppm: number;
  consistency_score: number;
  study_efficiency: number;
  rested_hit_rate: number;
  tired_hit_rate: number;
  avg_focus_score: number;
  focus_hit_rate_high: number;
  focus_hit_rate_low: number;
  subject_distribution: SubjectStats[];
}
