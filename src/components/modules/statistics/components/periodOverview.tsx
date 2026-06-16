"use client";

import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Info,
  Moon,
  Target,
} from "lucide-react";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { cn } from "@/lib/utils";
import type { CrossMetric, PerformanceSummary } from "../types";

interface PeriodOverviewProps {
  days: number;
  metrics: CrossMetric[];
  summary: PerformanceSummary;
}

const formatDate = (date: string | null) => {
  if (!date) return "-";
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
};

const formatHours = (hours: number) => `${hours.toFixed(1)}h`;

export function PeriodOverview({
  days,
  metrics,
  summary,
}: PeriodOverviewProps) {
  const activeDays = metrics.filter(
    (m) =>
      m.studyHours > 0 ||
      m.sleepHours > 0 ||
      m.readingMinutes > 0 ||
      m.questionsTotal > 0,
  ).length;
  const totalStudy = metrics.reduce((acc, m) => acc + m.studyHours, 0);
  const totalQuestions = metrics.reduce((acc, m) => acc + m.questionsTotal, 0);
  const totalPages = metrics.reduce((acc, m) => acc + m.readingPages, 0);
  const bestHitDay = metrics
    .filter((m) => m.questionsTotal > 0)
    .sort((a, b) => b.studyHitRate - a.studyHitRate)[0];

  const sleepDelta = summary.restedHitRate - summary.tiredHitRate;
  const focusDelta = summary.focusHitRateHigh - summary.focusHitRateLow;
  const hasSleepSignal = summary.restedHitRate > 0 || summary.tiredHitRate > 0;
  const hasFocusSignal =
    summary.focusHitRateHigh > 0 || summary.focusHitRateLow > 0;

  const recommendation =
    hasFocusSignal && focusDelta >= 8
      ? "Dias com foco alto estao rendendo melhor. Proteja blocos de estudo sem interrupcao."
      : hasSleepSignal && sleepDelta >= 8
        ? "O descanso esta pesando na precisao. Sono regular deve ser prioridade no proximo ciclo."
        : summary.consistencyScore < 55
          ? "O principal ganho agora e frequencia. Registros mais constantes melhoram acerto e leitura dos dados."
          : "O periodo esta equilibrado. O proximo passo e comparar materias e ajustar onde ha mais carga.";

  const overviewItems = [
    {
      icon: CalendarDays,
      label: "Dias com registros",
      value: `${activeDays}/${days}`,
      sub: `${summary.consistencyScore.toFixed(0)}% de consistencia`,
      tooltip:
        "Conta os dias do periodo que tiveram ao menos um registro de estudo, sono, leitura ou questoes.",
      color: "text-sky-400",
      bg: "bg-sky-500/10",
    },
    {
      icon: Target,
      label: "Carga de estudo",
      value: formatHours(totalStudy),
      sub: `${totalQuestions} questoes registradas`,
      tooltip:
        "Soma todas as horas de estudo registradas no periodo. As questoes sao o total de novas e revisadas.",
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      icon: BookOpen,
      label: "Leitura",
      value: `${totalPages}p`,
      sub: `${summary.avgPpm.toFixed(1)} paginas/min`,
      tooltip:
        "Soma as paginas lidas no periodo. Paginas/min e a media dos dias com sessao de leitura.",
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    },
    {
      icon: CheckCircle2,
      label: "Melhor acerto",
      value: bestHitDay ? `${bestHitDay.studyHitRate.toFixed(1)}%` : "-",
      sub: bestHitDay ? formatDate(bestHitDay.date) : "sem questoes",
      tooltip:
        "Mostra o dia com maior taxa de acerto entre os dias que tiveram questoes registradas.",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <section className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-4">
      <div className="border border-border bg-card rounded-xl p-5">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Painel do periodo
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Totais consolidados e destaques dos ultimos {days} dias.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {overviewItems.map((item) => (
            <ToolTip key={item.label} content={item.tooltip}>
              <div className="min-h-[116px] rounded-xl border border-border/70 bg-background/40 p-4 flex flex-col justify-between cursor-help">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {item.label}
                  </span>
                  <div className={cn("p-1.5 rounded-lg", item.bg)}>
                    <item.icon className={cn("w-3.5 h-3.5", item.color)} />
                  </div>
                </div>
                <div>
                  <p
                    className={cn(
                      "text-2xl font-bold leading-none",
                      item.color,
                    )}
                  >
                    {item.value}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    {item.sub}
                  </p>
                </div>
              </div>
            </ToolTip>
          ))}
        </div>
      </div>

      <div className="border border-border bg-card rounded-xl p-5 flex flex-col justify-between gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Leitura do ciclo
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Prioridade calculada a partir dos registros recentes.
            </p>
          </div>
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <Moon className="w-4 h-4 text-rose-400" />
          </div>
        </div>

        <p className="text-sm leading-relaxed text-foreground font-medium">
          {recommendation}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Signal
            label="Sono descansado"
            value={
              hasSleepSignal
                ? `${sleepDelta >= 0 ? "+" : ""}${sleepDelta.toFixed(1)} p.p.`
                : "-"
            }
            sub="vs. noites curtas"
            positive={sleepDelta >= 0}
            tooltip="Diferença entre a taxa de acerto em dias com 7,5h ou mais de sono e dias com até 6h de sono."
          />
          <Signal
            label="Foco alto"
            value={
              hasFocusSignal
                ? `${focusDelta >= 0 ? "+" : ""}${focusDelta.toFixed(1)} p.p.`
                : "-"
            }
            sub="vs. foco baixo"
            positive={focusDelta >= 0}
            tooltip="Diferença entre a taxa de acerto quando o foco registrado foi 4 ou mais e quando foi 2 ou menos."
          />
        </div>
      </div>
    </section>
  );
}

function Signal({
  label,
  value,
  sub,
  positive,
  tooltip,
}: {
  label: string;
  value: string;
  sub: string;
  positive: boolean;
  tooltip: string;
}) {
  return (
    <ToolTip content={tooltip}>
      <div className="rounded-xl border border-border/70 bg-background/40 p-3 cursor-help">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-bold text-muted-foreground">{label}</p>
          <Info className="w-3 h-3 text-muted-foreground/70" />
        </div>
        <p
          className={cn(
            "text-xl font-bold leading-none mt-2",
            positive ? "text-emerald-400" : "text-red-400",
          )}
        >
          {value}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>
      </div>
    </ToolTip>
  );
}
