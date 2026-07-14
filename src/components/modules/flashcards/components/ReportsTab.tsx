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
import { EmptyState } from "@/components/ui/EmptyState";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { Flashcard, FlashcardDeck } from "../types";
import { FlashcardsReportCanvas } from "./FlashcardsReportCanvas";
import { FlashcardsTextReport } from "./FlashcardsTextReport";
import { ForgettingCurveChart } from "./ForgettingCurveChart";

interface RichDeck extends FlashcardDeck {
  cards: Flashcard[];
}

interface ReportsTabProps {
  decks: RichDeck[];
}

type ReportMode = "daily" | "weekly" | "monthly";

function isoDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

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

export function ReportsTab({ decks }: ReportsTabProps) {
  const [reportMode, setReportMode] = useState<ReportMode>("weekly");
  const [periodOffset, setPeriodOffset] = useState(0);

  // Extract all cards
  const allCards = useMemo(() => {
    return decks.flatMap((d) => d.cards);
  }, [decks]);

  const { periodTitle, periodRange, periodStats, weekDistribution } =
    useMemo(() => {
      const now = new Date();
      let startDateStr = "";
      let endDateStr = "";
      let title = "";
      let rangeText = "";

      const fmtShortDate = (d: Date) =>
        `${d.getDate()} ${d.toLocaleString("pt-BR", { month: "short" }).replace(".", "")}`;

      if (reportMode === "daily") {
        const target = new Date(now);
        target.setDate(target.getDate() + periodOffset);
        startDateStr = isoDate(target);
        endDateStr = startDateStr;

        const weekday = target.toLocaleString("pt-BR", { weekday: "long" });
        const fmtDate = `${String(target.getDate()).padStart(2, "0")}/${String(target.getMonth() + 1).padStart(2, "0")}/${target.getFullYear()}`;

        title = "Relatório diário de flashcards";
        rangeText = `${weekday}, ${fmtDate}`;
      } else if (reportMode === "weekly") {
        const first = startOfWeek(now);
        first.setDate(first.getDate() + periodOffset * 7);
        const last = new Date(first);
        last.setDate(last.getDate() + 6);

        startDateStr = isoDate(first);
        endDateStr = isoDate(last);

        title = "Relatório semanal de flashcards";
        rangeText = `${fmtShortDate(first)} - ${fmtShortDate(last)} / ${first.getFullYear()}`;
      } else {
        const start = startOfMonth(now);
        start.setMonth(start.getMonth() + periodOffset);
        const monthPrefix = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;

        startDateStr = `${monthPrefix}-01`;
        endDateStr = `${monthPrefix}-31`; // Approx

        const monthName = start.toLocaleString("pt-BR", { month: "long" });

        title = "Relatório mensal de flashcards";
        rangeText = `${monthName} / ${start.getFullYear()}`;
      }

      // Filtra cartões revisados no período. Como temos apenas lastReviewed,
      // consideramos cada cartão revisado como 1 sessão. Parse local para evitar fuso horário UTC.
      const getLocalDateStr = (isoStr: string) => {
        const d = new Date(isoStr);
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      };

      const cardsReviewedInPeriod = allCards.filter((c) => {
        if (!c.lastReviewed) return false;
        const reviewDate = getLocalDateStr(c.lastReviewed);
        if (reportMode === "daily") {
          return reviewDate === startDateStr;
        } else if (reportMode === "weekly") {
          return reviewDate >= startDateStr && reviewDate <= endDateStr;
        } else {
          const monthPrefix = startDateStr.slice(0, 7); // YYYY-MM
          return reviewDate.startsWith(monthPrefix);
        }
      });

      // Calcula métricas de aproveitamento com base nas revisões do período
      const periodReviews = cardsReviewedInPeriod.length;
      const periodSuccess = cardsReviewedInPeriod.filter(
        (c) => c.reviewCount > 0 && c.successCount / c.reviewCount >= 0.5,
      ).length;
      const periodAccuracy =
        periodReviews > 0
          ? Math.round((periodSuccess / periodReviews) * 100)
          : 0;

      // Distribuição diária de revisões no período (começando na segunda)
      const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
      const dist = days.map((label) => ({ label, value: 0 }));

      cardsReviewedInPeriod.forEach((c) => {
        if (!c.lastReviewed) return;
        const d = new Date(c.lastReviewed);
        // Usa o dia local do fuso horário para bater com a comparação acima
        const rawDay = d.getDay(); // 0=Sun, 1=Mon...6=Sat
        const monFirstIdx = rawDay === 0 ? 6 : rawDay - 1; // Mon=0 … Sun=6
        dist[monFirstIdx].value += 1;
      });

      const activeDecksCount =
        decks.filter((d) =>
          d.cards.some((c) =>
            cardsReviewedInPeriod.some((rc) => rc.id === c.id),
          ),
        ).length || decks.length;

      return {
        periodTitle: title,
        periodRange: rangeText,
        periodStats: {
          decksCount: activeDecksCount,
          totalCards: allCards.length,
          reviewsCount: periodReviews,
          successCount: periodSuccess,
          accuracy: periodAccuracy,
        },
        weekDistribution: dist,
      };
    }, [reportMode, periodOffset, allCards, decks]);

  const maxDailyValue = Math.max(...weekDistribution.map((d) => d.value), 1);
  const totalLifetimeReviews = useMemo(
    () => allCards.reduce((acc, c) => acc + c.reviewCount, 0),
    [allCards],
  );

  if (totalLifetimeReviews === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Relatório indisponível"
        description="Você poderá ver gráficos e estatísticas completas assim que realizar suas primeiras sessões de estudos com flashcards."
      />
    );
  }

  const color = getModuleColor("flashcards");
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
    },
    weekly: {
      active: cn(
        moduleTheme.bg,
        moduleTheme.text,
        "border",
        moduleTheme.border,
      ),
      accent: moduleTheme.text,
    },
    monthly: {
      active: cn(
        moduleTheme.bg,
        moduleTheme.text,
        "border",
        moduleTheme.border,
      ),
      accent: moduleTheme.text,
    },
  };
  const theme = modeTheme[reportMode];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Period Selector */}
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
                    : "text-muted-foreground hover:text-foreground",
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

      {/* Visual Canvas + Text copy report */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <FlashcardsReportCanvas
          periodStats={periodStats}
          periodTitle={periodTitle}
          periodRange={periodRange}
          reportMode={reportMode}
        />

        <FlashcardsTextReport
          periodStats={periodStats}
          periodTitle={periodTitle}
          periodRange={periodRange}
        />
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            icon: BookOpen,
            label: "Total de baralhos",
            value: decks.length,
            sub: "baralhos cadastrados",
            pct: 100,
            color: moduleTheme.text,
            bg: moduleTheme.bg,
            bar: moduleTheme.solid,
          },
          {
            icon: Star,
            label: "Cartões ativos",
            value: allCards.length,
            sub: "cartões cadastrados",
            pct: 100,
            color: moduleTheme.text,
            bg: moduleTheme.bg,
            bar: moduleTheme.solid,
          },
          {
            icon: Clock,
            label: "Revisões realizadas",
            value: periodStats.reviewsCount,
            sub: "revisões acumuladas",
            pct: periodStats.reviewsCount > 0 ? 100 : 0,
            color: moduleTheme.text,
            bg: moduleTheme.bg,
            bar: moduleTheme.solid,
          },
          {
            icon: Award,
            label: "Aproveitamento médio",
            value: `${periodStats.accuracy}%`,
            sub: "taxa de acerto global",
            pct: periodStats.accuracy,
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
                  {kpi.sub}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Visual Chart + Rewards Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Weekly distribution visual chart */}
        <div className="md:col-span-8 bg-card border border-border rounded-xl p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold text-foreground">
                Distribuição Semanal
              </h3>
              <p className="text-xs text-muted-foreground">
                Esforço de revisões por dia da semana
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
                          {d.value} revisões
                        </div>
                      )}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-bold",
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

        {/* Rewards / Trophy Panel */}
        <div className="md:col-span-4 bg-card border border-border rounded-xl p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">Conquistas</h3>
            <Award className="w-5 h-5 text-amber-600 dark:text-amber-500" />
          </div>
          <div className="flex flex-col gap-4">
            {[
              {
                label: "Super Foco",
                sub: "Revisões no período",
                value: periodStats.reviewsCount,
                icon: Flame,
                color: "text-rose-500",
                bg: "bg-rose-500/10",
              },
              {
                label: "Mestre Mental",
                sub: "Aproveitamento geral",
                value: `${periodStats.accuracy}%`,
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

      {/* Curva de Esquecimento Visual */}
      <ForgettingCurveChart decks={decks} />

      {/* Decks Accuracy & Reviews distribution */}
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
              Desempenho por baralho
            </h3>
            <p className="text-xs text-muted-foreground">
              Aproveitamento de memorização e estatísticas detalhadas por
              assunto
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck) => {
            const mDeck = getColorTheme(deck.color || "blue");
            const totalCards = deck.cards.length;

            // Calculate accuracy
            let totalReviews = 0;
            let totalSuccess = 0;
            let lastReviewedText = "Nunca estudado";

            deck.cards.forEach((card) => {
              totalReviews += card.reviewCount;
              totalSuccess += card.successCount;
              if (card.lastReviewed) {
                const cardDate = new Date(card.lastReviewed);
                if (
                  lastReviewedText === "Nunca estudado" ||
                  cardDate > new Date(lastReviewedText)
                ) {
                  lastReviewedText = cardDate.toLocaleDateString("pt-BR");
                }
              }
            });

            const accuracy =
              totalReviews > 0
                ? Math.round((totalSuccess / totalReviews) * 100)
                : 0;

            return (
              <div
                key={deck.id}
                className={cn(
                  "flex flex-col gap-4 bg-background/40 border border-border/50 rounded-xl p-5 hover:bg-card/50 transition-all",
                )}
              >
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                      className={cn(
                        "w-2.5 h-2.5 rounded-full shrink-0",
                        mDeck.solid,
                      )}
                    />
                    <span className="text-sm font-bold text-foreground truncate">
                      {deck.name}
                    </span>
                  </div>
                  <span
                    className={cn("text-xs font-semibold shrink-0", mDeck.text)}
                  >
                    {totalCards} cartões
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <span className="text-2xl font-bold text-foreground tabular-nums">
                      {totalReviews}
                    </span>
                    <p className="text-xs font-medium text-neutral-700 mt-0.5">
                      Revisões
                    </p>
                  </div>
                  <div className="w-px h-8 bg-muted" />
                  <div className="flex-1">
                    <span className="text-2xl font-bold text-foreground tabular-nums leading-none">
                      {totalReviews > 0 ? `${accuracy}%` : "—"}
                    </span>
                    <p className="text-xs font-medium text-neutral-700 mt-0.5">
                      Acertos
                    </p>
                  </div>
                </div>
                <div>
                  <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full", mDeck.solid)}
                      style={{
                        width: `${totalReviews > 0 ? accuracy : 0}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-neutral-600 mt-1.5">
                    <span>Último estudo:</span>
                    <span>{lastReviewedText}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
