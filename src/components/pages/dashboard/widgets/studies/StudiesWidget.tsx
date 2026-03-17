"use client";

import { BookOpen } from "lucide-react";
import type { StudySession } from "../../types";
import { BaseWidget } from "../BaseWidget";

interface EstudosWidgetProps {
  sessions: StudySession[];
  weekHours: number;
  weekQuestions: number;
  goalWeekHours: number | null;
  goalWeekQuestions: number | null;
  isEditMode?: boolean;
}

export function EstudosWidget({
  sessions,
  weekHours,
  weekQuestions,
  goalWeekHours,
  goalWeekQuestions,
  isEditMode,
}: EstudosWidgetProps) {
  const weekProgress = goalWeekHours
    ? Math.min(100, Math.round((weekHours / goalWeekHours) * 100))
    : 0;

  return (
    <BaseWidget
      title="Estudos"
      icon={BookOpen}
      iconColor="text-violet-400"
      route="studies"
      isEditMode={isEditMode}
    >
      <div className="flex flex-col gap-[5cqw] @sm:gap-4">
        <div className="flex items-center gap-[7cqw] @sm:gap-8">
          <div className="flex-1">
            <div className="flex items-baseline gap-1">
              <span className="text-[7.5cqw] @sm:text-4xl font-bold text-white tabular-nums min-text-[22px]">
                {weekHours.toFixed(1)}
              </span>
              <span className="text-[3.5cqw] @sm:text-sm font-medium text-neutral-500">
                h
              </span>
            </div>
            <p className="text-[3cqw] @sm:text-xs font-medium text-neutral-500">
              Esta semana
            </p>
          </div>
          <div className="w-px h-10 bg-neutral-800" />
          <div className="flex-1">
            <div className="flex items-baseline gap-1">
              <span className="text-[7.5cqw] @sm:text-4xl font-bold text-white tabular-nums min-text-[22px]">
                {weekQuestions}
              </span>
            </div>
            <p className="text-[3cqw] @sm:text-xs font-medium text-neutral-500">
              Questões
            </p>
          </div>
        </div>

        {goalWeekHours !== null && (
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px] font-medium">
              <span className="text-neutral-400">
                {weekHours.toFixed(1)}h de {goalWeekHours}h
              </span>
              <span className="text-violet-400">{weekProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all duration-500"
                style={{ width: `${weekProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="space-y-[1.5cqw] @sm:space-y-1.5 mt-1">
          {sessions.slice(0, 3).map((s, i) => (
            <div
              key={s.id ?? i}
              className="flex items-center gap-[2cqw] @sm:gap-2 p-[2cqw] @sm:p-2 rounded-xl bg-neutral-800/30 border border-neutral-800/50"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-violet-500/60" />
              <span className="text-[3cqw] @sm:text-xs font-medium text-neutral-400 truncate flex-1">
                {s.subject}
              </span>
              <span className="text-[2.5cqw] @sm:text-[10px] font-bold text-violet-400 bg-violet-400/10 px-1.5 py-0.5 rounded-md">
                {s.hours}h
              </span>
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="text-xs text-neutral-600 italic">
              Nenhuma sessão registrada
            </p>
          )}
        </div>
      </div>
    </BaseWidget>
  );
}
