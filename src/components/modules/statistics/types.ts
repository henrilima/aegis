export interface SubjectStats {
  name: string;
  hours: number;
  hitRate: number;
  percentTotal: number;
}

export interface CrossMetric {
  date: string;
  sleepHours: number;
  studyHours: number;
  studyHitRate: number;
  questionsTotal: number;
  focusScore?: number;
  readingPages: number;
  readingMinutes: number;
  readingPpm: number;
}

export interface PerformanceSummary {
  avgSleepHours: number;
  avgStudyHours: number;
  avgHitRate: number;
  bestSleepDay: string | null;
  bestStudyDay: string | null;
  correlationLabel: string;
  totalDaysAnalyzed: number;
  studyStreakDays: number;
  sleepStreakDays: number;
  readingStreakDays: number;
  peakStudySubject: string | null;
  avgReadingPages: number;
  avgReadingMinutes: number;
  avgPpm: number;
  // Novas métricas
  consistencyScore: number;
  studyEfficiency: number;
  restedHitRate: number;
  tiredHitRate: number;
  avgFocusScore: number;
  focusHitRateHigh: number;
  focusHitRateLow: number;
  subjectDistribution: SubjectStats[];
}
