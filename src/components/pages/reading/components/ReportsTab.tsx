"use client";

import {
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Flame,
  Layers,
  Star,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import type { ReadingBook, ReadingGoal, ReadingSession } from "../types";
import { formatMinutes, isoDate } from "../utils";
import { ReadingReportCanvas } from "./ReadingReportCanvas";

function generateReadingReport({
  periodStats,
  periodTitle,
  periodRange,
  goalPages,
  goalMinutes,
}: {
  periodStats: {
    pages: number;
    minutes: number;
    sessions: number;
    booksFinished: number;
  };
  periodTitle: string;
  periodRange: string;
  goalPages: number;
  goalMinutes: number;
  books: ReadingBook[];
}) {
  const lines = [
    `\u{1F4DA} ${periodTitle}`,
    `\u{1F4C5} ${periodRange}`,
    ``,
    `\u{1F4C4} Paginas lidas: ${periodStats.pages}${goalPages > 0 ? ` / ${goalPages} (${Math.round((periodStats.pages / goalPages) * 100)}%)` : ""}`,
    `\u{23F1} Tempo: ${formatMinutes(periodStats.minutes)}${goalMinutes > 0 ? ` / ${formatMinutes(goalMinutes)} (${Math.round((periodStats.minutes / goalMinutes) * 100)}%)` : ""}`,
    `\u{1F4CD} Sessoes: ${periodStats.sessions}`,
    `\u{2705} Livros concluidos: ${periodStats.booksFinished}`,
    periodStats.sessions > 0
      ? `\u{1F4C8} Media por sessao: ${Math.round(periodStats.pages / periodStats.sessions)} pag.`
      : "",
    `\n— Gerado pelo Aegis`,
  ].filter(Boolean);
  return lines.join("\n");
}

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

// Componente de texto copiavel para o relatorio de leitura
function ReadingTextReport({
  periodStats,
  periodTitle,
  periodRange,
  goalPages,
  goalMinutes,
  books,
}: {
  periodStats: {
    pages: number;
    minutes: number;
    sessions: number;
    booksFinished: number;
  };
  periodTitle: string;
  periodRange: string;
  goalPages: number;
  goalMinutes: number;
  books: ReadingBook[];
}) {
  const text = generateReadingReport({
    periodStats,
    periodTitle,
    periodRange,
    goalPages,
    goalMinutes,
    books,
  });
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Relatorio copiado!");
    } catch {
      toast.error("Erro ao copiar");
    }
  };
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-border bg-card/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Copy className="w-4 h-4 text-orange-500" />
          <h2 className="font-bold text-muted-foreground">
            Relatorio Detalhado (Texto)
          </h2>
        </div>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-semibold transition-all cursor-pointer border border-orange-500/30 hover:bg-orange-500/20"
        >
          <Copy className="w-3.5 h-3.5" /> Copiar Tudo
        </button>
      </div>
      <div className="p-6 flex-1">
        <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap bg-background border border-border rounded-xl p-6 leading-relaxed h-full overflow-y-auto">
          {text}
        </pre>
      </div>
    </div>
  );
}

