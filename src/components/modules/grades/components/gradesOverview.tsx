"use client";

import {
  AlertCircle,
  Award,
  BarChart2,
  BookOpen,
  Sparkles,
  Target,
  ThumbsUp,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { useMemo, useState } from "react";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { StudyGrade, SubjectFormula, SubjectStatus } from "../types";
import { fmtGrade, getSubjectStatus, hitRate } from "../utils";

interface GradesOverviewProps {
  grades: StudyGrade[];
  formulas: SubjectFormula[];
  allSubjects: string[];
  userId: string;
}

export function GradesOverview({
  grades,
  formulas,
  allSubjects,
  userId,
}: GradesOverviewProps) {
  const color = getModuleColor("grades");
  const theme = getColorTheme(color);

  // Matérias Ativas (persiste em localStorage por usuário como array JSON)
  const [activeSubjects] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`aegis-active-subjects-${userId}`);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          const old = localStorage.getItem(`aegis-active-subject-${userId}`);
          return old ? [old] : [];
        }
      }
      const old = localStorage.getItem(`aegis-active-subject-${userId}`);
      return old ? [old] : [];
    }
    return [];
  });

  const validActiveSubjects = useMemo(() => {
    return activeSubjects.filter((s) => allSubjects.includes(s));
  }, [activeSubjects, allSubjects]);

  const subjects = allSubjects;

  const formulaMap = useMemo(() => {
    return Object.fromEntries(formulas.map((f) => [f.subject, f]));
  }, [formulas]);

  // Status de cada matéria
  const statuses: SubjectStatus[] = useMemo(() => {
    return subjects.map((s) => {
      const subjectGrades = grades.filter((g) => g.subject === s);
      return getSubjectStatus(s, subjectGrades, formulaMap[s]);
    });
  }, [subjects, grades, formulaMap]);

  // Estatísticas globais
  const totalGrades = grades.length;
  const totalQ = grades.reduce((a, g) => a + g.questionsTotal, 0);
  const totalC = grades.reduce((a, g) => a + g.questionsCorrect, 0);
  const globalHitRate = hitRate(totalC, totalQ);
  const globalAverage = useMemo(() => {
    return subjects.length > 0
      ? Math.round(
          (statuses.reduce((a, s) => a + s.average, 0) / statuses.length) * 100,
        ) / 100
      : 0;
  }, [subjects, statuses]);

  // Extrair as matérias que têm notas registradas
  const subjectsWithGrades = useMemo(() => {
    return statuses.filter((s) => s.gradesCount > 0);
  }, [statuses]);

  // Matéria com Maior Rendimento (melhor média)
  const bestSubject = useMemo(() => {
    if (subjectsWithGrades.length === 0) return null;
    return subjectsWithGrades.reduce((best, current) =>
      current.average > best.average ? current : best,
    );
  }, [subjectsWithGrades]);

  // Matéria com Foco Recomendado (menor média, ignorando se for a única cadastrada com notas)
  const worstSubject = useMemo(() => {
    if (subjectsWithGrades.length <= 1) return null;
    return subjectsWithGrades.reduce((worst, current) =>
      current.average < worst.average ? current : worst,
    );
  }, [subjectsWithGrades]);

  // Estatísticas de Aprovação Geral das Matérias
  const approvalStats = useMemo(() => {
    const total = subjectsWithGrades.length;
    const approved = subjectsWithGrades.filter(
      (s) => s.status === "aprovado",
    ).length;
    const pct = total > 0 ? Math.round((approved / total) * 100) : 0;
    return { approved, total, pct };
  }, [subjectsWithGrades]);

  // Médias e aproveitamento agrupado por tipo de avaliação
  const averageByType = useMemo(() => {
    const types: ("prova" | "simulado" | "atividade" | "trabalho" | "quiz")[] =
      ["prova", "simulado", "atividade", "trabalho", "quiz"];

    return types
      .map((type) => {
        const typeGrades = grades.filter((g) => g.gradeType === type);
        const count = typeGrades.length;

        let average = 0;
        if (count > 0) {
          const sumNormalized = typeGrades.reduce((sum, g) => {
            const max = g.maxGrade > 0 ? g.maxGrade : 10;
            return sum + (g.grade / max) * 10;
          }, 0);
          average = Math.round((sumNormalized / count) * 100) / 100;
        }

        return {
          type,
          count,
          average,
        };
      })
      .filter((t) => t.count > 0);
  }, [grades]);

  // Matérias que precisam de atenção (apenas para as ativas)
  const attentionSubjects = useMemo(() => {
    return statuses.filter(
      (s) =>
        validActiveSubjects.includes(s.subject) &&
        ((s.gradesCount > 0 && s.average < s.passingGrade) ||
          s.status === "reprovado" ||
          s.status === "em-risco" ||
          (s.hitRate > 0 && s.hitRate < 60)),
    );
  }, [statuses, validActiveSubjects]);

  // Projeção de Notas para matérias ativas
  const activeReports = useMemo(() => {
    if (validActiveSubjects.length === 0) return [];

    return validActiveSubjects.map((sub) => {
      const activeStatus = statuses.find((s) => s.subject === sub);
      const passing = activeStatus?.passingGrade ?? 7.0;
      const currentAvg = activeStatus?.average ?? 0.0;
      const formulaType = activeStatus?.formulaType ?? "simples";

      const subjectGrades = grades.filter((g) => g.subject === sub);
      const n = subjectGrades.length;

      if (n === 0) {
        return {
          subject: sub,
          formulaType,
          currentAvg: 0,
          passing,
          isApproved: false,
          neededAvg: passing,
          needed: null,
        };
      }

      if (currentAvg >= passing) {
        return {
          subject: sub,
          formulaType,
          currentAvg,
          passing,
          isApproved: true,
          neededAvg: 0,
          needed: null,
        };
      }

      if (formulaType === "meta") {
        const currentSum = subjectGrades.reduce((a, g) => {
          const val = g.halfGrade ? g.grade / 2 : g.grade;
          return a + val;
        }, 0);
        const needed = passing - currentSum;
        const isApp = needed <= 0;
        return {
          subject: sub,
          formulaType,
          currentAvg: currentSum,
          passing,
          isApproved: isApp,
          neededAvg: isApp ? 0 : needed,
          needed: null,
        };
      }

      if (formulaType === "simples") {
        const currentSum = subjectGrades.reduce((a, g) => {
          const val = g.halfGrade ? g.grade / 2 : g.grade;
          return a + val;
        }, 0);

        const hasFinal = subjectGrades.some((g) => {
          const t = (g.title ?? "").toLowerCase();
          return (
            t.includes("final") ||
            t.includes("recupera") ||
            t.includes("rec") ||
            t.includes("exame")
          );
        });

        const hasSemesterAverage = subjectGrades.some((g) => {
          const t = (g.title ?? "").toLowerCase();
          return t.includes("média") || t.includes("media");
        });

        let needed = null;
        let passingTarget = passing;
        let neededAvgVal = Math.max(0, passing - currentAvg);
        let isApprovedVal = false;

        if (hasSemesterAverage) {
          passingTarget = 5.0;
          neededAvgVal = Math.max(0, 5.0 - currentAvg);
          if (hasFinal) {
            isApprovedVal = currentAvg >= 5.0;
            needed = null;
          } else {
            needed = 10.0 - currentAvg;
          }
        } else {
          needed = passing * (n + 1) - currentSum;
        }

        return {
          subject: sub,
          formulaType,
          currentAvg,
          passing: passingTarget,
          isApproved: isApprovedVal,
          neededAvg: neededAvgVal,
          needed: needed === null ? null : needed <= 0 ? 0 : needed,
        };
      }

      if (formulaType === "ponderada") {
        const currentSumWeighted = subjectGrades.reduce((a, g) => {
          const val = g.halfGrade ? g.grade / 2 : g.grade;
          return a + val * g.weight;
        }, 0);
        const currentWeight = subjectGrades.reduce((a, g) => a + g.weight, 0);

        const hasFinal = subjectGrades.some((g) => {
          const t = (g.title ?? "").toLowerCase();
          return (
            t.includes("final") ||
            t.includes("recupera") ||
            t.includes("rec") ||
            t.includes("exame")
          );
        });

        const hasSemesterAverage = subjectGrades.some((g) => {
          const t = (g.title ?? "").toLowerCase();
          return t.includes("média") || t.includes("media");
        });

        let needed = null;
        let passingTarget = passing;
        let neededAvgVal = Math.max(0, passing - currentAvg);
        let isApprovedVal = false;

        if (hasSemesterAverage) {
          passingTarget = 5.0;
          neededAvgVal = Math.max(0, 5.0 - currentAvg);
          if (hasFinal) {
            isApprovedVal = currentAvg >= 5.0;
            needed = null;
          } else {
            needed = 10.0 - currentAvg;
          }
        } else {
          const nextWeight = 1.0;
          needed =
            (passing * (currentWeight + nextWeight) - currentSumWeighted) /
            nextWeight;
        }

        return {
          subject: sub,
          formulaType,
          currentAvg,
          passing: passingTarget,
          isApproved: isApprovedVal,
          neededAvg: neededAvgVal,
          needed: needed === null ? null : needed <= 0 ? 0 : needed,
        };
      }

      return {
        subject: sub,
        formulaType,
        currentAvg,
        passing,
        isApproved: false,
        neededAvg: Math.max(0, passing - currentAvg),
        needed: null,
      };
    });
  }, [validActiveSubjects, statuses, grades]);

  return (
    <div className="flex flex-col gap-4">
      {/* KPIs globais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Avaliações",
            value: totalGrades,
            icon: BookOpen,
            suffix: "",
          },
          {
            label: "Matérias",
            value: subjects.length,
            icon: Target,
            suffix: "",
          },
          {
            label: "Média geral",
            value: fmtGrade(globalAverage),
            icon: Award,
            suffix: "/10",
          },
          {
            label: "Taxa de acerto",
            value: totalQ > 0 ? `${globalHitRate}%` : "—",
            icon: TrendingUp,
            suffix: "",
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="bg-card/50 border border-border rounded-xl p-4 flex flex-col gap-1.5 animate-in fade-in duration-300"
          >
            <div className="flex items-center gap-2">
              <kpi.icon className={cn("w-4 h-4", theme.text)} />
              <span className="text-xs text-muted-foreground font-medium">
                {kpi.label}
              </span>
            </div>
            <span className="text-2xl font-black text-foreground tabular-nums">
              {kpi.value}
              <span className="text-sm font-medium text-muted-foreground ml-0.5">
                {kpi.suffix}
              </span>
            </span>
          </div>
        ))}
      </div>

      {/* Grid de Insights e Destaques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Painel de Destaques */}
        <div className="bg-card/40 border border-border rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-foreground">
              Destaques Acadêmicos
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            {/* Maior Rendimento */}
            {bestSubject ? (
              <div className="bg-linear-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/10 rounded-xl p-3.5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Maior Rendimento
                  </span>
                  <h4 className="text-sm font-bold text-foreground truncate mt-1">
                    {bestSubject.subject}
                  </h4>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-black text-emerald-400 tabular-nums">
                    {fmtGrade(bestSubject.average)}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    média
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-background/20 border border-border/60 border-dashed rounded-xl p-3.5 flex items-center justify-center text-center">
                <span className="text-xs text-muted-foreground font-medium">
                  Sem dados de rendimento
                </span>
              </div>
            )}

            {/* Foco Recomendado */}
            {worstSubject ? (
              <div className="bg-linear-to-br from-rose-500/5 to-amber-500/5 border border-rose-500/10 rounded-xl p-3.5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                    Foco Recomendado
                  </span>
                  <h4 className="text-sm font-bold text-foreground truncate mt-1">
                    {worstSubject.subject}
                  </h4>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-black text-rose-400 tabular-nums">
                    {fmtGrade(worstSubject.average)}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    média
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-background/20 border border-border/60 border-dashed rounded-xl p-3.5 flex items-center justify-center text-center">
                <span className="text-xs text-muted-foreground font-medium">
                  Rendimento equilibrado
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Painel de Aproveitamento Geral */}
        <div className="bg-card/40 border border-border rounded-2xl p-5 flex flex-col justify-between gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-foreground">
              Aproveitamento das Disciplinas
            </h3>
          </div>

          <div className="flex flex-col gap-3 flex-1 justify-center">
            {subjectsWithGrades.length > 0 ? (
              <>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-muted-foreground font-medium">
                    Matérias aprovadas
                  </span>
                  <span className="text-lg font-black text-foreground tabular-nums">
                    {approvalStats.approved}{" "}
                    <span className="text-xs font-bold text-muted-foreground">
                      de {approvalStats.total}
                    </span>
                  </span>
                </div>

                {/* Barra de progresso */}
                <div className="h-3 w-full bg-neutral-800 rounded-full overflow-hidden relative border border-border/20">
                  <div
                    className="h-full bg-linear-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000"
                    style={{ width: `${approvalStats.pct}%` }}
                  />
                </div>

                <p className="text-[10px] text-muted-foreground font-medium leading-relaxed mt-1">
                  {approvalStats.pct === 100
                    ? "🎉 Excelente! 100% das matérias avaliadas já atingiram os critérios de aprovação."
                    : `${approvalStats.pct}% das matérias com avaliações inseridas estão atualmente aprovadas.`}
                </p>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground font-semibold">
                  Insira avaliações para calcular seu aproveitamento geral.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Relatórios Superiores (Matéria Ativa + Atenção e Rendimento) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Coluna 1 e 2: Projeção de Nota para Matérias Ativas */}
        <div className="lg:col-span-2 bg-card/40 border border-border rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Target className={cn("w-5 h-5", theme.text)} fill="currentColor" />
            <h3 className="text-sm font-bold text-foreground">
              Metas das Matérias Ativas
            </h3>
          </div>

          {activeReports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
              {activeReports.map((report) => (
                <div
                  key={report.subject}
                  className="bg-background/40 border border-border/80 rounded-xl p-3 flex flex-col gap-2 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-bold text-foreground truncate">
                        {report.subject}
                      </span>
                      <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider scale-95 origin-left shrink-0">
                        {report.formulaType === "simples"
                          ? "Simples"
                          : report.formulaType === "ponderada"
                            ? "Ponderada"
                            : report.formulaType === "meta"
                              ? "Meta"
                              : "Personalizada"}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0",
                        report.isApproved
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20",
                      )}
                    >
                      {report.isApproved ? "Aprovado" : "Pendente"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                    <div>
                      {report.formulaType === "meta"
                        ? "Nota acumulada:"
                        : "Média atual:"}{" "}
                      <span className="font-bold text-foreground">
                        {fmtGrade(report.currentAvg)}
                      </span>{" "}
                      / {fmtGrade(report.passing)}
                    </div>
                    {!report.isApproved && report.neededAvg !== undefined && (
                      <span className="text-rose-400/90 font-bold shrink-0">
                        Falta: {fmtGrade(report.neededAvg)}{" "}
                        {report.formulaType === "meta" ? "pontos" : "na média"}
                      </span>
                    )}
                  </div>

                  {!report.isApproved && report.needed !== null && (
                    <div className="text-[10px] text-muted-foreground/80 font-medium border-t border-border/20 pt-1.5 mt-0.5">
                      {report.needed > 10 ? (
                        <span className="text-amber-400/90 font-semibold flex items-center gap-1">
                          ⚠️ Requer mais de uma avaliação para atingir a meta
                        </span>
                      ) : (
                        <span>
                          Nota necessária para atingir a média:{" "}
                          <span className="font-bold text-foreground">
                            {fmtGrade(report.needed)}
                          </span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8 gap-2">
              <Target className="w-8 h-8 text-neutral-600/70 animate-pulse" />
              <p className="text-xs text-neutral-500 font-semibold max-w-sm">
                Não há matérias marcadas como meta ativa. Vá para a aba{" "}
                <strong className={theme.text}>Matérias</strong> e clique no
                alvo (🎯) para projetar suas metas aqui.
              </p>
            </div>
          )}
        </div>

        {/* Coluna 3: Notas que precisam de atenção & Rendimento por tipo */}
        <div className="flex flex-col gap-4">
          {/* Precisa de Atenção */}
          <div className="bg-card/40 border border-border rounded-2xl p-5 flex flex-col gap-4 flex-1">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              <h3 className="text-sm font-bold text-foreground">
                Precisa de Atenção
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[160px] custom-scrollbar flex flex-col gap-2">
              {attentionSubjects.length > 0 ? (
                attentionSubjects.map((s) => {
                  const isCriticalHit = s.hitRate > 0 && s.hitRate < 60;
                  const isLowAvg =
                    s.gradesCount > 0 && s.average < s.passingGrade;
                  return (
                    <div
                      key={s.subject}
                      className="flex flex-col gap-1.5 p-3 rounded-xl bg-rose-500/5 border border-rose-500/10"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-foreground truncate">
                          {s.subject}
                        </span>
                        <span className="text-xs font-black text-rose-500 tabular-nums shrink-0">
                          {s.gradesCount > 0 ? fmtGrade(s.average) : "—"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[9px] font-semibold">
                        <span className="text-rose-400/80 truncate">
                          {isLowAvg
                            ? `Abaixo da média (mínimo ${fmtGrade(s.passingGrade)})`
                            : isCriticalHit
                              ? `Desempenho baixo (${s.hitRate}% acertos)`
                              : "Atenção necessária"}
                        </span>
                        {isLowAvg && (
                          <span className="text-rose-400 shrink-0 font-bold">
                            Falta: {fmtGrade(s.passingGrade - s.average)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-6 gap-2 h-full">
                  <ThumbsUp className="w-6 h-6 text-emerald-400" />
                  <span className="text-[11px] text-neutral-500 font-semibold">
                    Tudo sob controle acadêmico!
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Distribuição por Tipo */}
          <div className="bg-card/40 border border-border rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-foreground">
                Rendimento por Tipo
              </h3>
            </div>

            <div className="flex flex-col gap-3 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
              {averageByType.length > 0 ? (
                averageByType.map((item) => {
                  const labelMap = {
                    prova: "Provas",
                    simulado: "Simulados",
                    atividade: "Atividades",
                    trabalho: "Trabalhos",
                    quiz: "Quizzes",
                  };
                  const colorMap = {
                    prova: "from-blue-500 to-indigo-500",
                    simulado: "from-purple-500 to-pink-500",
                    atividade: "from-emerald-500 to-teal-500",
                    trabalho: "from-amber-500 to-orange-500",
                    quiz: "from-cyan-500 to-blue-400",
                  };

                  const colors = colorMap[item.type] || colorMap.prova;
                  const label = labelMap[item.type] || item.type;
                  const pct = (item.average / 10) * 100;

                  return (
                    <div key={item.type} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-bold text-foreground/90 capitalize">
                            {label}
                          </span>
                          <span className="text-[9px] text-muted-foreground font-bold bg-neutral-800 border border-border/40 px-1.5 py-0.5 rounded-full shrink-0">
                            {item.count}
                          </span>
                        </div>
                        <span className="font-black text-foreground tabular-nums">
                          {fmtGrade(item.average)}/10
                        </span>
                      </div>

                      <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden border border-border/10">
                        <div
                          className={cn(
                            "h-full bg-linear-to-r rounded-full",
                            colors,
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-4">
                  <span className="text-xs text-muted-foreground font-medium">
                    Sem registros avaliados
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
