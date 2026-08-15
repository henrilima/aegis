"use client";

import { BookOpen } from "lucide-react";
import { useMemo } from "react";
import {
  ActivityHeatmap,
  type HeatmapItem,
} from "@/components/global/ActivityHeatmap";
import { formatDateLocal, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { StudySession } from "./types";

export function StudiesHeatmap({ sessions }: { sessions: StudySession[] }) {
  const currentYear = new Date().getFullYear();
  const color = getModuleColor("studies");
  const theme = getColorTheme(color);

  const { activityData, totalSessions, totalQuestions, totalHours } =
    useMemo(() => {
      const data: Record<
        string,
        { count: number; hours: number; questions: number }
      > = {};
      let sessionsCount = 0;
      let questionsCount = 0;
      let hoursCount = 0;

      for (const sess of sessions) {
        const dateStr = formatDateLocal(sess.date);
        if (!dateStr) continue;

        if (!data[dateStr]) {
          data[dateStr] = { count: 0, hours: 0, questions: 0 };
        }
        data[dateStr].count += 1;

        const q = sess.questionsNew + sess.questionsReview;
        const h = sess.hours;
        data[dateStr].questions += q;
        data[dateStr].hours += h;

        if (dateStr.startsWith(String(currentYear))) {
          sessionsCount += 1;
          questionsCount += q;
          hoursCount += h;
        }
      }

      // Converte para HeatmapItem com detalhes
      const finalData: Record<string, HeatmapItem> = {};
      for (const [dateStr, info] of Object.entries(data)) {
        finalData[dateStr] = {
          count: info.count,
          details: `${info.count} ${info.count === 1 ? "sessão" : "sessões"} · ${info.hours.toFixed(1)}h · ${info.questions} questões`,
        };
      }

      return {
        activityData: finalData,
        totalSessions: sessionsCount,
        totalQuestions: questionsCount,
        totalHours: hoursCount,
      };
    }, [sessions, currentYear]);

  return (
    <ActivityHeatmap
      color={color}
      title="Mapa de Constância"
      subtitle="Frequência de sessões de estudo por ano"
      icon={BookOpen}
      data={activityData}
      unitLabel="sessões"
      stats={[
        { label: "Sessões", value: totalSessions, colorClass: theme.text },
        { label: "Questões", value: totalQuestions },
        {
          label: "Horas de estudo",
          value: `${totalHours.toFixed(1)}h`,
          colorClass: "text-foreground",
        },
      ]}
    />
  );
}
