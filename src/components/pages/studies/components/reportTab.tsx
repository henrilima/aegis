"use client";

import { useMemo } from "react";
import type { StudySession, StudyStats, SubjectData } from "../types";
import { hitRate } from "../utils";
import { PerformanceComposition } from "./performanceComposition";
import { PerformanceGlobal } from "./performanceGlobal";
import { PerformanceKpi } from "./performanceKpi";
import { PerformanceRanking } from "./performanceRanking";

import { ReportCanvas } from "./reportCanvas";
import { ReportTextSection } from "./reportTextSection";

interface ReportTabProps {
  sessions: StudySession[];
  allStats: StudyStats;
  subjectMap: Record<string, SubjectData>;
  reportText: string;
  onCopy: () => void;
}

/**
 * Aba de Desempenho: Exibe KPIs, gráficos de composição e rankings de matérias
 */
export function DesempenhoTab({
  allStats,
  subjectMap,
}: Omit<ReportTabProps, "sessions" | "reportText" | "onCopy">) {
  const stats = useMemo(() => {
    // Processamento de dados por matéria para os rankings
    const subjects = Object.entries(subjectMap).map(([name, data]) => {
      const q = data.qNew + data.qRev;
      const c = data.cNew + data.cRev;
      const rate = hitRate(c, q);
      return { name, ...data, rate, totalQ: q };
    });

    // Filtros para Dominância e Foco Necessário
    const mastered = [...subjects]
      .filter((s) => s.hours >= 2 && s.rate >= 80)
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 3);

    const needFocus = [...subjects]
      .filter((s) => s.hours >= 1)
      .sort((a, b) => a.rate - b.rate)
      .slice(0, 3);

    const totalHours = Number(allStats.hours) || 1;
    const qPerHour = (Number(allStats.questions) || 0) / totalHours;
    const pPerHour = (Number(allStats.pages) || 0) / totalHours;

    return {
      mastered,
      needFocus,
      qPerHour,
      pPerHour,
      globalRate: hitRate(
        (allStats.correctNew || 0) + (allStats.correctReview || 0),
        (allStats.questionsNew || 0) + (allStats.questionsReview || 0),
      ),
    };
  }, [allStats, subjectMap]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700 pb-12">
      <PerformanceKpi
        hours={allStats.hours}
        qPerHour={stats.qPerHour}
        pPerHour={stats.pPerHour}
        sessionsCount={allStats.sessionsCount}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <PerformanceGlobal allStats={allStats} globalRate={stats.globalRate} />
        <PerformanceComposition allStats={allStats} />
        <PerformanceRanking
          mastered={stats.mastered}
          needFocus={stats.needFocus}
        />
      </div>
    </div>
  );
}

/**
 * Aba de Relatório: Visualização gráfica para compartilhamento e texto formatado
 */
export function RelatorioTab({
  reportText,
  onCopy,
  weekStats,
  allStats,
}: {
  reportText: string;
  onCopy: () => void;
  weekStats: StudyStats;
  allStats: StudyStats;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-500 items-start">
      {/* Canvas para exportação visual */}
      <ReportCanvas weekStats={weekStats} allStats={allStats} />

      {/* Seção de texto para cópia rápida */}
      <ReportTextSection reportText={reportText} onCopy={onCopy} />
    </div>
  );
}
