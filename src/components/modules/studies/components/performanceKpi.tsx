"use client";

import { BookOpen, Calendar, TrendingUp, Zap } from "lucide-react";
import { formatHours } from "../utils";

interface PerformanceKpiProps {
  hours: number;
  qPerHour: number;
  pPerHour: number;
  sessionsCount: number;
  reportMode?: "daily" | "weekly" | "monthly" | "all";
}

export function PerformanceKpi({
  hours,
  qPerHour,
  pPerHour,
  sessionsCount,
  reportMode = "weekly",
}: PerformanceKpiProps) {
  const timeLabel =
    reportMode === "daily"
      ? "Tempo no Dia"
      : reportMode === "weekly"
        ? "Tempo na Semana"
        : reportMode === "monthly"
          ? "Tempo no Mês"
          : "Tempo Total";

  const kpis = [
    {
      label: timeLabel,
      value: formatHours(hours),
      icon: TrendingUp,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-400/10",
    },
    {
      label: "Eficiência",
      value: `${qPerHour.toFixed(1)} q/h`,
      icon: Zap,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
    },
    {
      label: "Ritmo Leitura",
      value: `${pPerHour.toFixed(1)} p/h`,
      icon: BookOpen,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    {
      label: "Total Sessões",
      value: `${sessionsCount}`,
      icon: Calendar,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpis.map((stat) => (
        <div
          key={stat.label}
          className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 transition-all hover:bg-accent/50/40"
        >
          <div
            className={`p-3 rounded-xl border border-border/50 ${stat.bg} ${stat.color}`}
          >
            <stat.icon className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground leading-tight">
              {stat.label}
            </span>
            <span className="text-xl font-black text-foreground leading-tight">
              {stat.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
