"use client";

import {
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  Layers,
  Star,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { HEX_COLORS } from "@/colors.config";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { ReadingBook, ReadingGoal, ReadingSession } from "../types";
import { formatMinutes, isoDate } from "../utils";
import { ReadingReportCanvas } from "./ReadingReportCanvas";
import { ReadingTextReport } from "./ReadingTextReport";

interface ReportsTabProps {
  sessions: ReadingSession[];
  books: ReadingBook[];
  goals?: ReadingGoal[];
}

type ReportMode = "daily" | "weekly" | "monthly";

function startOfWeek(d: Date) {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const result = new Date(d);
  result.setDate(d.getDate() + diff);
  return result;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function ReportsTab({ sessions, books, goals = [] }: ReportsTabProps) {
  const [reportMode, setReportMode] = useState<ReportMode>("weekly");
  const [periodOffset, setPeriodOffset] = useState(0);

  const goalPages = useMemo(() => {
    if (reportMode === "daily") return 0;
    const type = reportMode === "weekly" ? "PagesPerWeek" : "PagesPerMonth";
    return goals.find((g) => g.goalType === type)?.targetValue ?? 0;
  }, [goals, reportMode]);

  const goalMinutes = useMemo(() => {
    if (reportMode === "daily") return 0;
    const type = reportMode === "weekly" ? "TimePerWeek" : "TimePerMonth";
    return goals.find((g) => g.goalType === type)?.targetValue ?? 0;
  }, [goals, reportMode]);

  const { periodSessions, periodTitle, periodRange, periodStats } =
    useMemo(() => {
      const now = new Date();

      const computeStats = (sess: ReadingSession[]) => ({
        pages: sess.reduce((a, s) => a + s.pagesRead, 0),
        minutes: sess.reduce((a, s) => a + s.durationMinutes, 0),
        sessions: sess.length,
        booksFinished: books.filter(
          (b) =>
            b.status === "Completed" && sess.some((s) => s.bookId === b.id),
        ).length,
      });

      if (reportMode === "daily") {
        const target = new Date(now);
        target.setDate(target.getDate() + periodOffset);
        const dateStr = isoDate(target);
        const pSessions = sessions.filter((s) => s.date === dateStr);
        const weekday = target
          .toLocaleString("pt-BR", { weekday: "long" })
          .toUpperCase();
        const fmtDate = (d: Date) =>
          `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
        return {
          periodSessions: pSessions,
          periodTitle: "RELATÓRIO DIÁRIO DE LEITURA",
          periodRange: `${weekday}, ${fmtDate(target)}`,
          periodStats: computeStats(pSessions),
        };
      } else if (reportMode === "weekly") {
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
          `${d.getDate()} ${d.toLocaleString("pt-BR", { month: "short" }).replace(".", "").toUpperCase()}`;
        return {
          periodSessions: pSessions,
          periodTitle: "RELATÓRIO SEMANAL DE LEITURA",
          periodRange: `${fmtDate(first)} - ${fmtDate(last)} / ${first.getFullYear()}`,
          periodStats: computeStats(pSessions),
        };
      } else {
        const start = startOfMonth(now);
        start.setMonth(start.getMonth() + periodOffset);
        const monthPrefix = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
        const pSessions = sessions.filter((s) =>
          s.date.startsWith(monthPrefix),
        );
        const monthName = start
          .toLocaleString("pt-BR", { month: "long" })
          .toUpperCase();
        return {
          periodSessions: pSessions,
          periodTitle: "RELATÓRIO MENSAL DE LEITURA",
          periodRange: `${monthName} / ${start.getFullYear()}`,
          periodStats: computeStats(pSessions),
        };
      }
    }, [reportMode, periodOffset, sessions, books]);

  const color = getModuleColor("reading");
  const moduleTheme = getColorTheme(color);

  const modeTheme = {
    daily: {
      active: cn(
        moduleTheme.bg,
        moduleTheme.text,
        "border",
        moduleTheme.border,
      ),
      accent: moduleTheme.text,
      color: HEX_COLORS[color as keyof typeof HEX_COLORS] || "#2dd4bf",
    },
    weekly: {
      active: cn(
        moduleTheme.bg,
        moduleTheme.text,
        "border",
        moduleTheme.border,
      ),
      accent: moduleTheme.text,
      color: HEX_COLORS[color as keyof typeof HEX_COLORS] || "#818cf8",
    },
    monthly: {
      active: cn(
        moduleTheme.bg,
        moduleTheme.text,
        "border",
        moduleTheme.border,
      ),
      accent: moduleTheme.text,
      color: HEX_COLORS[color as keyof typeof HEX_COLORS] || "#fb923c",
    },
  };
  const theme = modeTheme[reportMode];

  // Estatísticas dos cartões de análise com base no período selecionado
  const categoryStats = useMemo(() => {
    const stats: Record<
      string,
      { pages: number; time: number; count: number }
    > = {};
    for (const s of periodSessions) {
      const book = books.find((b) => b.id === s.bookId);
      const cat = book?.category || "Outros";
      if (!stats[cat]) stats[cat] = { pages: 0, time: 0, count: 0 };
      stats[cat].pages += s.pagesRead;
      stats[cat].time += s.durationMinutes;
      stats[cat].count += 1;
    }
    return Object.entries(stats).sort((a, b) => b[1].pages - a[1].pages);
  }, [periodSessions, books]);

  const weekDistribution = useMemo(() => {
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const dist = days.map((label) => ({ label, value: 0 }));
    for (const s of periodSessions) {
      // Configure a data local corretamente para evitar alterações de fuso horário
      const [year, month, day] = s.date.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      dist[date.getDay()].value += s.pagesRead;
    }
    return dist;
  }, [periodSessions]);

  const maxDailyValue = Math.max(...weekDistribution.map((d) => d.value), 1);

  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Relatório indisponível"
        description="Você poderá gerar e compartilhar relatórios detalhados assim que registrar suas primeiras sessões de leitura."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Seletor de período */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card/50 p-2 rounded-xl border border-border">
        <div className="flex items-center gap-1 bg-background p-1 rounded-xl border border-border">
          {(["daily", "weekly", "monthly"] as ReportMode[]).map((mode) => {
            const labels = {
              daily: "Diário",
              weekly: "Semanal",
              monthly: "Mensal",
            };
            const icons = { daily: Clock, weekly: Calendar, monthly: Layers };
            const Icon = icons[mode];
            return (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setReportMode(mode);
                  setPeriodOffset(0);
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all",
                  reportMode === mode
                    ? modeTheme[mode].active
                    : "text-muted-foreground hover:text-muted-foreground",
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {labels[mode]}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setPeriodOffset((p) => p - 1)}
            className="p-2 rounded-xl bg-neutral-800 border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center min-w-[160px]">
            <span className={cn("text-[10px] font-bold", theme.accent)}>
              {periodTitle}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              {periodRange}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPeriodOffset((p) => p + 1)}
            disabled={periodOffset >= 0}
            className={cn(
              "p-2 rounded-xl border transition-all",
              periodOffset >= 0
                ? "bg-card border-border text-neutral-700 cursor-not-allowed"
                : "bg-neutral-800 border-border text-muted-foreground hover:text-foreground cursor-pointer",
            )}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Canvas + Texto copiavel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <ReadingReportCanvas
          periodStats={periodStats}
          goalPages={goalPages}
          goalMinutes={goalMinutes}
          periodTitle={periodTitle}
          periodRange={periodRange}
          reportMode={reportMode}
          accentColor={theme.color}
        />

        <ReadingTextReport
          periodStats={periodStats}
          periodTitle={periodTitle}
          periodRange={periodRange}
          goalPages={goalPages}
          goalMinutes={goalMinutes}
          books={books}
        />
      </div>

      {periodSessions.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Nenhuma atividade no período"
          description="Os detalhes, composições e gráficos aparecerão assim que registrar uma leitura dentro deste recorte de tempo."
        />
      ) : (
        <>
          {/* Cards de estatísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              {
                icon: BookOpen,
                label: "Páginas lidas",
                value: periodStats.pages,
                sub: goalPages > 0 ? `meta: ${goalPages} pág.` : "",
                pct:
                  goalPages > 0
                    ? Math.min(
                        100,
                        Math.round((periodStats.pages / goalPages) * 100),
                      )
                    : 0,
                color: moduleTheme.text,
                bg: moduleTheme.bg,
                bar: moduleTheme.solid,
              },
              {
                icon: Clock,
                label: "Tempo total",
                value: formatMinutes(periodStats.minutes),
                sub:
                  goalMinutes > 0 ? `meta: ${formatMinutes(goalMinutes)}` : "",
                pct:
                  goalMinutes > 0
                    ? Math.min(
                        100,
                        Math.round((periodStats.minutes / goalMinutes) * 100),
                      )
                    : 0,
                color: moduleTheme.text,
                bg: moduleTheme.bg,
                bar: moduleTheme.solid,
              },
              {
                icon: Flame,
                label: "Sessões",
                value: periodStats.sessions,
                sub: "frequência",
                pct: Math.min(100, (periodStats.sessions / 7) * 100),
                color: moduleTheme.text,
                bg: moduleTheme.bg,
                bar: moduleTheme.solid,
              },
              {
                icon: Award,
                label: "Livros concluídos",
                value: periodStats.booksFinished,
                sub: "período",
                pct: periodStats.booksFinished > 0 ? 100 : 0,
                color: moduleTheme.text,
                bg: moduleTheme.bg,
                bar: moduleTheme.solid,
              },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="bg-card border border-border rounded-xl p-5 flex items-center gap-4"
              >
                <div
                  className={cn(
                    "p-2.5 rounded-xl border border-white/5",
                    kpi.bg,
                    kpi.color,
                  )}
                >
                  <kpi.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    {kpi.label}
                  </p>
                  <p className="text-2xl font-black text-foreground tabular-nums">
                    {kpi.value}
                  </p>
                  {kpi.pct !== null && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-border/30">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-1000",
                            kpi.bar,
                          )}
                          style={{ width: `${kpi.pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-neutral-600 mt-0.5 block">
                        {kpi.pct}% da meta · {kpi.sub}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8 bg-card border border-border rounded-xl p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex flex-col gap-1">
                  <h3 className="text-base font-bold text-foreground">
                    Distribuição Diária
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Páginas lidas por dia da semana
                  </p>
                </div>
                <div
                  className={cn(
                    "p-2.5 rounded-xl border",
                    moduleTheme.bg,
                    moduleTheme.border,
                    moduleTheme.text,
                  )}
                >
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-end justify-between h-48 gap-3 px-2 pt-4">
                {weekDistribution.map((d) => {
                  const height = (d.value / maxDailyValue) * 100;
                  return (
                    <div
                      key={d.label}
                      className="flex-1 flex flex-col items-center gap-3 h-full group"
                    >
                      <div className="relative flex-1 w-full flex items-end">
                        <div
                          className={cn(
                            "w-full rounded-t-lg transition-all duration-500",
                            d.value > 0 ? moduleTheme.solid : "bg-neutral-800",
                          )}
                          style={{ height: `${height}%` }}
                        >
                          {d.value > 0 && (
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-800 border border-border text-foreground text-xs font-bold px-1.5 py-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              {d.value} pág.
                            </div>
                          )}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase",
                          d.value > 0 ? moduleTheme.text : "text-neutral-700",
                        )}
                      >
                        {d.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-4 bg-card border border-border rounded-xl p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground">Troféus</h3>
                <Award className="w-5 h-5 text-amber-600 dark:text-amber-500" />
              </div>
              <div className="flex flex-col gap-4">
                {[
                  {
                    label: "Consistência",
                    sub: "Sessões no período",
                    value: periodSessions.length,
                    icon: Flame,
                    color: "text-rose-500",
                    bg: "bg-rose-500/10",
                  },
                  {
                    label: "Elite",
                    sub: "Livros concluídos",
                    value: periodStats.booksFinished,
                    icon: Star,
                    color: "text-amber-600 dark:text-amber-500",
                    bg: "bg-amber-500/10",
                  },
                ].map((badge) => (
                  <div
                    key={badge.label}
                    className="flex items-center gap-4 bg-background/40 p-4 rounded-xl border border-border/50 group transition-all hover:bg-background/60"
                  >
                    <div
                      className={cn(
                        "p-2.5 rounded-xl border border-white/5 transition-transform group-hover:scale-110",
                        badge.bg,
                        badge.color,
                      )}
                    >
                      <badge.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-neutral-600 leading-none">
                        {badge.label}
                      </p>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-xl font-bold text-foreground leading-none tabular-nums">
                          {badge.value}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground">
                          {badge.sub}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-8">
              <div
                className={cn(
                  "p-2.5 rounded-xl border",
                  moduleTheme.bg,
                  moduleTheme.border,
                )}
              >
                <BarChart3 className={cn("w-6 h-6", moduleTheme.text)} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Distribuição de conteúdo
                </h3>
                <p className="text-xs text-muted-foreground">
                  Volume literário por categoria temática
                </p>
              </div>
            </div>

            {categoryStats.length === 0 ? (
              <div className="py-10 flex flex-col items-center justify-center opacity-30 grayscale">
                <BarChart3 className="w-10 h-10 mb-2 text-neutral-600" />
                <p className="text-xs font-medium text-muted-foreground">
                  Aguardando mais dados...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {categoryStats.map(([cat, s]) => (
                  <div
                    key={cat}
                    className={cn(
                      "flex flex-col gap-4 bg-background/40 border border-border/50 rounded-xl p-5 hover:bg-card/50 transition-all border-b-2",
                      moduleTheme.borderHover.replace(
                        "hover:",
                        "hover:border-b-",
                      ),
                    )}
                  >
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-bold text-foreground">
                        {cat}
                      </span>
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          moduleTheme.text,
                        )}
                      >
                        {s.count} sessões
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <span className="text-2xl font-bold text-foreground tabular-nums">
                          {s.pages}
                        </span>
                        <p className="text-xs font-medium text-neutral-700 mt-0.5">
                          Páginas
                        </p>
                      </div>
                      <div className="w-px h-8 bg-muted" />
                      <div className="flex-1">
                        <span className="text-2xl font-bold text-foreground tabular-nums leading-none">
                          {formatMinutes(s.time)}
                        </span>
                        <p className="text-xs font-medium text-neutral-700 mt-0.5">
                          Esforço
                        </p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full w-full", moduleTheme.solid)}
                        style={{
                          width: `${Math.min(100, (s.pages / Math.max(1, periodStats.pages)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
