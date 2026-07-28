// Tipos do módulo de Simulados & Notas

export interface StudyGrade {
  id?: number;
  userId: string;
  subject: string;
  /** Tipo da avaliação */
  gradeType: "prova" | "simulado" | "atividade" | "trabalho" | "quiz";
  /** Título ou identificador opcional (ex: "P1", "Simulado ENEM") */
  title?: string;
  /** Nota obtida */
  grade: number;
  /** Nota máxima possível */
  maxGrade: number;
  /** Peso para médias ponderadas */
  weight: number;
  questionsTotal: number;
  questionsCorrect: number;
  date: string;
  note?: string;
  createdAt?: string;
  halfGrade?: boolean;
}

export interface SubjectMeta {
  id?: number;
  userId: string;
  name: string;
  color: string;
  weeklyTargetHours?: number;
}

export interface SubjectGroup {
  id?: number;
  userId: string;
  name: string;
  subjects: string[];
  color?: string;
}

export interface SubjectFormula {
  id?: number;
  userId: string;
  subject: string;
  /** Tipo: simples | ponderada | ufpe | meta | personalizada */
  formulaType: "simples" | "ponderada" | "ufpe" | "meta" | "personalizada";
  passingGrade: number;
  customFormula?: string;
}

export type GradesTabId = "visao-geral" | "materias" | "historico" | "guia";

export const GRADE_TYPE_LABELS: Record<StudyGrade["gradeType"], string> = {
  prova: "Prova",
  simulado: "Simulado",
  atividade: "Atividade",
  trabalho: "Trabalho",
  quiz: "Quiz",
};

/** Resultado de aprovação para uma matéria */
export interface SubjectStatus {
  subject: string;
  average: number;
  passingGrade: number;
  status: "aprovado" | "em-risco" | "reprovado" | "sem-nota";
  gradesCount: number;
  hitRate: number;
  formulaType: string;
}
