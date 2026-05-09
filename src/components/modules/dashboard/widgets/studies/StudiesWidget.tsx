"use client";

import { GraduationCap } from "lucide-react";
import { formatHours } from "@/components/modules/studies/utils";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { StudySession } from "../../types";
import { BaseWidget } from "../BaseWidget";

interface EstudosWidgetProps {
  sessions: StudySession[];
  weekHours: number;
  weekQuestions: number;
  goalWeekHours: number;
  goalWeekQuestions: number;
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
  const color = getModuleColor("studies");
  const theme = getColorTheme(color);
  const hourProgress = Math.min(100, (weekHours / goalWeekHours) * 100);
  const _questionProgress = Math.min(
    100,
    (weekQuestions / goalWeekQuestions) * 100,
  );

  return (
    <BaseWidget
      title="Estudos"
      icon={GraduationCap}
      color={color}
      route="studies"
      isEditMode={isEditMode}
    >
      <div className="flex flex-col gap-[5cqw] @sm:gap-4">
        <div className="flex items-center gap-[7cqw] @sm:gap-8">
          <div className="flex-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl @sm:text-3xl font-black text-foreground tabular-nums">
                {weekHours.toFixed(1)}
              </span>
              <span className="text-xs font-bold text-muted-foreground uppercase">
                h
              </span>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
              Esta semana
            </p>
          </div>
          <div className="w-px h-10 bg-muted" />
          <div className="flex-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl @sm:text-3xl font-black text-foreground tabular-nums">
                {weekQuestions}
              </span>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
              Questões
            </p>
          </div>
        </div>

        {goalWeekHours !== null && (
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px] font-medium">
              <span className="text-muted-foreground">
                <span className={theme.text}>{weekHours.toFixed(1)}h</span> de{" "}
                <span className={theme.text}>{goalWeekHours}h</span>
              </span>
              <span className={theme.text}>{Math.round(hourProgress)}%</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  theme.solid.replace("bg-", "bg-"),
                )}
                style={{ width: `${hourProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="space-y-[1.5cqw] @sm:space-y-1.5 mt-1">
          {sessions.slice(0, 3).map((s, i) => (
            <div
              key={s.id ?? i}
              className="flex items-center gap-[2cqw] @sm:gap-2 p-[2cqw] @sm:p-2 rounded-xl bg-neutral-800/30 border border-border/50"
            >
              <div
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  theme.text.replace("text-", "bg-").concat("/60"),
                )}
              />
              <span className="text-[3cqw] @sm:text-xs font-medium text-muted-foreground truncate flex-1">
                {s.subject}
              </span>
              <span
                className={cn(
                  "text-[2.5cqw] @sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap",
                  theme.text,
                  theme.bg,
                )}
              >
                {formatHours(s.hours)}
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
