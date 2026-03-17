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
  // Campos multidisciplinares opcionais
  pages_read?: number;
  custom_metric_label?: string;
  custom_metric_value?: number;
  focus_score?: number;
}

export interface StudyGoal {
  id?: number;
  user_id: string;
  goal_type:
    | "weekly_hours"
    | "monthly_hours"
    | "weekly_questions"
    | "monthly_questions"
    | "weekly_pages"
    | "monthly_pages";
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

export type TabId =
  | "visao-geral"
  | "historico"
  | "desempenho"
  | "relatorio"
  | "heatmap";

export interface StudyStats {
  hours: number;
  questions: number;
  questionsNew: number;
  correctNew: number;
  questionsReview: number;
  correctReview: number;
  pages: number;
  sessionsCount: number;
}

export interface SubjectData {
  hours: number;
  qNew: number;
  cNew: number;
  qRev: number;
  cRev: number;
}