export function ReportsTab({ sessions, books, goals = [] }: ReportsTabProps) {
  const [reportMode, setReportMode] = useState<ReportMode>("weekly");
  const [periodOffset, setPeriodOffset] = useState(0);

  const goalPages = useMemo(() => {
    if (reportMode === "daily") return 0;
    const type = reportMode === "weekly" ? "PagesPerWeek" : "PagesPerMonth";
    return goals.find((g) => g.goal_type === type)?.target_value ?? 0;
  }, [goals, reportMode]);

  const goalMinutes = useMemo(() => {
    if (reportMode === "daily") return 0;
    const type = reportMode === "weekly" ? "TimePerWeek" : "TimePerMonth";
    return goals.find((g) => g.goal_type === type)?.target_value ?? 0;
  }, [goals, reportMode]);

  const { periodSessions, periodTitle, periodRange, periodStats } =
    useMemo(() => {
      const now = new Date();

      const computeStats = (sess: ReadingSession[]) => ({
        pages: sess.reduce((a, s) => a + s.pages_read, 0),
        minutes: sess.reduce((a, s) => a + s.duration_minutes, 0),
        sessions: sess.length,
        booksFinished: books.filter(
          (b) =>
            b.status === "Completed" && sess.some((s) => s.book_id === b.id),
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

  const modeTheme = {
    daily: {
      active:
        "bg-teal-600/20 text-teal-600 dark:text-teal-400 border border-teal-600/30",
      accent: "text-teal-600 dark:text-teal-400",
      color: "#2dd4bf",
    },
    weekly: {
      active:
        "bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30",
      accent: "text-orange-600 dark:text-orange-400",
      color: "#fb923c",
    },
    monthly: {
      active:
        "bg-violet-600/20 text-violet-600 dark:text-violet-400 border border-violet-600/30",
      accent: "text-violet-600 dark:text-violet-400",
      color: "#a78bfa",
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
      const book = books.find((b) => b.id === s.book_id);
      const cat = book?.category || "Outros";
      if (!stats[cat]) stats[cat] = { pages: 0, time: 0, count: 0 };
      stats[cat].pages += s.pages_read;
      stats[cat].time += s.duration_minutes;
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
      dist[date.getDay()].value += s.pages_read;
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
                    : null,
                color: "text-orange-500",
                bg: "bg-orange-500/10",
                bar: "bg-orange-500",
              },
              {
                icon: Clock,
                label: "Tempo de leitura",
                value: formatMinutes(periodStats.minutes),
                sub:
                  goalMinutes > 0 ? `meta: ${formatMinutes(goalMinutes)}` : "",
                pct:
                  goalMinutes > 0
                    ? Math.min(
                        100,
                        Math.round((periodStats.minutes / goalMinutes) * 100),
                      )
                    : null,
                color: "text-violet-600 dark:text-violet-400",
                bg: "bg-violet-500/10",
                bar: "bg-violet-500",
              },
              {
                icon: TrendingUp,
                label: "Sessões",
                value: periodStats.sessions,
                sub:
                  periodStats.sessions > 0
                    ? `${Math.round(periodStats.pages / Math.max(1, periodStats.sessions))} pág/sessão`
                    : "",
                pct: null,
                color: "text-teal-600 dark:text-teal-400",
                bg: "bg-teal-500/10",
                bar: "bg-teal-500",
              },
              {
                icon: Star,
                label: "Livros concluídos",
                value: periodStats.booksFinished,
                sub:
                  periodStats.booksFinished > 0
                    ? "no período"
                    : "nenhum neste período",
                pct: null,
                color: "text-amber-400",
                bg: "bg-amber-500/10",
                bar: "bg-amber-500",
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
                  {kpi.pct === null && kpi.sub && (
                    <p className="text-xs text-neutral-600 mt-0.5">{kpi.sub}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Análise global */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Gráfico de barras semanal */}
            <div className="md:col-span-8 bg-card border border-border rounded-xl p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Análise do período
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Páginas lidas divididas pelo dia da semana (
                    {reportMode === "monthly"
                      ? "durante o mês selecionado"
                      : reportMode === "daily"
                        ? "no dia"
                        : "na semana selecionada"}
                    )
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500">
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
                            "w-full rounded-t-xl transition-all duration-1000 ease-out min-h-[4px]",
                            d.value > 0 ? "bg-orange-500" : "bg-neutral-800",
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
                          "text-xs font-medium transition-colors",
                          d.value > 0 ? "text-orange-500" : "text-neutral-700",
                        )}
                      >
                        {d.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Troféus */}
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

          {/* Categorias */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <BarChart3 className="w-6 h-6 text-orange-500" />
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
                    className="flex flex-col gap-4 bg-background/40 border border-border/50 rounded-xl p-5 hover:bg-card/50 transition-all border-b-2 border-b-neutral-800 hover:border-b-orange-950/40"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-orange-500">
                        {cat}
                      </span>
                      <BookOpen className="w-3.5 h-3.5 text-neutral-800/50" />
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
                    <div className="pt-2">
                      <p className="text-xs font-medium text-neutral-600 mb-2">
                        {s.count} sessões
                      </p>
                      <div className="h-1 bg-muted rounded-xl overflow-hidden">
                        <div className="h-full bg-orange-500/40 w-full" />
                      </div>
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
