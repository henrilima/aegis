"use client";

import { Calendar } from "lucide-react";
import { useMemo } from "react";
import {
  ActivityHeatmap,
  type HeatmapItem,
} from "@/components/global/ActivityHeatmap";
import { getModuleColor } from "@/modules.config";
import type { Habit } from "../types";

interface HabitsHeatmapProps {
  habits: Habit[];
}

export function HabitsHeatmap({ habits }: HabitsHeatmapProps) {
  const { data, totalCompletions, currentStreak } = useMemo(() => {
    const map: Record<string, HeatmapItem> = {};
    let total = 0;

    habits.forEach((habit) => {
      if (habit.completedDates && Array.isArray(habit.completedDates)) {
        habit.completedDates.forEach((dateStr) => {
          const cleanDate = dateStr.slice(0, 10);
          const currentCount = map[cleanDate]?.count || 0;
          const nextCount = currentCount + 1;
          map[cleanDate] = {
            count: nextCount,
            details: `${nextCount} ${nextCount === 1 ? "hábito concluído" : "hábitos concluídos"}`,
          };
          total += 1;
        });
      }
    });

    // Calcula a sequência atual de dias consecutivos com pelo menos 1 hábito
    const today = new Date();
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;

      if (map[dateStr]?.count > 0) {
        streak += 1;
      } else if (i === 0) {
      } else {
        break;
      }
    }

    return {
      data: map,
      totalCompletions: total,
      currentStreak: streak,
    };
  }, [habits]);

  const stats = [
    {
      label: "Sequência atual",
      value: `${currentStreak} dias`,
      colorClass: "text-amber-500",
    },
    {
      label: "Total concluído",
      value: `${totalCompletions} hábitos`,
      colorClass: "text-emerald-500",
    },
  ];

  return (
    <ActivityHeatmap
      color={getModuleColor("habits")}
      title="Mapa de Consistência de Hábitos"
      subtitle="Frequência diária de hábitos concluídos"
      icon={Calendar}
      data={data}
      unitLabel="hábitos"
      stats={stats}
    />
  );
}
