"use client";

import { useMemo, useState } from "react";
import { getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import { HeatmapFooter } from "./components/heatmapFooter";
import { HeatmapGrid } from "./components/heatmapGrid";
import { HeatmapHeader } from "./components/heatmapHeader";
import { INTENSITY_LEVELS, MONTH_LABELS, WEEK_LABELS } from "./constants";
import type { StudySession } from "./types";

// Utilitários de Data
function getIntensity(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

function getYearDates(year: number): string[] {
  const dates: string[] = [];
  const firstJan = new Date(year, 0, 1);
  const startDay = new Date(firstJan);

  // Inicia no domingo (0)
  const diff = -startDay.getDay();
  startDay.setDate(startDay.getDate() + diff);

  const lastDec = new Date(year, 11, 31);
  const endDay = new Date(lastDec);
  // Finaliza no sábado (6)
  const diffEnd = 6 - endDay.getDay();
  endDay.setDate(endDay.getDate() + diffEnd);

  const current = new Date(startDay);
  while (current <= endDay) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const d = String(current.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export function StudiesHeatmap({ sessions }: { sessions: StudySession[] }) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const years = useMemo(() => {
    const s = new Set<number>();
    s.add(currentYear);
    for (const sess of sessions) {
      const y = Number(sess.date.slice(0, 4));
      if (!Number.isNaN(y)) s.add(y);
    }
    return Array.from(s).sort((a, b) => b - a);
  }, [sessions, currentYear]);

  const dates = useMemo(() => getYearDates(selectedYear), [selectedYear]);

  const statsMap = useMemo(() => {
    const m: Record<
      string,
      { questions: number; hours: number; count: number }
    > = {};
    const filtered = sessions.filter((s) =>
      s.date.startsWith(String(selectedYear)),
    );
    for (const s of filtered) {
      if (!m[s.date]) m[s.date] = { questions: 0, hours: 0, count: 0 };
      m[s.date].questions += s.questionsNew + s.questionsReview;
      m[s.date].hours += s.hours;
      m[s.date].count += 1;
    }
    return m;
  }, [sessions, selectedYear]);

  const totalQuestions = useMemo(
    () =>
      Object.values(statsMap).reduce((acc, curr) => acc + curr.questions, 0),
    [statsMap],
  );

  const totalHours = useMemo(
    () => Object.values(statsMap).reduce((acc, curr) => acc + curr.hours, 0),
    [statsMap],
  );

  const totalSessions = useMemo(
    () => Object.values(statsMap).reduce((acc, curr) => acc + curr.count, 0),
    [statsMap],
  );

  const monthLabels = useMemo(() => {
    const labels: Array<{ label: string; colIdx: number }> = [];
    let lastMonth = -1;
    for (let ci = 0; ci < dates.length / 7; ci++) {
      const dateStr = dates[ci * 7 + 3];
      const [y, m, d] = dateStr.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      if (date.getFullYear() !== selectedYear) continue;
      const month = date.getMonth();
      if (month !== lastMonth) {
        labels.push({ label: MONTH_LABELS[month], colIdx: ci });
        lastMonth = month;
      }
    }
    return labels;
  }, [dates, selectedYear]);

  const color = getModuleColor("studies");
  const theme = getColorTheme(color);

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-6 w-full  relative overflow-hidden">
      <HeatmapHeader
        selectedYear={selectedYear}
        currentYear={currentYear}
        totalQuestions={totalQuestions}
        totalHours={totalHours}
        totalSessions={totalSessions}
        onPrevYear={() => setSelectedYear((prev) => prev - 1)}
        onNextYear={() => setSelectedYear((prev) => prev + 1)}
        theme={theme}
      />

      <HeatmapGrid
        dates={dates}
        weekLabels={WEEK_LABELS}
        monthLabels={monthLabels}
        selectedYear={selectedYear}
        statsMap={statsMap}
        intensityLevels={INTENSITY_LEVELS}
        getIntensity={getIntensity}
        theme={theme}
      />

      <HeatmapFooter
        years={years}
        selectedYear={selectedYear}
        onYearSelect={setSelectedYear}
        intensityLevels={INTENSITY_LEVELS}
        theme={theme}
      />
    </div>
  );
}
