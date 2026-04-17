export interface SubjectStats {
  name: string;
  hours: number;
  hit_rate: number;
  percent_total: number;
}

export interface CrossMetric {
  date: string;
  sleep_hours: number;
  study_hours: number;
  study_hit_rate: number;
  questions_total: number;
  focus_score?: number;
  reading_pages: number;
  reading_minutes: number;
  reading_ppm: number;
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
  // Novas métricas
  consistency_score: number;
  study_efficiency: number;
  rested_hit_rate: number;
  tired_hit_rate: number;
  avg_focus_score: number;
  focus_hit_rate_high: number;
  focus_hit_rate_low: number;
  subject_distribution: SubjectStats[];
}
