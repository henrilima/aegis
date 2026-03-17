"use client";

import { BookOpen, Calendar, TrendingUp, Zap } from "lucide-react";
import { formatHours } from "../utils";

interface PerformanceKpiProps {
  hours: number;
  qPerHour: number;
  pPerHour: number;
  sessionsCount: number;
  isMonthly?: boolean;
}

export function PerformanceKpi({
  hours,
  qPerHour,
  pPerHour,
  sessionsCount,
  isMonthly = false,
}: PerformanceKpiProps) {
  const kpis = [
    {
      label: isMonthly ? "Tempo no Mês" : "Tempo Total",
      value: formatHours(hours),
      icon: TrendingUp,
      color: "text-violet-400",
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
      color: "text-emerald-400",
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
          className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center gap-4 transition-all hover:bg-neutral-800/40"
        >
          <div
            className={`p-3 rounded-xl border border-neutral-800/50 ${stat.bg} ${stat.color}`}
          >
            <stat.icon className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-neutral-500 leading-tight">
              {stat.label}
            </span>
            <span className="text-xl font-black text-white leading-tight">
              {stat.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
