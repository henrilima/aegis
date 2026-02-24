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
  created_at?: string;
}

export interface StudyGoal {
  id?: number;
  user_id: string;
  goal_type:
    | "weekly_hours"
    | "monthly_hours"
    | "weekly_questions"
    | "monthly_questions";
  target_value: number;
}

export interface DayStats {
  date: string;
  totalHours: number;
  totalNew: number;
  totalReview: number;
  totalCorrectNew: number;
  totalCorrectReview: number;
  subjects: string[];
  sessions: StudySession[];
}
