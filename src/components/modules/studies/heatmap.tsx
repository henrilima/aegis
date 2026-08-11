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
      const data: Record<string, HeatmapItem> = {};
      let sessionsCount = 0;
      let questionsCount = 0;
      let hoursCount = 0;

      for (const sess of sessions) {
        const dateStr = formatDateLocal(sess.date);
        if (!dateStr) continue;

        if (!data[dateStr]) {
          data[dateStr] = { count: 0, details: "" };
        }
        data[dateStr].count += 1;

        const q = sess.questionsNew + sess.questionsReview;
        const h = sess.hours;

        if (dateStr.startsWith(String(currentYear))) {
          sessionsCount += 1;
          questionsCount += q;
          hoursCount += h;
        }
      }

      // Detalhes amigáveis para tooltip
      for (const sess of sessions) {
        const dateStr = formatDateLocal(sess.date);
        if (!dateStr) continue;

        const daySessions = sessions.filter(
          (s) => formatDateLocal(s.date) === dateStr,
        );
        const q = daySessions.reduce(
          (acc, curr) => acc + curr.questionsNew + curr.questionsReview,
          0,
        );
        const h = daySessions.reduce((acc, curr) => acc + curr.hours, 0);

        data[dateStr].details =
          `${daySessions.length} ${daySessions.length === 1 ? "sessão" : "sessões"} · ${h.toFixed(1)}h · ${q} questões`;
      }

      return {
        activityData: data,
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
        { label: "SESSÕES", value: totalSessions, colorClass: theme.text },
        { label: "QUESTÕES", value: totalQuestions },
        {
          label: "ESTUDO",
          value: `${totalHours.toFixed(1)}h`,
          colorClass: "text-foreground",
        },
      ]}
    />
  );
}
