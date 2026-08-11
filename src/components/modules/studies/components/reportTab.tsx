"use client";

import {
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  Target,
} from "lucide-react";
import { useMemo, useState } from "react";
import { resolveColor } from "@/colors.config";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn, getColorTheme, HEX_COLORS, type ThemeColorKey } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { SubjectMeta } from "../../grades/types";
import { StudiesHeatmap } from "../heatmap";
import type { StudySession, StudyStats, SubjectData } from "../types";
import {
  computeStats,
  computeSubjectMap,
  formatHours,
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
import { ReportTextSection } from "./StudiesTextReport";

interface ReportTabProps {
  sessions: StudySession[];
  allStats: StudyStats;
  goalValue: (type: string) => number;
  weekStartDay?: number;
  activeSubjects?: string[];
  subjectMetas?: SubjectMeta[];
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
  activeSubjects = [],
  subjectMetas = [],
}: ReportTabProps) {
  const color = getModuleColor("studies");
  const theme = getColorTheme(color);
  const [reportMode, setReportMode] = useState<"daily" | "weekly" | "monthly">(
    "weekly",
  );
  const [periodOffset, setPeriodOffset] = useState(0);

  // Cores por modo (Baseadas no tema do módulo ou variações harmônicas)
  const modeTheme = {
    daily: {
      active: cn(theme.bg, theme.text, "border", theme.border),
      shadow: "shadow-emerald-500/10",
      accent: theme.text,
    },
    weekly: {
      active: cn(theme.bg, theme.text, "border", theme.border),
      shadow: "shadow-violet-600/20",
      accent: theme.text,
    },
    monthly: {
      active: cn(theme.bg, theme.text, "border", theme.border),
      shadow: "shadow-orange-600/20",
      accent: theme.text,
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

  const periodHoursBySubject = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of periodSessions) {
      map[s.subject] = (map[s.subject] || 0) + s.hours;
    }
    return map;
  }, [periodSessions]);

  const subjectsWithTarget = useMemo(() => {
    return activeSubjects.filter((subjectName) => {
      const meta = subjectMetas.find((m) => m.name === subjectName);
      return meta?.weeklyTargetHours && meta.weeklyTargetHours > 0;
    });
  }, [activeSubjects, subjectMetas]);

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
    <div className="flex flex-col gap-6">
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
              "flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold transition-all",
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
              "flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold transition-all",
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
              "flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold transition-all",
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

      {/* Metas Individuais Semanais por Disciplina (Apenas no relatório Semanal com Meta > 0) */}
      {reportMode === "weekly" && subjectsWithTarget.length > 0 && (
        <div className="bg-card border border-border p-6 rounded-2xl flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Target className={cn("w-4 h-4", theme.text)} />
            <h3 className="text-sm font-bold text-foreground">
              Metas de Estudos por Disciplina na Semana Selecionada
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {subjectsWithTarget.map((subjectName) => {
              const meta = subjectMetas.find((m) => m.name === subjectName);
              const targetHours = meta?.weeklyTargetHours || 0;

              const studiedHours = periodHoursBySubject[subjectName] || 0;
              const pct = Math.min(
                100,
                Math.round((studiedHours / targetHours) * 100),
              );
              const hex = resolveColor(meta?.color || "slate");

              return (
                <div key={subjectName} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10 dark:border-white/10"
                        style={{ backgroundColor: hex }}
                      />
                      {subjectName}
                    </span>
                    <span className="text-xs font-bold text-foreground tabular-nums shrink-0">
                      {formatHours(studiedHours)}{" "}
                      <span className="text-muted-foreground/40 mx-0.5">/</span>{" "}
                      {formatHours(targetHours)}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: hex,
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span
                      className="font-bold"
                      style={{
                        color: pct >= 100 ? "var(--emerald-500)" : hex,
                      }}
                    >
                      {pct}% concluído
                    </span>
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
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Canvas + Texto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <ReportCanvas
          periodStats={periodStats}
          periodSessions={periodSessions}
          goalValue={goalValue}
          periodTitle={periodTitle}
          periodRange={periodRange}
          reportMode={reportMode}
          accentColor={HEX_COLORS[color as ThemeColorKey]}
        />
        <ReportTextSection
          periodStats={periodStats}
          periodTitle={periodTitle}
          periodRange={periodRange}
          reportMode={reportMode}
          goalValue={goalValue}
        />
      </div>

      {/* Constância de Estudos Anual (Heatmap) */}
      <StudiesHeatmap sessions={sessions} />

      {/* Desempenho (KPIs + Composição + Rankings) */}
      <DesempenhoTab
        allStats={periodStats}
        subjectMap={periodSubjectMap}
        reportMode={reportMode}
      />
    </div>
  );
}
