"use client";

import {
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Layers,
} from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import type { StudySession, StudyStats, SubjectData } from "../types";
import {
  computeStats,
  hitRate,
  isoDate,
  startOfMonth,
  startOfWeek,
} from "../utils";
import { PerformanceComposition } from "./performanceComposition";
import { PerformanceGlobal } from "./performanceGlobal";
import { PerformanceKpi } from "./performanceKpi";
import { PerformanceRanking } from "./performanceRanking";
import { ReportCanvas } from "./reportCanvas";
import { ReportTextSection } from "./reportTextSection";

interface ReportTabProps {
  sessions: StudySession[];
  allStats: StudyStats;
  goalValue: (type: string) => number;
  reportText: string;
  onCopy: () => void;
}

/**
 * Aba de Desempenho: Exibe KPIs, gráficos de composição e rankings de matérias
 */
export function DesempenhoTab({
  allStats,
  subjectMap,
  isMonthly = false,
}: {
  allStats: StudyStats;
  subjectMap: Record<string, SubjectData>;
  isMonthly?: boolean;
}) {
  const stats = useMemo(() => {
    const subjects = Object.entries(subjectMap).map(([name, data]) => {
      const q = data.qNew + data.qRev;
      const c = data.cNew + data.cRev;
      const rate = hitRate(c, q);
      return { name, ...data, rate, totalQ: q };
    });

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

  if (allStats.sessionsCount === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Nenhuma estatística disponível"
        description="Seus dados de desempenho, rankings e métricas globais aparecerão aqui assim que você registrar suas primeiras sessões de estudo."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700 pb-12">
      <PerformanceKpi
        hours={allStats.hours}
        qPerHour={stats.qPerHour}
        pPerHour={stats.pPerHour}
        sessionsCount={allStats.sessionsCount}
        isMonthly={isMonthly}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <PerformanceGlobal
          allStats={allStats}
          globalRate={stats.globalRate}
          isMonthly={isMonthly}
        />
        <PerformanceComposition allStats={allStats} isMonthly={isMonthly} />
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
  sessions,
  allStats,
  goalValue,
}: ReportTabProps) {
  const [reportMode, setReportMode] = useState<"weekly" | "monthly">("weekly");
  const [periodOffset, setPeriodOffset] = useState(0);

  const { periodSessions, periodTitle, periodRange, periodStats } =
    useMemo(() => {
      const now = new Date();
      if (reportMode === "weekly") {
        const first = startOfWeek(now);
        first.setDate(first.getDate() + periodOffset * 7);
        const last = new Date(first);
        last.setDate(last.getDate() + 6);

        const startStr = isoDate(first);
        const endStr = isoDate(last);

        const pSessions = sessions.filter(
          (s) => s.date >= startStr && s.date <= endStr,
        );
        const fmtDate = (d: Date) =>
          `${d.getDate()} ${d
            .toLocaleString("pt-BR", { month: "short" })
            .replace(".", "")
            .toUpperCase()}`;

        return {
          periodSessions: pSessions,
          periodTitle: "RELATÓRIO SEMANAL DE ESTUDOS",
          periodRange: `${fmtDate(first)} - ${fmtDate(last)} / ${first.getFullYear()}`,
          periodStats: computeStats(pSessions),
        };
      } else {
        const start = startOfMonth(now);
        start.setMonth(start.getMonth() + periodOffset);

        const year = start.getFullYear();
        const month = start.getMonth();
        const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;

        const pSessions = sessions.filter((s) =>
          s.date.startsWith(monthPrefix),
        );
        const monthName = start
          .toLocaleString("pt-BR", { month: "long" })
          .toUpperCase();

        return {
          periodSessions: pSessions,
          periodTitle: "RELATÓRIO MENSAL DE ESTUDOS",
          periodRange: `${monthName} / ${year}`,
          periodStats: computeStats(pSessions),
        };
      }
    }, [reportMode, periodOffset, sessions]);

  if (allStats.sessionsCount === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Relatório indisponível"
        description="Você poderá gerar e compartilhar relatórios detalhados assim que registrar seu primeiro ciclo de estudos."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Controles de Período */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-neutral-900/50 p-2 rounded-xl border border-neutral-800">
        <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
          <button
            type="button"
            onClick={() => {
              setReportMode("weekly");
              setPeriodOffset(0);
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-black uppercase transition-all",
              reportMode === "weekly"
                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                : "text-neutral-500 hover:text-neutral-300",
            )}
          >
            <Calendar className="w-3.5 h-3.5" /> Semanal
          </button>
          <button
            type="button"
            onClick={() => {
              setReportMode("monthly");
              setPeriodOffset(0);
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-black uppercase transition-all",
              reportMode === "monthly"
                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                : "text-neutral-500 hover:text-neutral-300",
            )}
          >
            <Layers className="w-3.5 h-3.5" /> Mensal
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setPeriodOffset((prev) => prev - 1)}
            className="p-2 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center min-w-[140px]">
            <span className="text-[10px] font-black text-violet-500">
              {periodTitle}
            </span>
            <span className="text-xs font-bold text-neutral-300">
              {periodRange}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPeriodOffset((prev) => prev + 1)}
            disabled={periodOffset >= 0}
            className={cn(
              "p-2 rounded-xl border transition-all",
              periodOffset >= 0
                ? "bg-neutral-900 border-neutral-800 text-neutral-700 cursor-not-allowed"
                : "bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-700 cursor-pointer",
            )}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Canvas para exportação visual */}
        <ReportCanvas
          periodStats={periodStats}
          periodSessions={periodSessions}
          goalValue={goalValue}
          periodTitle={periodTitle}
          periodRange={periodRange}
          reportMode={reportMode}
        />

        {/* Seção de texto para cópia rápida */}
        <ReportTextSection reportText={reportText} onCopy={onCopy} />
      </div>
    </div>
  );
}
