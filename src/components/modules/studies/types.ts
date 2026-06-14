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
  createdAt?: string;
  // Campos multidisciplinares opcionais
  pagesRead?: number;
  custom_metric_label?: string;
  custom_metric_value?: number;
  focusScore?: number;
}

export interface StudyGoal {
  id?: number;
  userId: string;
  goalType:
    | "weekly_hours"
    | "monthly_hours"
    | "weekly_questions"
    | "monthly_questions"
    | "weekly_pages"
    | "monthly_pages";
  targetValue: number;
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
  | "relatorio"
  | "heatmap"
  | "guia";

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
