"use client";

import { BookOpen, Plus } from "lucide-react";
import { useState } from "react";
import { SessionModal } from "@/components/modules/studies/components/studiesModals";
import { formatHours } from "@/components/modules/studies/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { StudySession } from "../../../studies/types";
import { BaseWidget } from "../BaseWidget";

interface StudiesWidgetProps {
  sessions: StudySession[];
  weekHours: number;
  weekQuestions: number;
  goalWeekHours: number | null;
  goalWeekQuestions: number | null;
  onAddSession?: (session: StudySession) => void;
  allSubjects?: string[];
  isEditMode?: boolean;
  isInteractive?: boolean;
  onToggleInteractive?: () => void;
}

export function StudiesWidget({
  sessions,
  weekHours,
  weekQuestions,
  goalWeekHours,
  onAddSession,
  allSubjects = [],
  isEditMode,
  isInteractive,
  onToggleInteractive,
}: StudiesWidgetProps) {
  const { user } = useAuth();
  const color = getModuleColor("studies");
  const theme = getColorTheme(color);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const hourProgress =
    goalWeekHours && goalWeekHours > 0
      ? Math.min(100, (weekHours / goalWeekHours) * 100)
      : 0;

  return (
    <>
      <BaseWidget
        title="Estudos"
        icon={BookOpen}
        color={color}
        route="studies"
        isEditMode={isEditMode}
        isInteractive={isInteractive}
        onToggleInteractive={onToggleInteractive}
      >
        <div className="flex flex-col gap-[6cqw] @sm:gap-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-[4cqw] @sm:gap-4">
              <div className="text-left">
                <p className="text-2xl @sm:text-3xl font-bold text-foreground leading-none">
                  {weekHours.toFixed(1)}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground mt-1">
                  Horas / Semana
                </p>
              </div>
              <div className="w-px h-8 bg-muted" />
              <div className="text-left">
                <p className="text-2xl @sm:text-3xl font-bold text-foreground leading-none">
                  {weekQuestions}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground mt-1">
                  Questões
                </p>
              </div>
            </div>

            {isInteractive && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  setIsModalOpen(true);
                }}
                className={cn(
                  "h-7 px-2.5 text-xs font-bold rounded-lg border-none gap-1 active:scale-95 transition-all text-white",
                  theme.solid,
                  theme.solidHover,
                )}
              >
                <Plus className="w-3 h-3" />
                <span className="hidden @sm:inline">Sessão</span>
              </Button>
            )}
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
              <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    theme.solid,
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
                className="flex items-center justify-between p-3 rounded-xl border border-border bg-card transition-all hover:bg-muted/30 gap-4"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={cn(
                      "shrink-0 p-2 rounded-xl bg-violet-500/10 border border-violet-500/20",
                      theme.text,
                    )}
                  >
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1 gap-0.5 text-left">
                    <span className="text-sm font-bold text-foreground truncate">
                      {s.subject}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-muted-foreground truncate max-w-30">
                        {s.topic || "Sessão de estudo"}
                      </span>
                      {(s.questionsNew ?? 0) + (s.questionsReview ?? 0) > 0 && (
                        <span className="text-[10px] font-bold text-muted-foreground">
                          · {(s.questionsNew ?? 0) + (s.questionsReview ?? 0)}{" "}
                          questões
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center">
                  <div
                    className={cn(
                      "flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-bold capitalize shrink-0",
                      "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
                    )}
                  >
                    <span>{formatHours(s.hours)}</span>
                  </div>
                </div>
              </div>
            ))}
            {sessions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <p className="text-xs text-neutral-600 font-bold">
                  Sem Registros
                </p>
                <p className="text-[10px] text-neutral-600 font-medium max-w-45 mt-1">
                  Registre suas sessões de estudo para acompanhar seu progresso
                  semanal.
                </p>
              </div>
            )}
          </div>
        </div>
      </BaseWidget>

      <SessionModal
        show={isModalOpen}
        userId={String(user?.id)}
        existingSubjects={allSubjects}
        onSave={async (session) => {
          onAddSession?.(session);
          setIsModalOpen(false);
        }}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

export { StudiesWidget as EstudosWidget };
