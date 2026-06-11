"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  Brain,
  Gauge,
  Moon,
  MoveRight,
  Target,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { CrossMetric } from "../types";

interface PeriodComparisonProps {
  metrics: CrossMetric[];
  days: number;
  activeSources: string[];
}

// Helper para formatar números
const formatNum = (val: number, decimals = 1) => {
  if (Number.isNaN(val) || !Number.isFinite(val)) return "0";
  return val.toFixed(decimals);
};

// Tradução dos dias da semana
const WEEKDAYS_PT = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];

export function PeriodComparison({
  metrics,
  days,
  activeSources,
}: PeriodComparisonProps) {
  // Dividir os dados históricos em período atual e período anterior
  const currentPeriod = metrics.slice(-days);
  const previousPeriod = metrics.slice(0, Math.max(0, metrics.length - days));

  const [compareMetric, setCompareMetric] = useState<
    "study" | "sleep" | "reading" | "focus" | "hit"
  >(() => {
    if (activeSources.includes("estudos")) return "study";
    if (activeSources.includes("sono")) return "sleep";
    if (activeSources.includes("leitura")) return "reading";
    return "focus";
  });

  // Função para calcular médias com segurança
  const calcAvg = (
    period: CrossMetric[],
    selector: (m: CrossMetric) => number | undefined,
    filter?: (m: CrossMetric) => boolean,
  ) => {
    const validMetrics = filter ? period.filter(filter) : period;
    const values = validMetrics
      .map(selector)
      .filter((v): v is number => v !== undefined && !Number.isNaN(v));

    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  };

  // 1. Estudos
  const studyHoursCurrent = calcAvg(currentPeriod, (m) => m.studyHours);
  const studyHoursPrevious = calcAvg(previousPeriod, (m) => m.studyHours);
  const studyHitCurrent = calcAvg(
    currentPeriod,
    (m) => m.studyHitRate,
    (m) => m.questionsTotal > 0,
  );
  const studyHitPrevious = calcAvg(
    previousPeriod,
    (m) => m.studyHitRate,
    (m) => m.questionsTotal > 0,
  );

  // 2. Sono
  const sleepHoursCurrent = calcAvg(currentPeriod, (m) => m.sleepHours);
  const sleepHoursPrevious = calcAvg(previousPeriod, (m) => m.sleepHours);

  // 3. Leitura
  const readingPagesCurrent = calcAvg(
    currentPeriod,
    (m) => m.readingPages as number,
  );
  const readingPagesPrevious = calcAvg(
    previousPeriod,
    (m) => m.readingPages as number,
  );

  // 4. Foco
  const focusCurrent = calcAvg(
    currentPeriod,
    (m) => m.focusScore,
    (m) => m.focusScore !== undefined && m.focusScore !== null,
  );
  const focusPrevious = calcAvg(
    previousPeriod,
    (m) => m.focusScore,
    (m) => m.focusScore !== undefined && m.focusScore !== null,
  );

  // Lista de cards comparativos
  const cards = [
    {
      id: "study",
      source: "estudos",
      label: "Horas de estudo",
      icon: BookOpen,
      current: studyHoursCurrent,
      previous: studyHoursPrevious,
      unit: "h",
      format: (v: number) => `${formatNum(v, 1)}h`,
      better: "higher",
      color: "text-violet-500 dark:text-violet-400",
      bgColor: "bg-violet-500/10",
      borderColor: "border-violet-500/20",
    },
    {
      id: "hit",
      source: "estudos",
      label: "Precisão média",
      icon: Gauge,
      current: studyHitCurrent,
      previous: studyHitPrevious,
      unit: "%",
      format: (v: number) => `${formatNum(v, 1)}%`,
      better: "higher",
      color: "text-emerald-500 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
    {
      id: "sleep",
      source: "sono",
      label: "Média de sono",
      icon: Moon,
      current: sleepHoursCurrent,
      previous: sleepHoursPrevious,
      unit: "h",
      format: (v: number) => `${formatNum(v, 1)}h`,
      better: "higher",
      color: "text-blue-500 dark:text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    {
      id: "reading",
      source: "leitura",
      label: "Páginas lidas",
      icon: Target,
      current: readingPagesCurrent,
      previous: readingPagesPrevious,
      unit: "p",
      format: (v: number) => `${formatNum(v, 0)}p`,
      better: "higher",
      color: "text-orange-500 dark:text-orange-400",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/20",
    },
    {
      id: "focus",
      source: "foco",
      label: "Foco médio",
      icon: Brain,
      current: focusCurrent,
      previous: focusPrevious,
      unit: "",
      format: (v: number) => formatNum(v, 1),
      better: "higher",
      color: "text-rose-500 dark:text-rose-400",
      bgColor: "bg-rose-500/10",
      borderColor: "border-rose-500/20",
    },
  ].filter((c) => activeSources.includes(c.source));

  // Função para renderizar a variação percentual (delta)
  const renderDelta = (
    current: number,
    previous: number,
    better: "higher" | "lower",
  ) => {
    if (previous === 0) {
      if (current === 0) {
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground bg-accent/40 px-2 py-0.5 rounded-full border border-border/40">
            <MoveRight className="w-3 h-3" /> Sem dados
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          <ArrowUpRight className="w-3 h-3" /> Novo
        </span>
      );
    }

    const pct = ((current - previous) / previous) * 100;

    if (Math.abs(pct) < 0.1) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground bg-accent/40 px-2 py-0.5 rounded-full border border-border/40">
          <MoveRight className="w-3 h-3" /> Estável
        </span>
      );
    }

    const isGood = better === "higher" ? pct > 0 : pct < 0;

    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border",
          isGood
            ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
            : "text-red-500 bg-red-500/10 border-red-500/20",
        )}
      >
        {pct > 0 ? (
          <ArrowUpRight className="w-3 h-3" />
        ) : (
          <ArrowDownRight className="w-3 h-3" />
        )}
        {pct > 0 ? "+" : ""}
        {pct.toFixed(1)}%
      </span>
    );
  };

  // Cálculo das estatísticas por dia da semana para o gráfico/tabela comparativo inferior
  const getWeekdayData = () => {
    const weekdayMap = WEEKDAYS_PT.map((name, index) => {
      // O index do JS Date: 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
      // Mapeamos para bater com WEEKDAYS_PT: 0 = Segunda, 1 = Terça, ..., 5 = Sábado, 6 = Domingo
      const jsDayIndex = index === 6 ? 0 : index + 1;

      const getAvgForDay = (period: CrossMetric[]) => {
        const filtered = period.filter((m) => {
          const [y, mo, d] = m.date.split("-").map(Number);
          const date = new Date(y, mo - 1, d);
          return date.getDay() === jsDayIndex;
        });

        if (filtered.length === 0) return 0;

        let values: number[] = [];
        if (compareMetric === "study") {
          values = filtered.map((m) => m.studyHours);
        } else if (compareMetric === "sleep") {
          values = filtered.map((m) => m.sleepHours);
        } else if (compareMetric === "reading") {
          values = filtered.map((m) => m.readingPages);
        } else if (compareMetric === "focus") {
          values = filtered.map((m) => m.focusScore ?? 0).filter((v) => v > 0);
        } else if (compareMetric === "hit") {
          values = filtered
            .map((m) => m.studyHitRate)
            .filter((_, i) => filtered[i].questionsTotal > 0);
        }

        if (values.length === 0) return 0;
        return values.reduce((sum, v) => sum + v, 0) / values.length;
      };

      const curr = getAvgForDay(currentPeriod);
      const prev = getAvgForDay(previousPeriod);

      return {
        name,
        current: curr,
        previous: prev,
      };
    });

    return weekdayMap;
  };

  const weekdayData = getWeekdayData();
  const maxVal = Math.max(
    ...weekdayData.map((d) => Math.max(d.current, d.previous)),
    1,
  );

  // Unidade de medida para a legenda lateral
  const getMetricDetails = () => {
    switch (compareMetric) {
      case "study":
        return {
          label: "Horas de estudo",
          format: (v: number) => `${v.toFixed(1)}h`,
        };
      case "sleep":
        return {
          label: "Horas de sono",
          format: (v: number) => `${v.toFixed(1)}h`,
        };
      case "reading":
        return {
          label: "Páginas lidas",
          format: (v: number) => `${v.toFixed(0)}p`,
        };
      case "focus":
        return { label: "Foco médio", format: (v: number) => v.toFixed(1) };
      case "hit":
        return { label: "Acertos", format: (v: number) => `${v.toFixed(0)}%` };
      default:
        return { label: "Métrica", format: (v: number) => v.toFixed(1) };
    }
  };

  const metricDetails = getMetricDetails();

  return (
    <div className="w-full flex flex-col gap-5">
      {previousPeriod.length === 0 ? (
        <div className="p-5 bg-card border border-border rounded-xl text-center text-xs text-muted-foreground font-medium">
          Dados insuficientes no período anterior para gerar a análise de
          tendências comparativas.
        </div>
      ) : (
        <>
          {/* Cartões Comparativos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {cards.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.id}
                  className="p-4 bg-card/40 border border-border/60 rounded-xl flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-muted-foreground">
                      {c.label}
                    </span>
                    <div className={cn("p-1.5 rounded-lg", c.bgColor, c.color)}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-foreground">
                      {c.format(c.current)}
                    </span>
                    {renderDelta(
                      c.current,
                      c.previous,
                      c.better as "higher" | "lower",
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-medium border-t border-border/20 pt-2 flex justify-between">
                    <span>Período anterior:</span>
                    <span className="font-bold">{c.format(c.previous)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Gráfico Comparativo por Dia da Semana */}
          <div className="bg-card border border-border rounded-xl p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-bold text-foreground">
                  Desempenho por dia da semana
                </h2>
                <p className="text-[10px] font-bold text-muted-foreground mt-0.5">
                  Análise comparativa das médias de comportamento nos dias da
                  semana
                </p>
              </div>

              {/* Seletor de Métrica para Comparação */}
              <div className="flex flex-wrap gap-1 bg-accent/40 p-1 rounded-xl border border-border/60">
                {cards.map((c) => {
                  const isActive = compareMetric === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        setCompareMetric(c.id as typeof compareMetric)
                      }
                      className={cn(
                        "text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all",
                        isActive
                          ? "bg-card text-foreground border border-border/40"
                          : "text-muted-foreground hover:text-foreground border border-transparent",
                      )}
                    >
                      {c.label.split(" ")[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Listagem de Barras Comparativas */}
            <div className="space-y-4">
              {weekdayData.map((d) => {
                const pctCurrent = (d.current / maxVal) * 100;
                const pctPrevious = (d.previous / maxVal) * 100;

                return (
                  <div
                    key={d.name}
                    className="grid grid-cols-1 md:grid-cols-[130px_1fr] items-center gap-2 md:gap-4"
                  >
                    <span className="text-xs font-bold text-foreground md:text-right">
                      {d.name}
                    </span>
                    <div className="space-y-1.5">
                      {/* Barra do Período Atual */}
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 bg-accent/60 border border-border/40 rounded-full flex-1 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              compareMetric === "study" && "bg-violet-500",
                              compareMetric === "hit" && "bg-emerald-500",
                              compareMetric === "sleep" && "bg-blue-500",
                              compareMetric === "reading" && "bg-orange-500",
                              compareMetric === "focus" && "bg-rose-500",
                            )}
                            style={{ width: `${Math.max(1, pctCurrent)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-foreground min-w-[36px] text-right">
                          {metricDetails.format(d.current)}
                        </span>
                        <span className="text-[9px] font-bold text-muted-foreground min-w-[50px]">
                          (atual)
                        </span>
                      </div>

                      {/* Barra do Período Anterior */}
                      <div className="flex items-center gap-2 opacity-60">
                        <div className="h-2 bg-accent/40 border border-border/20 rounded-full flex-1 overflow-hidden">
                          <div
                            className="h-full bg-muted-foreground rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(1, pctPrevious)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground min-w-[36px] text-right">
                          {metricDetails.format(d.previous)}
                        </span>
                        <span className="text-[9px] font-bold text-muted-foreground min-w-[50px]">
                          (anterior)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
