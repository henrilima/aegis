"use client";

import type { StudyGrade, SubjectFormula, SubjectStatus } from "./types";

// ─── Utilitários de data ───────────────────────────────────────────────────────

export function parseDate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// ─── Cálculo de porcentagem ────────────────────────────────────────────────────

/** Converte nota/máximo para percentual 0-100 */
export function toPercent(grade: number, maxGrade: number): number {
  if (maxGrade === 0) return 0;
  return Math.round((grade / maxGrade) * 100 * 10) / 10;
}

/** Taxa de acerto em questões */
export function hitRate(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

// ─── Cálculo de médias por fórmula ────────────────────────────────────────────

/** Média simples (soma / quantidade) — notas normalizadas para 0-10 */
export function avgSimples(grades: StudyGrade[]): number {
  if (grades.length === 0) return 0;
  const sum = grades.reduce((a, g) => {
    const val = g.halfGrade ? g.grade / 2 : g.grade;
    return a + val;
  }, 0);
  return Math.round((sum / grades.length) * 100) / 100;
}

/** Média ponderada — considera o peso de cada avaliação */
export function avgPonderada(grades: StudyGrade[]): number {
  if (grades.length === 0) return 0;
  const totalWeight = grades.reduce((a, g) => a + g.weight, 0);
  if (totalWeight === 0) return 0;
  const sum = grades.reduce((a, g) => {
    const val = g.halfGrade ? g.grade / 2 : g.grade;
    return a + val * g.weight;
  }, 0);
  return Math.round((sum / totalWeight) * 100) / 100;
}

/**
 * Fórmula UFPE: precisa de ao menos 3 avaliações (P1, P2, P3)
 * Média = (N1×2 + N2×3 + N3×5) / 10
 * As notas são ordenadas cronologicamente.
 */
export function avgUFPE(grades: StudyGrade[]): number {
  const sorted = [...grades]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((g) => {
      const val = g.halfGrade ? g.grade / 2 : g.grade;
      return (val / g.maxGrade) * 10;
    });

  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  if (sorted.length === 2) {
    // Aplica proporcionalmente P1×2 e P2×3 sobre 5
    return Math.round(((sorted[0] * 2 + sorted[1] * 3) / 5) * 100) / 100;
  }
  // 3 ou mais: usa as 3 primeiras (P1, P2, P3)
  const n1 = sorted[0];
  const n2 = sorted[1];
  const n3 = sorted[2];
  return Math.round(((n1 * 2 + n2 * 3 + n3 * 5) / 10) * 100) / 100;
}

/**
 * Fórmula personalizada — eval seguro via Function constructor.
 * Variáveis disponíveis: N1, N2, ... Nn (notas normalizadas 0-10, ordenadas por data).
 * Exemplo: "(N1*2 + N2*3) / 5"
 */
export function avgCustom(grades: StudyGrade[], formula: string): number {
  if (!formula.trim() || grades.length === 0) return 0;
  try {
    const sorted = [...grades]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((g) => {
        const val = g.halfGrade ? g.grade / 2 : g.grade;
        return (val / g.maxGrade) * 10;
      });

    // Cria as variáveis N1 até N15. Inicializa com 0 caso a nota correspondente não exista.
    let vars = "";
    for (let i = 1; i <= 15; i++) {
      const val = sorted[i - 1] ?? 0;
      vars += `const N${i} = ${val}; `;
    }
    // Usa Function em vez de eval para ser um escopo isolado
    const result = new Function(`${vars} return (${formula});`)();
    if (typeof result !== "number" || Number.isNaN(result)) return 0;
    return Math.round(result * 100) / 100;
  } catch {
    return 0;
  }
}

export function calcAverage(
  grades: StudyGrade[],
  formula: SubjectFormula | undefined,
): number {
  const type = formula?.formulaType ?? "simples";
  switch (type) {
    case "ponderada":
      return avgPonderada(grades);
    case "ufpe":
      return avgUFPE(grades);
    case "personalizada":
      return avgCustom(grades, formula?.customFormula ?? "");
    case "meta":
      return grades.reduce((a, g) => {
        const val = g.halfGrade ? g.grade / 2 : g.grade;
        return a + val;
      }, 0);
    default:
      return avgSimples(grades);
  }
}

/** Retorna quantas notas faltam para a fórmula UFPE estar completa */
export function ufpeMissing(count: number): number {
  return Math.max(0, 3 - count);
}

/**
 * Calcula a nota necessária nas avaliações restantes para atingir a média.
 * Retorna null se já aprovado ou impossível.
 */
export function calcMetaNota(
  grades: StudyGrade[],
  formula: SubjectFormula | undefined,
  totalAvaliacoes: number,
): number | null {
  if (!formula) return null;
  const passingGrade = formula.passingGrade;
  const done = grades.length;
  if (done >= totalAvaliacoes) return null;

  const remaining = totalAvaliacoes - done;
  const isMeta = formula.formulaType === "meta";
  const currentSum = grades.reduce((a, g) => {
    const val = g.halfGrade ? g.grade / 2 : g.grade;
    return a + val;
  }, 0);
  // Nota necessária nas restantes
  const needed = isMeta
    ? (passingGrade - currentSum) / remaining
    : (passingGrade * totalAvaliacoes - currentSum) / remaining;
  if (needed <= 0) return 0; // Já aprovado
  return Math.round(needed * 10) / 10;
}

// ─── Status de aprovação ──────────────────────────────────────────────────────

export function getSubjectStatus(
  subject: string,
  grades: StudyGrade[],
  formula: SubjectFormula | undefined,
): SubjectStatus {
  if (grades.length === 0) {
    return {
      subject,
      average: 0,
      passingGrade: formula?.passingGrade ?? 7,
      status: "sem-nota",
      gradesCount: 0,
      hitRate: 0,
      formulaType: formula?.formulaType ?? "simples",
    };
  }

  const average = calcAverage(grades, formula);
  const passingGrade = formula?.passingGrade ?? 7;

  const totalQ = grades.reduce((a, g) => a + g.questionsTotal, 0);
  const totalC = grades.reduce((a, g) => a + g.questionsCorrect, 0);
  const hr = hitRate(totalC, totalQ);

  let status: SubjectStatus["status"];
  if (average >= passingGrade) {
    status = "aprovado";
  } else if (average >= passingGrade * 0.8) {
    status = "em-risco";
  } else {
    status = "reprovado";
  }

  return {
    subject,
    average,
    passingGrade,
    status,
    gradesCount: grades.length,
    hitRate: hr,
    formulaType: formula?.formulaType ?? "simples",
  };
}

/** Formata uma nota para exibição */
export function fmtGrade(grade: number, decimals = 1): string {
  return grade.toFixed(decimals);
}

/** Formata tipo de avaliação */
export const GRADE_TYPE_COLORS: Record<string, string> = {
  prova: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  simulado: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  atividade: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  trabalho: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  quiz: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};
