"use client";

import { Zap } from "lucide-react";
import type { StudyStats } from "../types";

interface PerformanceCompositionProps {
  allStats: StudyStats;
  isMonthly?: boolean;
}

export function PerformanceComposition({
  allStats,
  isMonthly = false,
}: PerformanceCompositionProps) {
  const items = [
    {
      label: "Resolução de Questões",
      color: "bg-amber-500",
      raw: allStats.questions,
    },
    {
      label: "Leitura de Páginas",
      color: "bg-emerald-500",
      raw: allStats.pages,
    },
    {
      label: "Outros (Personalizadas)",
      color: "bg-violet-500",
      raw: allStats.sessionsCount,
    },
  ];

  const total =
    allStats.questions + allStats.pages + allStats.sessionsCount || 1;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col gap-8 shadow_xl">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-violet-500" />
        <h3 className=" font-black uppercase text-neutral-400">
          {isMonthly ? "Composição Mensal" : "Composição de Atividade"}
        </h3>
      </div>
      <div className="flex flex-col gap-8">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-neutral-400 uppercase">{item.label}</span>
              <span className="text-white">{item.raw}</span>
            </div>
            <div className="h-2 w-full bg-neutral-950 rounded-full border border-neutral-800 overflow-hidden">
              <div
                className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                style={{
                  width: `${Math.min(100, (item.raw / total) * 100)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
