"use client";

import {
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
} from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import type { StudySession, StudyStats, SubjectData } from "../types";
import {
  computeStats,
  computeSubjectMap,
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
  weekStartDay?: number;
}

/**
 * Aba de Desempenho: Exibe KPIs, gráficos de composição e rankings de matérias
 */
export function DesempenhoTab({
  allStats,
  subjectMap,
  reportMode = "monthly",
}: {
  allStats: StudyStats;
  subjectMap: Record<string, SubjectData>;
  reportMode?: "daily" | "weekly" | "monthly" | "all";
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
      .filter((s) => s.hours >= 1 && s.rate < 70)
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
        reportMode={reportMode}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <PerformanceGlobal
          allStats={allStats}
          globalRate={stats.globalRate}
          reportMode={reportMode}
        />
        <PerformanceComposition allStats={allStats} reportMode={reportMode} />
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
  sessions,
  allStats,
  goalValue,
  weekStartDay = 1,
}: ReportTabProps) {
  const [reportMode, setReportMode] = useState<"daily" | "weekly" | "monthly">(
    "weekly",
  );
  const [periodOffset, setPeriodOffset] = useState(0);

  // Cores por modo
  const modeTheme = {
    daily: {
      active:
        "bg-teal-600/20 text-teal-600 dark:text-teal-400 border border-teal-600/30",
      shadow: "shadow-teal-600/20",
      accent: "text-teal-600 dark:text-teal-400",
    },
    weekly: {
      active:
        "bg-violet-600/20 text-violet-600 dark:text-violet-400 border border-violet-600/30",
      shadow: "shadow-violet-600/20",
      accent: "text-violet-500",
    },
    monthly: {
      active:
        "bg-orange-600/20 text-orange-600 dark:text-orange-400 border border-orange-600/30",
      shadow: "shadow-orange-600/20",
      accent: "text-orange-600 dark:text-orange-400",
    },
  };

  const currentTheme = modeTheme[reportMode];

  const {
    periodSessions,
    periodTitle,
    periodRange,
    periodStats,
    periodSubjectMap,
  } = useMemo(() => {
    const now = new Date();
    if (reportMode === "daily") {
      const target = new Date(now);
      target.setDate(target.getDate() + periodOffset);
      const dateStr = isoDate(target);

      const pSessions = sessions.filter((s) => s.date === dateStr);
      const fmtDate = (d: Date) =>
        `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

      const weekday = target
        .toLocaleString("pt-BR", { weekday: "long" })
        .toUpperCase();

      return {
        periodSessions: pSessions,
        periodTitle: "RELATÓRIO DIÁRIO DE ESTUDOS",
        periodRange: `${weekday}, ${fmtDate(target)}`,
        periodStats: computeStats(pSessions),
        periodSubjectMap: computeSubjectMap(pSessions),
      };
    } else if (reportMode === "weekly") {
      const first = startOfWeek(now, weekStartDay);
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
        periodSubjectMap: computeSubjectMap(pSessions),
      };
    } else {
      const start = startOfMonth(now);
      start.setMonth(start.getMonth() + periodOffset);

      const year = start.getFullYear();
      const month = start.getMonth();
      const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;

      const pSessions = sessions.filter((s) => s.date.startsWith(monthPrefix));
      const monthName = start
        .toLocaleString("pt-BR", { month: "long" })
        .toUpperCase();

      return {
        periodSessions: pSessions,
        periodTitle: "RELATÓRIO MENSAL DE ESTUDOS",
        periodRange: `${monthName} / ${year}`,
        periodStats: computeStats(pSessions),
        periodSubjectMap: computeSubjectMap(pSessions),
      };
    }
  }, [reportMode, periodOffset, sessions, weekStartDay]);

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
    <div className="flex flex-col gap-6 ">
      {/* Controles de Período */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card/50 p-2 rounded-xl border border-border">
        <div className="flex items-center gap-1 bg-background p-1 rounded-xl border border-border">
          <button
            type="button"
            onClick={() => {
              setReportMode("daily");
              setPeriodOffset(0);
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-black uppercase transition-all",
              reportMode === "daily"
                ? modeTheme.daily.active
                : "text-muted-foreground hover:text-muted-foreground",
            )}
          >
            <Clock className="w-3.5 h-3.5" /> Diário
          </button>
          <button
            type="button"
            onClick={() => {
              setReportMode("weekly");
              setPeriodOffset(0);
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-black uppercase transition-all",
              reportMode === "weekly"
                ? modeTheme.weekly.active
                : "text-muted-foreground hover:text-muted-foreground",
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
                ? modeTheme.monthly.active
                : "text-muted-foreground hover:text-muted-foreground",
            )}
          >
            <Layers className="w-3.5 h-3.5" /> Mensal
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setPeriodOffset((prev) => prev - 1)}
            className="p-2 rounded-xl bg-neutral-800 border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center min-w-[160px]">
            <span className={cn("text-[10px] font-black", currentTheme.accent)}>
              {periodTitle}
            </span>
            <span className="text-xs font-bold text-muted-foreground">
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
                ? "bg-card border-border text-neutral-700 cursor-not-allowed"
                : "bg-neutral-800 border-border text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer",
            )}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Canvas + Texto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <ReportCanvas
          periodStats={periodStats}
          periodSessions={periodSessions}
          goalValue={goalValue}
          periodTitle={periodTitle}
          periodRange={periodRange}
          reportMode={reportMode}
          accentColor={
            reportMode === "daily"
              ? "#2dd4bf"
              : reportMode === "monthly"
                ? "#fb923c"
                : "#a78bfa"
          }
        />
        <ReportTextSection
          periodStats={periodStats}
          periodTitle={periodTitle}
          periodRange={periodRange}
          reportMode={reportMode}
          goalValue={goalValue}
        />
      </div>

      {/* Desempenho (KPIs + Composição + Rankings) */}
      <DesempenhoTab
        allStats={periodStats}
        subjectMap={periodSubjectMap}
        reportMode={reportMode}
      />
    </div>
  );
}
