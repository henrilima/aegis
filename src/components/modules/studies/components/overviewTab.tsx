import {
  Award,
  BookOpen,
  CheckCircle,
  ChevronRight,
  Clock,
  Target,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { StudyGrade } from "../../grades/types";
import { GOAL_LABELS } from "../goalPanel";
import type { StudyStats, SubjectData } from "../types";
import { formatHours, hitRate } from "../utils";

interface OverviewTabProps {
  weekStats: StudyStats;
  monthStats: StudyStats;
  allStats: StudyStats;
  goalValue: (type: string) => number;
  goalProgress: (current: number, type: string) => number;
  subjectMap: Record<string, SubjectData>;
  grades: StudyGrade[];
  onOpenGrades: () => void;
}

export function OverviewTab({
  weekStats,
  monthStats,
  goalValue,
  goalProgress,
  subjectMap,
  grades = [],
  onOpenGrades,
}: OverviewTabProps) {
  const color = getModuleColor("studies");
  const theme = getColorTheme(color);

  // Estatísticas de simulados e notas
  const gradesStats = useMemo(() => {
    if (!grades || grades.length === 0) return null;
    const total = grades.length;
    const sum = grades.reduce((acc, curr) => {
      const norm = curr.maxGrade > 0 ? (curr.grade / curr.maxGrade) * 10 : 0;
      return acc + norm;
    }, 0);
    const avg = Math.round((sum / total) * 10) / 10;

    const totalQuestions = grades.reduce(
      (acc, curr) => acc + curr.questionsTotal,
      0,
    );
    const correctQuestions = grades.reduce(
      (acc, curr) => acc + curr.questionsCorrect,
      0,
    );
    const hitRateVal =
      totalQuestions > 0
        ? Math.round((correctQuestions / totalQuestions) * 100)
        : 0;

    return {
      total,
      avg,
      hitRate: hitRateVal,
      hasQuestions: totalQuestions > 0,
    };
  }, [grades]);

  // Média de progresso das metas mensais para um "Score" global
  const monthlyTargetHours = goalValue("monthly_hours");
  const monthlyTargetQuestions = goalValue("monthly_questions");
  const monthlyTargetPages = goalValue("monthly_pages");

  // Cálculo de progresso individual (0 se não houver meta)
  const hPct = monthlyTargetHours
    ? (monthStats.hours / monthlyTargetHours) * 100
    : 0;
  const qPct = monthlyTargetQuestions
    ? (monthStats.questions / monthlyTargetQuestions) * 100
    : 0;
  const pPct = monthlyTargetPages
    ? (monthStats.pages / monthlyTargetPages) * 100
    : 0;

  // Média apenas das metas que possuem valor definido
  const activeTargetsCount = [
    monthlyTargetHours,
    monthlyTargetQuestions,
    monthlyTargetPages,
  ].filter((t) => t > 0).length;
  const monthlyFocus =
    activeTargetsCount > 0
      ? Math.min(100, Math.round((hPct + qPct + pPct) / activeTargetsCount))
      : 0;

  const hasRecords = monthStats.sessionsCount > 0;

  const statCards = [
    {
      label: "Tempo no Mês",
      value: formatHours(monthStats.hours),
      icon: Clock,
      sub: `Meta: ${monthlyTargetHours ? formatHours(monthlyTargetHours) : "-"}`,
      progress: goalProgress(monthStats.hours, "monthly_hours"),
      tooltip: "Tempo total dedicado aos estudos no mês atual.",
    },
    {
      label: "Páginas (Mês)",
      value: monthStats.pages,
      icon: BookOpen,
      sub: `Meta: ${monthlyTargetPages || "-"}`,
      progress: goalProgress(monthStats.pages, "monthly_pages"),
      tooltip: "Total de páginas lidas em materiais de estudo no mês.",
    },
    {
      label: "Questões (Mês)",
      value: monthStats.questions,
      icon: CheckCircle,
      sub: `Meta: ${monthlyTargetQuestions || "-"}`,
      progress: goalProgress(monthStats.questions, "monthly_questions"),
      tooltip: "Total de questões respondidas (estudo e revisão) no mês.",
    },
    {
      label: "Acerto Mensal",
      value: `${hitRate(monthStats.correctNew + monthStats.correctReview, monthStats.questionsNew + monthStats.questionsReview)}%`,
      icon: TrendingUp,
      sub: `${monthStats.correctNew + monthStats.correctReview}/${monthStats.questionsNew + monthStats.questionsReview} acertos`,
      progress: hitRate(
        monthStats.correctNew + monthStats.correctReview,
        monthStats.questionsNew + monthStats.questionsReview,
      ),
      tooltip: "Porcentagem de acertos em questões respondidas no mês.",
    },
  ];

  const goalBars = [
    {
      type: "weekly_hours",
      current: weekStats.hours,
      fmt: (v: number) => formatHours(v),
    },
    {
      type: "monthly_hours",
      current: monthStats.hours,
      fmt: (v: number) => formatHours(v),
    },
    {
      type: "weekly_questions",
      current: weekStats.questions,
      fmt: (v: number) => String(v),
    },
    {
      type: "monthly_questions",
      current: monthStats.questions,
      fmt: (v: number) => String(v),
    },
    {
      type: "weekly_pages",
      current: weekStats.pages,
      fmt: (v: number) => String(v),
    },
    {
      type: "monthly_pages",
      current: monthStats.pages,
      fmt: (v: number) => String(v),
    },
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 1. Cabeçalho Dinâmico (Hero) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card border border-border p-6 rounded-2xl">
        <div className="space-y-1">
          <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 capitalize">
            Status de Foco
          </span>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-foreground">
              Foco Mensal de Estudos
            </h2>
            <span
              className={cn(
                "px-2.5 py-0.5 rounded-full text-xs font-bold border",
                !hasRecords
                  ? "bg-muted/10 text-muted-foreground border-border"
                  : monthlyFocus >= 80
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    : monthlyFocus >= 50
                      ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                      : "bg-amber-500/10 text-amber-500 border-amber-500/20",
              )}
            >
              {!hasRecords
                ? "Sem registros"
                : monthlyFocus >= 80
                  ? "Excelente"
                  : monthlyFocus >= 50
                    ? "Produtivo"
                    : "Em recuperação"}
            </span>
          </div>
        </div>
        <div className="w-full md:w-80 space-y-1.5">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-neutral-500 dark:text-neutral-400">
              Progresso Geral
            </span>
            <span className={cn("font-extrabold", theme.text)}>
              {monthlyFocus}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000",
                theme.solid,
              )}
              style={{ width: `${monthlyFocus}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Cards de KPIs com visual premium */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((c) => {
          const cardEl = (
            <div
              key={c.label}
              className="bg-card border border-border rounded-xl p-5 flex flex-col gap-2 transition-all hover:border-border/80"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 capitalize">
                  {c.label}
                </span>
                <c.icon className={cn("w-4 h-4", theme.text)} />
              </div>
              <span className="text-3xl font-bold text-foreground leading-none tabular-nums">
                {c.value}
              </span>
              <span className="text-xs text-neutral-500 font-medium mt-0.5">
                {c.sub}
              </span>
              <div className="h-1 bg-muted rounded-full overflow-hidden mt-2">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    theme.solid,
                  )}
                  style={{ width: `${c.progress}%` }}
                />
              </div>
            </div>
          );

          return c.tooltip ? (
            <ToolTip key={c.label} content={c.tooltip}>
              {cardEl}
            </ToolTip>
          ) : (
            cardEl
          );
        })}
      </div>

      {/* 3. Painel de Metas & Notas de Simulados */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lado esquerdo: Progresso detalhado das metas (8 colunas) */}
        <div className="lg:col-span-8 flex flex-col gap-4 bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <Target className={cn("w-4 h-4", theme.text)} />
            <h3 className="text-sm font-bold text-foreground">
              Progresso das Metas de Estudo
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {goalBars.map(({ type, current, fmt }) => {
              const target = goalValue(type);
              const pct = target
                ? Math.min(100, Math.round((current / target) * 100))
                : 0;
              return (
                <div key={type} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 capitalize">
                      {GOAL_LABELS[type as keyof typeof GOAL_LABELS]}
                    </span>
                    <span className="text-xs font-bold text-foreground tabular-nums">
                      {fmt(current)}{" "}
                      <span className="text-muted-foreground/40 mx-0.5">/</span>{" "}
                      {target ? fmt(target) : "-"}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        pct >= 100 ? "bg-emerald-500" : theme.solid,
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span
                      className={cn(
                        "font-bold",
                        target
                          ? pct >= 100
                            ? "text-emerald-500"
                            : theme.text
                          : "text-muted-foreground/40",
                      )}
                    >
                      {target ? `${pct}% concluído` : "Sem meta cadastrada"}
                    </span>
                    {target > 0 && (
                      <span
                        className={cn(
                          "px-1.5 py-0.2 rounded font-semibold text-[8px] border",
                          pct >= 100
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : pct >= 50
                              ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                              : "bg-amber-500/10 text-amber-500 border-amber-500/20",
                        )}
                      >
                        {pct >= 100
                          ? "Meta Batida"
                          : pct >= 50
                            ? "No Caminho"
                            : "Atrasado"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lado direito: Notas & Domínio por Matéria (4 colunas) */}
        <div className="flex flex-col gap-6 lg:col-span-4">
          {/* Notas & Simulados com círculo de aproveitamento médio */}
          <button
            type="button"
            onClick={onOpenGrades}
            className="w-full text-left flex flex-col gap-4 bg-card border border-border rounded-2xl p-6 transition-all duration-300 hover:bg-muted/10 hover:border-emerald-500/50 cursor-pointer group"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-foreground">
                  Notas & Simulados
                </h3>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>

            {gradesStats ? (
              <div className="flex items-center gap-4 w-full">
                {/* Indicador circular simplificado */}
                <div className="relative shrink-0 flex items-center justify-center w-16 h-16">
                  <svg className="w-full h-full transform -rotate-90">
                    <title>Aproveitamento Médio</title>
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="4"
                      className="text-muted/10"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeDasharray={175.9}
                      strokeDashoffset={175.9 - (175.9 * gradesStats.avg) / 10}
                      strokeLinecap="round"
                      className="text-emerald-500 transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-xs font-bold text-foreground">
                    {gradesStats.avg}
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-xs text-neutral-500 font-medium">
                    Média Geral Aproveitamento
                  </span>
                  <div className="flex gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 capitalize">
                        Avaliações
                      </span>
                      <span className="text-xs font-bold text-foreground">
                        {gradesStats.total} feitas
                      </span>
                    </div>
                    {gradesStats.hasQuestions && (
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 capitalize">
                          Acertos
                        </span>
                        <span className="text-xs font-bold text-emerald-500">
                          {gradesStats.hitRate}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-4 gap-2 w-full">
                <Award className="w-6 h-6 text-neutral-600/70" />
                <p className="text-xs text-neutral-500 font-semibold max-w-sm">
                  Nenhuma avaliação registrada. Clique para começar.
                </p>
              </div>
            )}
          </button>

          {/* Domínio por Matéria com proficiências de cores */}
          <div className="flex flex-col gap-4 bg-card border border-border rounded-2xl p-6 w-full">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className={cn("w-4 h-4", theme.text)} />
              <h3 className="text-sm font-bold text-foreground">
                Domínio por Matéria
              </h3>
            </div>

            {Object.keys(subjectMap).length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="Aguardando registros"
                description="Sua performance aparecerá aqui em breve."
                className="py-10"
              />
            ) : (
              <div className="flex flex-col gap-4">
                {Object.entries(subjectMap)
                  .sort((a, b) => b[1].hours - a[1].hours)
                  .slice(0, 4)
                  .map(([subj, d]) => {
                    const totalQ = d.qNew + d.qRev;
                    const totalC = d.cNew + d.cRev;
                    const rate = hitRate(totalC, totalQ);
                    return (
                      <div key={subj} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground truncate max-w-[120px]">
                            {subj}
                          </span>
                          <span
                            className={cn(
                              "px-1.5 py-0.2 rounded text-[9px] font-bold border",
                              rate >= 70
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                : rate >= 50
                                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                  : "bg-rose-500/10 text-rose-500 border-rose-500/20",
                            )}
                          >
                            {rate >= 70
                              ? "Excelente"
                              : rate >= 50
                                ? "Bom"
                                : "Revisar"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-neutral-500 font-medium">
                          <span>{formatHours(d.hours)} dedicadas</span>
                          <span className="tabular-nums">
                            {rate}% acerto ({totalQ} q)
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
