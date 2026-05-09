import { BookOpen, CheckCircle, Clock, Target, TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
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
}

export function OverviewTab({
  weekStats,
  monthStats,
  goalValue,
  goalProgress,
  subjectMap,
}: OverviewTabProps) {
  const color = getModuleColor("studies");
  const theme = getColorTheme(color);

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

  const statCards = [
    {
      label: "Tempo no Mês",
      value: formatHours(monthStats.hours),
      icon: Clock,
      sub: `Meta: ${monthlyTargetHours ? formatHours(monthlyTargetHours) : "-"}`,
      progress: goalProgress(monthStats.hours, "monthly_hours"),
    },
    {
      label: "Páginas (Mês)",
      value: monthStats.pages,
      icon: BookOpen,
      sub: `Meta: ${monthlyTargetPages || "-"}`,
      progress: goalProgress(monthStats.pages, "monthly_pages"),
    },
    {
      label: "Questões (Mês)",
      value: monthStats.questions,
      icon: CheckCircle,
      sub: `Meta: ${monthlyTargetQuestions || "-"}`,
      progress: goalProgress(monthStats.questions, "monthly_questions"),
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
    <div className="flex flex-col gap-6">
      {/* Hero Section: Global Performance */}
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-border bg-card/40 backdrop-blur-xl p-8 flex flex-col md:flex-row items-center gap-8",
          "border-t-2",
          theme.border.split(" ")[0].replace("/20", ""),
        )}
      >
        <div className="flex flex-col gap-2 text-center md:text-left flex-1">
          <h2 className="text-2xl font-black text-foreground">Foco Mensal</h2>
          <p className="text-sm text-muted-foreground font-medium max-w-md">
            Seu desempenho global baseado nas metas mensais de horas, questões e
            leitura.
          </p>
          <div className="flex items-center gap-4 mt-2 justify-center md:justify-start">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-muted-foreground">
                Status Atual
              </span>
              <span
                className={cn(
                  "text-sm font-bold",
                  monthlyFocus >= 80
                    ? "text-emerald-500"
                    : monthlyFocus >= 50
                      ? theme.text
                      : "text-amber-500",
                )}
              >
                {monthlyFocus >= 80
                  ? "Excelente"
                  : monthlyFocus >= 50
                    ? "Produtivo"
                    : "Em recuperação"}
              </span>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-muted-foreground">
                Acerto Mensal
              </span>
              <span className="text-sm font-bold text-foreground">
                {hitRate(
                  monthStats.correctNew + monthStats.correctReview,
                  monthStats.questionsNew + monthStats.questionsReview,
                )}
                %
              </span>
            </div>
          </div>
        </div>

        <div className="relative shrink-0 flex items-center justify-center w-32 h-32">
          <svg className="w-full h-full transform -rotate-90">
            <title>Progresso Mensal de Estudos</title>
            <circle
              cx="64"
              cy="64"
              r="58"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/10"
            />
            <circle
              cx="64"
              cy="64"
              r="58"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={364.4}
              strokeDashoffset={364.4 - (364.4 * monthlyFocus) / 100}
              strokeLinecap="round"
              className={cn("transition-all duration-1000", theme.text)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-foreground">
              {monthlyFocus}%
            </span>
            <span className="text-[8px] font-bold text-muted-foreground">
              Mês
            </span>
          </div>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((c) => (
          <div
            key={c.label}
            className="group bg-card/60 backdrop-blur-md border border-border rounded-2xl p-5 flex flex-col gap-3 transition-all hover:translate-y-[-2px]"
          >
            <div className="flex items-center justify-between">
              <div className={cn("p-2 rounded-xl bg-muted/50", theme.text)}>
                <c.icon className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold text-muted-foreground">
                {c.label}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-foreground">
                {c.value}
              </span>
              <span
                className={cn("text-[10px] font-bold mt-0.5", theme.textSub)}
              >
                {c.sub}
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  theme.solid,
                )}
                style={{ width: `${c.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Section */}
        <div className="lg:col-span-2 flex flex-col gap-4 bg-card/40 backdrop-blur-sm border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className={cn("w-4 h-4", theme.text)} />
              <h3 className="text-sm font-bold text-foreground">
                Progresso das Metas
              </h3>
            </div>
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
                    <span className="text-[11px] font-bold text-muted-foreground uppercase">
                      {GOAL_LABELS[type as keyof typeof GOAL_LABELS]}
                    </span>
                    <span className="text-[11px] font-black text-foreground">
                      {fmt(current)}{" "}
                      <span className="text-muted-foreground/40 mx-1">/</span>{" "}
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
                  <div className="flex justify-between items-center">
                    <span
                      className={cn(
                        "text-[9px] font-bold",
                        target
                          ? pct >= 100
                            ? "text-emerald-500"
                            : theme.text
                          : "text-muted-foreground/40",
                      )}
                    >
                      {target ? `${pct}% concluído` : "Sem meta"}
                    </span>
                    {pct >= 100 && (
                      <CheckCircle className="w-2.5 h-2.5 text-emerald-500" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Subjects Section */}
        <div className="flex flex-col gap-4 bg-card/40 backdrop-blur-sm border border-border rounded-2xl p-6">
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
                .slice(0, 5)
                .map(([subj, d]) => {
                  const totalQ = d.qNew + d.qRev;
                  const totalC = d.cNew + d.cRev;
                  const rate = hitRate(totalC, totalQ);
                  return (
                    <div key={subj} className="flex flex-col gap-1.5 group">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground truncate max-w-[120px]">
                          {subj}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-black",
                            rate >= 70
                              ? "text-emerald-500"
                              : rate >= 50
                                ? "text-amber-500"
                                : "text-rose-500",
                          )}
                        >
                          {rate}% acerto
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            rate >= 70
                              ? "bg-emerald-500"
                              : rate >= 50
                                ? "bg-amber-500"
                                : "bg-rose-500",
                          )}
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center opacity-60">
                        <span className="text-[9px] font-medium uppercaseer">
                          {formatHours(d.hours)} dedicadas
                        </span>
                        <span className="text-[9px] font-medium">
                          {totalQ} questões
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
  );
}
