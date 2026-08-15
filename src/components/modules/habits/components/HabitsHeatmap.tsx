"use client";

import { Activity } from "lucide-react";
import { useMemo } from "react";
import {
  ActivityHeatmap,
  type HeatmapItem,
} from "@/components/global/ActivityHeatmap";
import { formatDateLocal, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { Habit } from "../types";

interface HabitsHeatmapProps {
  habits: Habit[];
}

export function HabitsHeatmap({ habits }: HabitsHeatmapProps) {
  const currentYear = new Date().getFullYear();
  const moduleColor = getModuleColor("habits");
  const theme = getColorTheme(moduleColor);

  const positiveHabits = useMemo(
    () => habits.filter((h) => h.habitType === "Positive" && !h.archived),
    [habits],
  );

  const { activityData, totalCompletions, activeDays, maxRecord } =
    useMemo(() => {
      const map: Record<string, string[]> = {};
      const activeSet = new Set<string>();
      let totalDone = 0;
      let maxDay = 0;

      for (const habit of positiveHabits) {
        if (habit.completedDates) {
          for (const rawDate of habit.completedDates) {
            const cleanDate = formatDateLocal(rawDate);
            if (!cleanDate) continue;

            if (cleanDate.startsWith(String(currentYear))) {
              activeSet.add(cleanDate);
            }

            if (!map[cleanDate]) map[cleanDate] = [];
            if (!map[cleanDate].includes(habit.name)) {
              map[cleanDate].push(habit.name);
            }
          }
        }
      }

      const data: Record<string, HeatmapItem> = {};
      for (const [dateStr, list] of Object.entries(map)) {
        data[dateStr] = {
          count: list.length,
          details: `${list.length} ${list.length === 1 ? "hábito" : "hábitos"}: ${list.join(", ")}`,
        };
        if (dateStr.startsWith(String(currentYear))) {
          totalDone += list.length;
          maxDay = Math.max(maxDay, list.length);
        }
      }

      return {
        activityData: data,
        totalCompletions: totalDone,
        activeDays: activeSet.size,
        maxRecord: maxDay,
      };
    }, [positiveHabits, currentYear]);

  return (
    <ActivityHeatmap
      color={moduleColor}
      title="Mapa de Constância"
      subtitle="Frequência de hábitos concluídos por ano"
      icon={Activity}
      data={activityData}
      unitLabel="hábitos"
      stats={[
        {
          label: "Conclusões",
          value: totalCompletions,
          colorClass: theme.text,
        },
        { label: "Dias ativos", value: activeDays },
        {
          label: "Recorde diário",
          value: `${maxRecord}`,
          colorClass: "text-amber-400",
        },
      ]}
    />
  );
}
