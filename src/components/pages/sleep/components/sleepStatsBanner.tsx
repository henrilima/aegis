"use client";

import { Clock, Star, TrendingUp, Zap } from "lucide-react";
import { formatDuration, qualityLabel } from "../sleepUtils";

interface SleepStatsBannerProps {
  weekAvgDuration: number;
  targetMinutes: number;
  weekAvgQuality: number;
  consistency: number;
  avgVsTarget: number;
}

/**
 * Exibe os KPIs semanais resumidos em cards
 */
export function SleepStatsBanner({
  weekAvgDuration,
  targetMinutes,
  weekAvgQuality,
  consistency,
  avgVsTarget,
}: SleepStatsBannerProps) {
  const cards = [
    {
      label: "Média de sono",
      value: weekAvgDuration ? formatDuration(weekAvgDuration) : "—",
      icon: Clock,
      sub: `Meta: ${formatDuration(targetMinutes)}`,
      colorClass: "text-blue-400",
    },
    {
      label: "Qualidade média",
      value: weekAvgQuality ? `${weekAvgQuality}/5` : "—",
      icon: Star,
      sub: weekAvgQuality
        ? qualityLabel(Math.round(weekAvgQuality))
        : "Sem dados",
      colorClass: "text-yellow-400",
    },
    {
      label: "Consistência",
      value: `${consistency}%`,
      icon: TrendingUp,
      sub: `Noites registradas`,
      colorClass: "text-teal-400",
    },
    {
      label: "vs. Meta",
      value:
        weekAvgDuration === 0
          ? "—"
          : `${avgVsTarget > 0 ? "+" : ""}${Math.round(avgVsTarget)}min`,
      icon: Zap,
      sub: avgVsTarget >= 0 ? "acima da meta" : "abaixo da meta",
      colorClass: avgVsTarget >= 0 ? "text-green-400" : "text-red-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col gap-1.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-neutral-500">
              {c.label}
            </span>
            <c.icon className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <span className={`text-2xl font-black leading-none ${c.colorClass}`}>
            {c.value}
          </span>
          <span className="text-[10px] text-neutral-600">{c.sub}</span>
        </div>
      ))}
    </div>
  );
}
