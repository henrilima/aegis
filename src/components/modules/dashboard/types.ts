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

import type { Habit as RealHabit } from "@/components/modules/habits/types";
export type Habit = RealHabit;

export interface Note {
  id?: number;
  userId: string;
  title: string;
  content: string;
  createdAt: string;
  status: string;
  pinned: boolean;
}

export interface PomodoroState {
  cycleType: string;
  cyclesCompleted: number;
  isRunning: boolean;
  startTime: string | null;
  accumulatedSeconds: number;
  workMinutes: number;
  breakMinutes: number;
}

export interface PasswordEntry {
  id?: number;
  site: string;
}

export interface AppAlarm {
  id?: number;
  userId: string;
  title: string;
  alarmType: string;
  time: string;
  intervalMinutes: number | null;
  lastTriggered: string | null;
  soundFile: string;
  icon: string;
  enabled: boolean;
}

export interface StudySession {
  id?: number;
  userId: string;
  date: string;
  subject: string;
  hours: number;
  questionsNew: number;
  questionsReview: number;
  correctNew: number;
  correctReview: number;
  note?: string;
}

export interface StudyGoal {
  goalType: string;
  targetValue: number;
}

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
}

export interface SleepGoal {
  targetHours: number;
  targetBedtime: string;
}

export interface SubjectStats {
  name: string;
  hours: number;
  hitRate: number;
  percentTotal: number;
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
  consistencyScore: number;
  studyEfficiency: number;
  restedHitRate: number;
  tiredHitRate: number;
  avgFocusScore: number;
  focusHitRateHigh: number;
  focusHitRateLow: number;
  subjectDistribution: SubjectStats[];
}
