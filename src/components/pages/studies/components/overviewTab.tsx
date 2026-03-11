"use client";

import { BookOpen, CheckCircle, Clock, TrendingUp } from "lucide-react";
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
  allStats,
  goalValue,
  goalProgress,
  subjectMap,
}: OverviewTabProps) {
  const statCards = [
    {
      label: "Tempo esta semana",
      value: formatHours(weekStats.hours),
      icon: Clock,
      sub: `Meta: ${goalValue("weekly_hours") ? formatHours(goalValue("weekly_hours")) : "—"}`,
      progress: goalProgress(weekStats.hours, "weekly_hours"),
    },
    {
      label: "Páginas esta semana",
      value: weekStats.pages,
      icon: BookOpen,
      sub: `Meta: ${goalValue("weekly_pages") || "—"}`,
      progress: goalProgress(weekStats.pages, "weekly_pages"),
    },
    {
      label: "Questões esta semana",
      value: weekStats.questions,
      icon: CheckCircle,
      sub: `Meta: ${goalValue("weekly_questions") || "—"}`,
      progress: goalProgress(weekStats.questions, "weekly_questions"),
    },
    {
      label: "Acerto Geral",
      value: `${hitRate(allStats.correctNew + allStats.correctReview, allStats.questionsNew + allStats.questionsReview)}%`,
      icon: TrendingUp,
      sub: `${allStats.correctNew + allStats.correctReview}/${allStats.questionsNew + allStats.questionsReview} certas`,
      progress: hitRate(
        allStats.correctNew + allStats.correctReview,
        allStats.questionsNew + allStats.questionsReview,
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
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((c) => (
          <div
            key={c.label}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-neutral-500">
                {c.label}
              </span>
              <c.icon className="w-3.5 h-3.5 text-violet-500" />
            </div>
            <span className="text-2xl font-black text-white leading-none">
              {c.value}
            </span>
            <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all"
                style={{ width: `${c.progress}%` }}
              />
            </div>
            <span className="text-[10px] text-violet-400/80 font-medium">
              {c.sub}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
        <h2 className=" font-black uppercase text-neutral-400 mb-4">
          Progresso das Metas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goalBars.map(({ type, current, fmt }) => {
            const target = goalValue(type);
            const pct = target
              ? Math.min(100, Math.round((current / target) * 100))
              : 0;
            return (
              <div key={type} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400">
                    {GOAL_LABELS[type as keyof typeof GOAL_LABELS]}
                  </span>
                  <span className="text-xs font-bold text-violet-400">
                    {fmt(current)} / {target ? fmt(target) : "—"}
                  </span>
                </div>
                <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      pct >= 100 ? "bg-green-500" : "bg-violet-500"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[10px] font-medium">
                  {target ? (
                    <span className="text-violet-400/90">{pct}% concluído</span>
                  ) : (
                    <span className="text-neutral-500">Meta não definida</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
        <h2 className=" font-black uppercase text-neutral-400 mb-4">
          Desempenho por Matéria (3 meses)
        </h2>
        {Object.keys(subjectMap).length === 0 ? (
          <p className=" text-neutral-600 text-center py-6">
            Nenhuma sessão registrada ainda.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {Object.entries(subjectMap)
              .sort((a, b) => b[1].hours - a[1].hours)
              .map(([subj, d]) => {
                const totalQ = d.qNew + d.qRev;
                const totalC = d.cNew + d.cRev;
                const rate = hitRate(totalC, totalQ);
                return (
                  <div
                    key={subj}
                    className="flex items-center gap-4 py-2 border-b border-neutral-800 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <span className=" font-semibold text-white truncate block">
                        {subj}
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        {formatHours(d.hours)} · {totalQ} questões
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={` font-black ${
                          rate >= 70
                            ? "text-green-400"
                            : rate >= 50
                              ? "text-yellow-400"
                              : "text-red-400"
                        }`}
                      >
                        {rate}%
                      </span>
                      <p className="text-[10px] text-neutral-400 font-medium uppercaseer">
                        acerto
                      </p>
                    </div>
                    <div className="w-16">
                      <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            rate >= 70
                              ? "bg-green-500"
                              : rate >= 50
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
