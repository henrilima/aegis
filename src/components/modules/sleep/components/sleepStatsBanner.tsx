"use client";

import { Clock, Star, TrendingUp, Zap } from "lucide-react";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import { formatDuration, qualityLabel } from "../sleepUtils";

interface SleepStatsBannerProps {
  weekAvgDuration: number;
  targetMinutes: number;
  weekAvgQuality: number;
  consistency: number;
  sleepDebt: number;
  layout?: "horizontal" | "vertical";
}

/**
 * Exibe os KPIs semanais resumidos em cards
 */
export function SleepStatsBanner({
  weekAvgDuration,
  targetMinutes,
  weekAvgQuality,
  consistency,
  sleepDebt,
  layout = "horizontal",
}: SleepStatsBannerProps) {
  const color = getModuleColor("sleep");
  const theme = getColorTheme(color);
  const cards = [
    {
      label: "Média de sono",
      value: weekAvgDuration ? formatDuration(weekAvgDuration) : "-",
      icon: Clock,
      sub: `Meta: ${formatDuration(targetMinutes)}`,
      colorClass: "text-blue-400",
      tooltip: "Tempo médio que você permaneceu dormindo nos últimos 7 dias.",
    },
    {
      label: "Qualidade média",
      value: weekAvgQuality ? `${weekAvgQuality}/5` : "-",
      icon: Star,
      sub: weekAvgQuality
        ? qualityLabel(Math.round(weekAvgQuality))
        : "Sem dados",
      colorClass: "text-yellow-400",
      tooltip:
        "Sua percepção subjetiva do sono nos últimos 7 dias (Média de 1 a 5).",
    },
    {
      label: "Consistência",
      value: `${consistency}%`,
      icon: TrendingUp,
      sub: `Noites registradas`,
      colorClass: "text-teal-600 dark:text-teal-400",
      tooltip:
        "Frequência com que você registrou o sono nos últimos 7 dias. Calculado dividindo as noites dormidas pelo total de dias.",
    },
    {
      label: "Débito semanal",
      value:
        weekAvgDuration === 0
          ? "-"
          : sleepDebt > 0
            ? formatDuration(sleepDebt)
            : "Nenhum",
      icon: Zap,
      sub: sleepDebt > 0 ? "sono em falta" : "meta em dia",
      colorClass:
        sleepDebt > 0
          ? "text-red-500 dark:text-red-400"
          : "text-green-500 dark:text-green-400",
      tooltip:
        "Total acumulado de horas de sono que faltaram para atingir sua meta diária nesta semana.",
    },
  ];

  const renderCard = (c: (typeof cards)[0]) => {
    if (layout === "vertical") {
      return (
        <div
          key={c.label}
          className="bg-card border border-border rounded-xl p-5 flex items-center justify-between gap-4 transition-all hover:bg-muted/10"
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2 rounded-lg bg-muted/40 border border-border/50 flex items-center justify-center",
                theme.text,
              )}
            >
              <c.icon className="w-4.5 h-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 capitalize">
                {c.label}
              </span>
              <span className="text-xs text-neutral-500 mt-0.5">{c.sub}</span>
            </div>
          </div>
          <span className={`text-2xl font-bold ${c.colorClass}`}>
            {c.value}
          </span>
        </div>
      );
    }

    return (
      <div
        key={c.label}
        className="bg-card border border-border rounded-xl p-5 flex flex-col gap-2 transition-all hover:border-border/80"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 capitalize">
            {c.label}
          </span>
          <c.icon className={cn("w-4 h-4", theme.text)} />
        </div>
        <span
          className={`text-3xl font-bold tracking-tight leading-none ${c.colorClass}`}
        >
          {c.value}
        </span>
        <span className="text-xs text-neutral-500 font-medium mt-0.5">
          {c.sub}
        </span>
      </div>
    );
  };

  return (
    <div
      className={cn(
        layout === "vertical"
          ? "flex flex-col gap-4"
          : "grid grid-cols-2 md:grid-cols-4 gap-4",
      )}
    >
      {cards.map((c) =>
        c.tooltip ? (
          <ToolTip key={c.label} content={c.tooltip}>
            {renderCard(c)}
          </ToolTip>
        ) : (
          renderCard(c)
        ),
      )}
    </div>
  );
}
