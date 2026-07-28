"use client";

import { BookOpen, Clock, MapPin, Play, User } from "lucide-react";
import { useMemo } from "react";
import { resolveColor } from "@/colors.config";
import type { SubjectMeta } from "@/components/modules/grades/types";
import { Button } from "@/components/ui/button";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { StudySchedule, StudySession } from "../../../studies/types";
import { BaseWidget } from "../BaseWidget";

interface ScheduleWidgetProps {
  schedules: StudySchedule[];
  subjects: SubjectMeta[];
  time: Date;
  onAddSession?: (session: StudySession) => Promise<void>;
  isEditMode?: boolean;
  isInteractive?: boolean;
  onToggleInteractive?: () => void;
}

export function ScheduleWidget({
  schedules = [],
  subjects = [],
  time,
  onAddSession,
  isEditMode,
  isInteractive,
  onToggleInteractive,
}: ScheduleWidgetProps) {
  const color = getModuleColor("studies");
  const theme = getColorTheme(color);

  // Mapeamento de cores das matérias
  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of subjects) {
      map[s.name] = s.color;
    }
    return map;
  }, [subjects]);

  const timeToMinutes = (tStr: string) => {
    const [h, m] = tStr.split(":").map(Number);
    return h * 60 + m;
  };

  const currentDayId = time.getDay();
  const nowHours = time.getHours();
  const nowMinutes = time.getMinutes();
  const currentMinutes = nowHours * 60 + nowMinutes;

  const todaySchedules = schedules.filter((s) => s.dayOfWeek === currentDayId);

  // Aula ocorrendo agora
  const activeClass = todaySchedules.find((s) => {
    const start = timeToMinutes(s.startTime);
    const end = timeToMinutes(s.endTime);
    return currentMinutes >= start && currentMinutes < end;
  });

  // Próxima aula de hoje
  const nextClass = todaySchedules
    .filter((s) => timeToMinutes(s.startTime) > currentMinutes)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))[0];

  // Próxima aula em outro dia
  let nextClassAnyDay: StudySchedule | null = null;
  let nextClassDayName = "";
  if (!activeClass && !nextClass) {
    for (let i = 1; i <= 7; i++) {
      const targetDayId = (currentDayId + i) % 7;
      const daySchedules = schedules
        .filter((s) => s.dayOfWeek === targetDayId)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      if (daySchedules.length > 0) {
        nextClassAnyDay = daySchedules[0];
        const dayNames = [
          "Domingo",
          "Segunda",
          "Terça",
          "Quarta",
          "Quinta",
          "Sexta",
          "Sábado",
        ];
        nextClassDayName = dayNames[targetDayId];
        break;
      }
    }
  }

  const handleQuickRegister = async (item: StudySchedule) => {
    if (!onAddSession) return;
    const start = timeToMinutes(item.startTime);
    const end = timeToMinutes(item.endTime);
    const durationHours = Math.round(((end - start) / 60) * 100) / 100;

    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;

    const newSession = {
      userId: item.userId || "",
      date: dateStr,
      subject: item.subject,
      hours: durationHours,
      questionsNew: 0,
      questionsReview: 0,
      correctNew: 0,
      correctReview: 0,
      note: "Presença registrada via grade de horários.",
    };

    await onAddSession(newSession);
  };

  const renderWidgetContent = () => {
    if (schedules.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <p className="text-xs text-neutral-600 font-bold">Grade Vazia</p>
          <p className="text-[10px] text-neutral-600 font-medium max-w-[180px] mt-1">
            Cadastre suas aulas no módulo de estudos para vê-las aqui.
          </p>
        </div>
      );
    }

    if (activeClass) {
      const start = timeToMinutes(activeClass.startTime);
      const end = timeToMinutes(activeClass.endTime);
      const total = end - start;
      const elapsed = currentMinutes - start;
      const progressPercent = Math.max(
        0,
        Math.min(100, (elapsed / total) * 100),
      );
      const minutesRemaining = end - currentMinutes;

      const subjectColor = colorMap[activeClass.subject] || "slate";
      const hex = resolveColor(subjectColor);

      return (
        <div className="flex flex-col gap-3.5 text-left h-full justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                style={{ backgroundColor: hex }}
                className="w-2 h-2 rounded-full shrink-0"
              />
              <span className="text-[10px] font-bold text-neutral-600">
                Aula em andamento
              </span>
            </div>
            <h4 className="text-base font-bold text-foreground leading-tight truncate">
              {activeClass.subject}
            </h4>
            <div className="flex flex-col gap-1 text-[10px] text-neutral-500 font-medium">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {activeClass.startTime} - {activeClass.endTime}
                </span>
              </div>
              {activeClass.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{activeClass.location}</span>
                </div>
              )}
              {activeClass.teacher && (
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{activeClass.teacher}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold">
              <span className="text-muted-foreground">
                Termina em {minutesRemaining} min
              </span>
              <span style={{ color: hex }}>{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                style={{ width: `${progressPercent}%`, backgroundColor: hex }}
                className="h-full rounded-full transition-all duration-300"
              />
            </div>
          </div>

          {isInteractive && (
            <Button
              size="sm"
              onClick={() => handleQuickRegister(activeClass)}
              className={cn(
                "w-full h-8 text-[11px] font-bold gap-1 cursor-pointer text-white",
                theme.solid,
                theme.solidHover,
              )}
            >
              <Play className="w-3 h-3 fill-current" />
              Registrar Aula Estudada
            </Button>
          )}
        </div>
      );
    }

    if (nextClass) {
      const minutesToStart =
        timeToMinutes(nextClass.startTime) - currentMinutes;
      const subjectColor = colorMap[nextClass.subject] || "slate";
      const hex = resolveColor(subjectColor);

      return (
        <div className="flex flex-col gap-3 text-left h-full justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                style={{ backgroundColor: hex }}
                className="w-2 h-2 rounded-full shrink-0"
              />
              <span className="text-[10px] font-bold text-neutral-600">
                Próxima aula hoje
              </span>
            </div>
            <h4 className="text-base font-bold text-foreground leading-tight truncate">
              {nextClass.subject}
            </h4>
            <div className="flex flex-col gap-1 text-[10px] text-neutral-500 font-medium">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Inicia às {nextClass.startTime} ({minutesToStart} min)
                </span>
              </div>
              {nextClass.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{nextClass.location}</span>
                </div>
              )}
            </div>
          </div>

          {isInteractive && (
            <Button
              size="sm"
              onClick={() => handleQuickRegister(nextClass)}
              className={cn(
                "w-full h-8 text-[11px] font-bold gap-1 cursor-pointer text-white",
                theme.solid,
                theme.solidHover,
              )}
            >
              <Play className="w-3 h-3 fill-current" />
              Estudar Adiantado
            </Button>
          )}
        </div>
      );
    }

    if (nextClassAnyDay) {
      const subjectColor = colorMap[nextClassAnyDay.subject] || "slate";
      const hex = resolveColor(subjectColor);

      return (
        <div className="flex flex-col gap-3 text-left h-full justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                style={{ backgroundColor: hex }}
                className="w-2 h-2 rounded-full shrink-0"
              />
              <span className="text-[10px] font-bold text-neutral-600">
                Próxima aula
              </span>
            </div>
            <h4 className="text-base font-bold text-foreground leading-tight truncate">
              {nextClassAnyDay.subject}
            </h4>
            <div className="flex flex-col gap-1 text-[10px] text-neutral-500 font-medium">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {nextClassDayName} às {nextClassAnyDay.startTime}
                </span>
              </div>
              {nextClassAnyDay.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{nextClassAnyDay.location}</span>
                </div>
              )}
            </div>
          </div>

          {isInteractive && (
            <Button
              size="sm"
              onClick={() =>
                nextClassAnyDay && handleQuickRegister(nextClassAnyDay)
              }
              className={cn(
                "w-full h-8 text-[11px] font-bold gap-1 cursor-pointer text-white",
                theme.solid,
                theme.solidHover,
              )}
            >
              <Play className="w-3 h-3 fill-current" />
              Estudar Matéria
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <p className="text-xs text-neutral-600 font-bold">Sem mais aulas</p>
        <p className="text-[10px] text-neutral-600 font-medium mt-1">
          Nenhuma aula agendada para os próximos dias.
        </p>
      </div>
    );
  };

  return (
    <BaseWidget
      title="Grade Horária"
      icon={BookOpen}
      color={color}
      route="studies"
      isEditMode={isEditMode}
      isInteractive={isInteractive}
      onToggleInteractive={onToggleInteractive}
    >
      <div className="h-full flex flex-col justify-center">
        {renderWidgetContent()}
      </div>
    </BaseWidget>
  );
}
